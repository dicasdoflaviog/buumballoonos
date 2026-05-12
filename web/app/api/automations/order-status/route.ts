import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { onOrderStatusChange, type OrderStatus, type OrderForAutomation, type CustomerForAutomation } from '@/lib/whatsapp/automations'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { order, status, customer } = await req.json() as {
      order: OrderForAutomation
      status: OrderStatus
      customer: CustomerForAutomation
    }

    await onOrderStatusChange(order, status, customer)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API/automations/order-status]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
