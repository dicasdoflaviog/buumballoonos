'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addMonths, parseISO, formatISO } from 'date-fns'
import { MESVERSARIO_PLANS } from '@/lib/utils/constants'

export interface CreateContractInput {
  customer_id: string
  baby_name: string
  baby_gender?: string
  birth_date: string
  plan_type: string
  start_date: string
  annual_discount_applied: boolean
}

export async function createContract(data: CreateContractInput) {
  const supabase = await createClient()

  const plan = MESVERSARIO_PLANS[data.plan_type]
  if (!plan) throw new Error('Plano inválido')

  let finalPrice = plan.price
  if (data.annual_discount_applied) {
    // Exemplo: 10% de desconto no plano anual
    finalPrice = Math.round(finalPrice * 0.9)
  }

  // 1. Criar o Contrato
  const { data: contract, error: contractErr } = await supabase
    .from('mesversario_contracts')
    .insert({
      customer_id: data.customer_id,
      baby_name: data.baby_name,
      baby_gender: data.baby_gender || null,
      birth_date: data.birth_date,
      plan_type: data.plan_type,
      start_date: data.start_date,
      monthly_price: finalPrice,
      annual_discount_applied: data.annual_discount_applied,
      status: 'ativo'
    })
    .select()
    .single()

  if (contractErr || !contract) throw new Error(contractErr?.message || 'Erro ao criar contrato')

  // 2. Gerar os 12 meses
  const startDate = parseISO(data.start_date)
  const monthsData = []

  for (let i = 1; i <= 12; i++) {
    // Se o primeiro mês é o mês 1, ele é entregue no start_date.
    // O mês 2 no (start_date + 1 mês), etc.
    const scheduledDate = addMonths(startDate, i - 1)
    
    monthsData.push({
      contract_id: contract.id,
      month_number: i,
      scheduled_date: formatISO(scheduledDate, { representation: 'date' }),
      status: 'agendado',
      delivery_type: 'retirada' // Padrão
    })
  }

  const { error: monthsErr } = await supabase
    .from('mesversario_months')
    .insert(monthsData)

  if (monthsErr) {
    // Rollback manual de mitigação
    await supabase.from('mesversario_contracts').delete().eq('id', contract.id)
    throw new Error('Erro ao gerar os 12 meses do contrato: ' + monthsErr.message)
  }

  revalidatePath('/mesversario')
  revalidatePath(`/clientes/${data.customer_id}`)
  
  return contract
}

export async function updateMonthStatus(monthId: string, status: string, theme?: string) {
  const supabase = await createClient()
  
  const payload: any = { status }
  if (theme !== undefined) payload.theme = theme

  const { error } = await supabase
    .from('mesversario_months')
    .update(payload)
    .eq('id', monthId)

  if (error) throw error
  revalidatePath('/mesversario')
  // We don't have the contract id easily here without an extra fetch, 
  // but revalidating the layout or specific path if known would be better.
}
