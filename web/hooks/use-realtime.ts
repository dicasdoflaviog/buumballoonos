'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type RealtimeCallback = (payload: any) => void

export function useOrdersRealtime(callback: RealtimeCallback) {
  const callbackRef = useRef(callback)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (channelRef.current) return

    const supabase = createClient()
    const channelName = 'orders_realtime_ui'

    const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
    if (existingChannel) {
      channelRef.current = existingChannel
      return
    }

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

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])
}

export function usePaymentsRealtime(orderId: string, callback: RealtimeCallback) {
  const callbackRef = useRef(callback)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!orderId || channelRef.current) return
    const supabase = createClient()
    const channelName = `payments_realtime_${orderId}`
    
    const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
    if (existingChannel) {
      channelRef.current = existingChannel
      return
    }

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

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [orderId])
}
