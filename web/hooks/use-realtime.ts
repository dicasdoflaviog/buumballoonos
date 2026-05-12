'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type RealtimeCallback = (payload: any) => void

export function useOrdersRealtime(callback: RealtimeCallback) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const supabase = createClient()
    const channelName = 'orders_realtime_ui'
    
    // Check if channel already exists
    const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
    if (existingChannel) return

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (callbackRef.current) callbackRef.current(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // Empty dependency array prevents re-subscribing on every render
}

export function usePaymentsRealtime(orderId: string, callback: RealtimeCallback) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()
    const channelName = `payments_realtime_${orderId}`
    
    const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
    if (existingChannel) return

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `order_id=eq.${orderId}` },
        (payload) => {
          if (callbackRef.current) callbackRef.current(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId]) // Re-run only if orderId changes
}
