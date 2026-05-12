import { mpPayment } from './client'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPaymentConfirmation } from '@/lib/whatsapp/automations'

/**
 * Processa webhook de pagamento do Mercado Pago.
 *
 * Fluxo:
 * 1. Busca detalhes do pagamento via API MP
 * 2. Se status === 'approved':
 *    a. Encontra o payment no banco (via mp_payment_id ou external_reference)
 *    b. Atualiza payment.status = 'recebido'
 *    c. Recalcula total pago vs total do pedido
 *    d. Se pago integralmente: atualiza order.status = 'confirmado'
 *    e. Dispara WhatsApp de confirmação
 * 3. Registra em automation_logs
 */
export async function processPaymentWebhook(paymentId: string): Promise<void> {
  const supabase = await createServiceClient()

  // ── 1. Buscar detalhes do pagamento na API do Mercado Pago ─────────────────
  let mpData: Awaited<ReturnType<typeof mpPayment.get>> | null = null

  try {
    mpData = await mpPayment.get({ id: paymentId })
  } catch (err) {
    console.error('[MP Webhook] Erro ao buscar pagamento na API MP:', err)
    await saveAutomationLog(supabase, {
      type: 'mp_payment_webhook',
      triggered_by: 'mercadopago',
      success: false,
      error_message: `Falha ao buscar pagamento ${paymentId}: ${String(err)}`,
    })
    return
  }

  if (!mpData) return

  const mpStatus = mpData.status
  const externalReference = mpData.external_reference ?? null

  // ── 2. Só processar pagamentos aprovados ───────────────────────────────────
  if (mpStatus !== 'approved') {
    console.log(`[MP Webhook] Pagamento ${paymentId} ignorado — status: ${mpStatus}`)
    return
  }

  // ── 3a. Buscar payment no banco pelo mp_payment_id ─────────────────────────
  let { data: payment } = await supabase
    .from('payments')
    .select('id, order_id, amount, status')
    .eq('mp_payment_id', paymentId)
    .maybeSingle()

  // ── 3b. Fallback: buscar pelo external_reference (order_id) ────────────────
  if (!payment && externalReference) {
    const { data: paymentByRef } = await supabase
      .from('payments')
      .select('id, order_id, amount, status')
      .eq('order_id', externalReference)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    payment = paymentByRef
  }

  if (!payment) {
    console.warn(`[MP Webhook] Nenhum payment encontrado para paymentId=${paymentId}, ref=${externalReference}`)
    await saveAutomationLog(supabase, {
      type: 'mp_payment_webhook',
      triggered_by: 'mercadopago',
      success: false,
      error_message: `Payment não encontrado: mpId=${paymentId}, ref=${externalReference}`,
    })
    return
  }

  // ── 3c. Atualizar payment.status = 'recebido' ──────────────────────────────
  await supabase
    .from('payments')
    .update({
      status: 'recebido',
      mp_payment_id: paymentId,
      mp_status: mpStatus,
      received_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  // ── 3d. Recalcular total pago vs total do pedido ───────────────────────────
  const orderId = payment.order_id

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, total, status, pickup_datetime, customer_id')
    .eq('id', orderId)
    .single()

  if (!order) {
    console.warn(`[MP Webhook] Pedido ${orderId} não encontrado`)
    return
  }

  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount, status')
    .eq('order_id', orderId)

  const totalPago = (allPayments ?? [])
    .filter((p) => p.status === 'recebido')
    .reduce((sum, p) => sum + p.amount, 0)

  // ── 3e. Se pago integralmente, confirmar pedido ────────────────────────────
  const isPaidInFull = totalPago >= order.total
  const shouldConfirm = isPaidInFull && order.status === 'novo'

  if (shouldConfirm) {
    await supabase
      .from('orders')
      .update({ status: 'confirmado', updated_at: new Date().toISOString() })
      .eq('id', orderId)
  }

  // ── 3f. Buscar cliente e disparar WhatsApp ─────────────────────────────────
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('id', order.customer_id)
    .single()

  if (customer) {
    await sendPaymentConfirmation(
      {
        id: order.id,
        order_number: order.order_number,
        pickup_datetime: order.pickup_datetime,
        total: order.total,
        customer_id: order.customer_id,
      },
      {
        id: customer.id,
        full_name: customer.full_name,
        phone: customer.phone,
      }
    )
  }

  // ── Registrar sucesso em automation_logs ───────────────────────────────────
  await saveAutomationLog(supabase, {
    type: 'mp_payment_webhook',
    triggered_by: 'mercadopago',
    entity_id: orderId,
    success: true,
  })

  console.log(
    `[MP Webhook] ✅ Pagamento ${paymentId} processado — order ${orderId} — pago: ${totalPago}/${order.total} — confirmado: ${shouldConfirm}`
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function saveAutomationLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  params: {
    type: string
    triggered_by: string
    entity_id?: string
    success: boolean
    error_message?: string
  }
): Promise<void> {
  try {
    await supabase.from('automation_logs').insert({
      type: params.type,
      triggered_by: params.triggered_by,
      entity_id: params.entity_id ?? null,
      success: params.success,
      error_message: params.error_message ?? null,
    })
  } catch (err) {
    console.error('[MP Webhook] Erro ao salvar automation_log:', err)
  }
}
