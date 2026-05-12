'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { onOrderStatusChange, type OrderStatus, type OrderForAutomation, type CustomerForAutomation } from '@/lib/whatsapp/automations'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface OrderFilters {
  status?: string | string[]
  customer_id?: string
  date_from?: string
  date_to?: string
}

export interface Order {
  id: string
  order_number: number
  customer_id: string
  status: string
  delivery_type: string
  pickup_datetime: string
  subtotal: number
  total: number
  notes: string | null
  occasion_tag: string | null
  created_at: string
  updated_at: string
  customers?: { full_name: string; phone: string }
}

export interface OrderWithDetails extends Order {
  order_items: OrderItem[]
  payments: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  unit_price_override: number | null
  notes: string | null
  created_at: string
  products?: { name: string; category: string }
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: string
  status: string
  mp_payment_id: string | null
  received_at: string | null
  notes: string | null
  created_at: string
}

// ─── useOrders ─────────────────────────────────────────────────────────────────

export function useOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    let query = supabase
      .from('orders')
      .select('*, customers(full_name, phone)')
      .order('pickup_datetime', { ascending: true })

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    if (filters?.date_from) {
      query = query.gte('pickup_datetime', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('pickup_datetime', filters.date_to)
    }

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
    } else {
      setOrders((data as Order[]) ?? [])
    }
    setIsLoading(false)
  }, [filters?.status, filters?.customer_id, filters?.date_from, filters?.date_to]) // eslint-disable-line

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => { fetchOrders() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  return { orders, isLoading, error, refetch: fetchOrders }
}

// ─── useOrder ──────────────────────────────────────────────────────────────────

export function useOrder(id: string) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: err } = await supabase
      .from('orders')
      .select(`
        *,
        customers(full_name, phone),
        order_items(*, products(name, category)),
        payments(*)
      `)
      .eq('id', id)
      .single()

    if (err) {
      setError(err.message)
    } else {
      setOrder(data as OrderWithDetails)
    }
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Realtime para este pedido específico
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`order-${id}-realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => { fetchOrder() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items', filter: `order_id=eq.${id}` },
        () => { fetchOrder() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `order_id=eq.${id}` },
        () => { fetchOrder() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, fetchOrder])

  return { order, isLoading, error, refetch: fetchOrder }
}

// ─── updateOrderStatus ────────────────────────────────────────────────────────

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  const supabase = createClient()

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, customers(full_name, phone)')
    .single()

  if (orderErr) throw orderErr

  // Disparar automação de WhatsApp via API route (server-side)
  if (order?.customers) {
    const orderData: OrderForAutomation = {
      id: order.id,
      order_number: order.order_number,
      pickup_datetime: order.pickup_datetime,
      total: order.total,
      customer_id: order.customer_id,
    }
    const customerData: CustomerForAutomation = {
      id: order.customer_id,
      full_name: (order.customers as { full_name: string; phone: string }).full_name,
      phone: (order.customers as { full_name: string; phone: string }).phone,
    }

    // Chamar via API route para executar no servidor (evitar CORS e env vars client)
    await fetch('/api/automations/order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: orderData, status, customer: customerData }),
    }).catch(console.error)
  }
}
