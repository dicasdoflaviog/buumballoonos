'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { encryptCPF, validateCPF, formatPhoneE164 } from '@/lib/utils/validators'

export interface CreateCustomerInput {
  full_name: string
  phone: string
  cpf?: string
  email?: string
  neighborhood?: string
  instagram?: string
  gender?: string
  customer_type?: string
  source?: string
}

export async function createCustomer(data: CreateCustomerInput) {
  const supabase = await createClient()

  // Validar formato de telefone
  const phoneE164 = formatPhoneE164(data.phone)
  if (!phoneE164) {
    throw new Error('Telefone inválido. Verifique o DDD e os dígitos.')
  }

  // Validar e encriptar CPF, se fornecido
  let encryptedCpf: string | null = null
  if (data.cpf && data.cpf.trim() !== '') {
    if (!validateCPF(data.cpf)) {
      throw new Error('CPF inválido.')
    }
    encryptedCpf = encryptCPF(data.cpf)
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      full_name: data.full_name,
      phone: phoneE164,
      cpf: encryptedCpf,
      email: data.email || null,
      neighborhood: data.neighborhood || null,
      instagram: data.instagram || null,
      gender: data.gender || null,
      customer_type: data.customer_type || 'pessoa_fisica',
      source: data.source || null,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/clientes')
  return customer
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerInput>) {
  const supabase = await createClient()
  
  const updatePayload: Record<string, any> = { ...data, updated_at: new Date().toISOString() }

  if (data.phone) {
    const phoneE164 = formatPhoneE164(data.phone)
    if (!phoneE164) throw new Error('Telefone inválido.')
    updatePayload.phone = phoneE164
  }

  if (data.cpf !== undefined) {
    if (data.cpf && data.cpf.trim() !== '') {
      if (!validateCPF(data.cpf)) throw new Error('CPF inválido.')
      updatePayload.cpf = encryptCPF(data.cpf)
    } else {
      updatePayload.cpf = null
    }
  }

  const { error } = await supabase.from('customers').update(updatePayload).eq('id', id)
  if (error) throw error

  revalidatePath(`/clientes/${id}`)
  revalidatePath('/clientes')
}

export async function addCustomerTag(customerId: string, tagId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('customer_tags').insert({
    customer_id: customerId,
    tag_id: tagId,
  })
  if (error) throw error
  revalidatePath(`/clientes/${customerId}`)
}

export async function removeCustomerTag(customerId: string, tagId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('customer_tags')
    .delete()
    .match({ customer_id: customerId, tag_id: tagId })
  if (error) throw error
  revalidatePath(`/clientes/${customerId}`)
}

export async function addCustomerRelationship(
  customer1Id: string, 
  customer2Id: string, 
  relationshipType: string
) {
  const supabase = await createClient()
  const { error } = await supabase.from('customer_relationships').insert({
    customer_id_1: customer1Id,
    customer_id_2: customer2Id,
    relationship_type: relationshipType,
  })
  if (error) throw error
  revalidatePath(`/clientes/${customer1Id}`)
  revalidatePath(`/clientes/${customer2Id}`)
}
