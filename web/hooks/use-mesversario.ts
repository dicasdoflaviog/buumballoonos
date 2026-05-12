'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Customer } from './use-customers'

export interface MesversarioMonth {
  id: string
  contract_id: string
  month_number: number
  scheduled_date: string
  theme: string | null
  status: 'agendado' | 'tema_confirmado' | 'produzindo' | 'pronto' | 'entregue' | 'cancelado'
  order_id: string | null
  delivery_type: string
  created_at: string
}

export interface MesversarioContract {
  id: string
  customer_id: string
  baby_name: string
  baby_gender: string | null
  birth_date: string
  plan_type: string
  start_date: string
  monthly_price: number
  annual_discount_applied: boolean
  status: 'ativo' | 'pausado' | 'cancelado' | 'concluido'
  created_at: string
}

export interface ContractWithRelations extends MesversarioContract {
  customers?: { id: string; full_name: string; phone: string }
  mesversario_months?: MesversarioMonth[]
}

export function useContracts() {
  const [contracts, setContracts] = useState<ContractWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContracts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    // Busca contratos com os meses futuros para achar a "próxima data"
    const { data, error: err } = await supabase
      .from('mesversario_contracts')
      .select(`
        *,
        customers(id, full_name, phone),
        mesversario_months(id, month_number, scheduled_date, status)
      `)
      .order('created_at', { ascending: false })

    if (err) setError(err.message)
    else setContracts((data as unknown as ContractWithRelations[]) ?? [])
    
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  return { contracts, isLoading, error, refetch: fetchContracts }
}

export function useContract(id: string) {
  const [contract, setContract] = useState<ContractWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContract = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: err } = await supabase
      .from('mesversario_contracts')
      .select(`
        *,
        customers(*),
        mesversario_months(*)
      `)
      .eq('id', id)
      .single()

    if (err) setError(err.message)
    else {
      // Ordernar meses
      if (data && data.mesversario_months) {
        data.mesversario_months.sort((a: any, b: any) => a.month_number - b.month_number)
      }
      setContract(data as unknown as ContractWithRelations)
    }
    
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  return { contract, isLoading, error, refetch: fetchContract }
}
