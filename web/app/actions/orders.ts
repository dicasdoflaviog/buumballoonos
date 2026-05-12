'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  customer_id: string
  delivery_type: 'retirada' | 'entrega_nossa' | 'cliente_app'
  pickup_datetime: string
  occasion_tag?: string
  notes?: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
    unit_price_override?: number
    notes?: string
  }[]
  payment?: {
    amount: number
    method: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito'
    notes?: string
  }
}

export interface UpdateOrderInput {
  delivery_type?: string
  pickup_datetime?: string
  occasion_tag?: string
  notes?: string
  status?: string
}

// ─── createOrder ──────────────────────────────────────────────────────────────

export async function createOrder(data: CreateOrderInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // 1. Calcular subtotal e total
  const subtotal = data.items.reduce((sum, item) => {
    const price = item.unit_price_override ?? item.unit_price
    return sum + price * item.quantity
  }, 0)

  // 2. Criar pedido
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      customer_id: data.customer_id,
      delivery_type: data.delivery_type,
      pickup_datetime: data.pickup_datetime,
      occasion_tag: data.occasion_tag ?? null,
      notes: data.notes ?? null,
      status: 'novo',
      subtotal,
      total: subtotal,
      created_by: user.id,
    })
    .select()
    .single()

  if (orderErr) throw orderErr

  // 3. Criar itens
  const { error: itemsErr } = await supabase.from('order_items').insert(
    data.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_price_override: item.unit_price_override ?? null,
      notes: item.notes ?? null,
    }))
  )
  if (itemsErr) throw itemsErr

  // 4. Criar pagamento inicial (se fornecido)
  if (data.payment && data.payment.amount > 0) {
    await supabase.from('payments').insert({
      order_id: order.id,
      amount: data.payment.amount,
      method: data.payment.method,
      status: 'pendente',
      notes: data.payment.notes ?? null,
    })
  }

  revalidatePath('/pedidos')
  revalidatePath('/')
  return order
}

// ─── updateOrder ──────────────────────────────────────────────────────────────

export async function updateOrder(id: string, data: UpdateOrderInput) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error

  revalidatePath(`/pedidos/${id}`)
  revalidatePath('/pedidos')
}

// ─── updateOrderStatus ────────────────────────────────────────────────────────

export async function updateOrderStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error

  revalidatePath(`/pedidos/${id}`)
  revalidatePath('/pedidos')
  revalidatePath('/')
}

// ─── addOrderItem ─────────────────────────────────────────────────────────────

export async function addOrderItem(
  orderId: string,
  item: {
    product_id: string
    quantity: number
    unit_price: number
    unit_price_override?: number
    notes?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_price_override: item.unit_price_override ?? null,
      notes: item.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error

  await calculateOrderTotal(orderId)
  revalidatePath(`/pedidos/${orderId}`)
  return data
}

// ─── updateOrderItem ──────────────────────────────────────────────────────────

export async function updateOrderItem(
  id: string,
  data: {
    quantity?: number
    unit_price_override?: number | null
    notes?: string
  }
) {
  const supabase = await createClient()

  const { error: itemErr } = await supabase
    .from('order_items')
    .update(data)
    .eq('id', id)

  if (itemErr) throw itemErr

  // Buscar order_id para recalcular total
  const { data: item } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', id)
    .single()

  if (item?.order_id) {
    await calculateOrderTotal(item.order_id)
    revalidatePath(`/pedidos/${item.order_id}`)
  }
}

// ─── removeOrderItem ──────────────────────────────────────────────────────────

export async function removeOrderItem(id: string) {
  const supabase = await createClient()

  // Buscar order_id antes de deletar
  const { data: item } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('order_items').delete().eq('id', id)
  if (error) throw error

  if (item?.order_id) {
    await calculateOrderTotal(item.order_id)
    revalidatePath(`/pedidos/${item.order_id}`)
  }
}

// ─── calculateOrderTotal ──────────────────────────────────────────────────────

export async function calculateOrderTotal(orderId: string) {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('order_items')
    .select('quantity, unit_price, unit_price_override')
    .eq('order_id', orderId)

  const subtotal = (items ?? []).reduce((sum, item) => {
    const price = item.unit_price_override ?? item.unit_price
    return sum + price * item.quantity
  }, 0)

  const { error } = await supabase
    .from('orders')
    .update({ subtotal, total: subtotal, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) throw error
  return { subtotal, total: subtotal }
}
