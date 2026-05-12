'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type RealtimeCallback = (payload: any) => void

export function useOrdersRealtime(callback: RealtimeCallback) {
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('orders_realtime_ui')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [callback])
}

export function usePaymentsRealtime(orderId: string, callback: RealtimeCallback) {
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`payments_realtime_${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `order_id=eq.${orderId}` },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, callback])
}
