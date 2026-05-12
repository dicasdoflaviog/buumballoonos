'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from './use-orders'

export interface Customer {
  id: string
  full_name: string
  phone: string
  cpf: string | null
  email: string | null
  neighborhood: string | null
  instagram: string | null
  gender: string | null
  customer_type: string
  source: string | null
  total_orders: number
  total_spent: number
  created_at: string
}

export interface CustomerWithRelations extends Customer {
  orders?: Order[]
  tags?: { tags: { id: string; name: string; color: string } }[]
}

export function useCustomers(search?: string) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    let query = supabase
      .from('customers')
      .select('*')
      .order('total_spent', { ascending: false })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,neighborhood.ilike.%${search}%`)
    }

    const { data, error: err } = await query

    if (err) setError(err.message)
    else setCustomers((data as Customer[]) ?? [])
    
    setIsLoading(false)
  }, [search])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return { customers, isLoading, error, refetch: fetchCustomers }
}

export function useCustomer(id: string) {
  const [customer, setCustomer] = useState<CustomerWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomer = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: err } = await supabase
      .from('customers')
      .select(`
        *,
        orders(*),
        tags:customer_tags(tags(id, name, color))
      `)
      .eq('id', id)
      .single()

    if (err) setError(err.message)
    else setCustomer(data as unknown as CustomerWithRelations)
    
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  return { customer, isLoading, error, refetch: fetchCustomer }
}

export async function searchCustomers(query: string): Promise<{ id: string; full_name: string; phone: string }[]> {
  if (!query || query.length < 2) return []
  const supabase = createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .ilike('full_name', `%${query}%`)
    .limit(10)
  return data ?? []
}
