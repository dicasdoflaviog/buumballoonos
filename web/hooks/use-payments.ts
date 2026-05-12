'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from './use-orders'

export type { Payment }

export interface AddPaymentInput {
  order_id: string
  amount: number
  method: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito'
  notes?: string
  mp_payment_id?: string
}

// ─── usePayments ──────────────────────────────────────────────────────────────

export function usePayments(orderId: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error: err } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (err) {
      setError(err.message)
    } else {
      setPayments((data as Payment[]) ?? [])
    }
    setIsLoading(false)
  }, [orderId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Realtime para pagamentos deste pedido
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`payments-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `order_id=eq.${orderId}`,
        },
        () => { fetchPayments() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId, fetchPayments])

  return { payments, isLoading, error, refetch: fetchPayments }
}

// ─── addPayment ───────────────────────────────────────────────────────────────

export async function addPayment(input: AddPaymentInput): Promise<Payment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('payments')
    .insert({
      order_id: input.order_id,
      amount: input.amount,
      method: input.method,
      status: 'pendente',
      notes: input.notes ?? null,
      mp_payment_id: input.mp_payment_id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Payment
}

// ─── updatePaymentStatus ──────────────────────────────────────────────────────

export async function updatePaymentStatus(
  id: string,
  status: 'pendente' | 'recebido' | 'estornado'
): Promise<void> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'recebido') {
    updateData.received_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', id)

  if (error) throw error
}
