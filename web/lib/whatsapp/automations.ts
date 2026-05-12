import { createServiceClient } from '@/lib/supabase/server'
import { sendText } from './evolution'
import { WA_MESSAGES } from './messages'
import { formatOrderNumber, formatDateTime, formatCurrency } from '@/lib/utils/formatters'
import { BUSINESS_INFO } from '@/lib/utils/constants'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'novo'
  | 'confirmado'
  | 'em_producao'
  | 'pronto'
  | 'retirado'
  | 'entregue'
  | 'cancelado'

export interface OrderForAutomation {
  id: string
  order_number: number
  pickup_datetime: string
  total: number
  customer_id: string
}

export interface CustomerForAutomation {
  id: string
  full_name: string
  phone: string
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Salva mensagem enviada na tabela whatsapp_messages.
 */
async function saveOutboundMessage(params: {
  customer_id: string
  phone: string
  content: string
  automation_type: string
}): Promise<void> {
  try {
    const supabase = await createServiceClient()
    await supabase.from('whatsapp_messages').insert({
      customer_id: params.customer_id,
      phone: params.phone,
      direction: 'outbound',
      message_type: 'text',
      content: params.content,
      status: 'sent',
      automation_type: params.automation_type,
    })
  } catch (err) {
    console.error('[Automation] saveOutboundMessage error:', err)
  }
}

/**
 * Salva resultado de automação na tabela automation_logs.
 */
async function saveAutomationLog(params: {
  type: string
  triggered_by: string
  entity_id?: string
  success: boolean
  error_message?: string
}): Promise<void> {
  try {
    const supabase = await createServiceClient()
    await supabase.from('automation_logs').insert({
      type: params.type,
      triggered_by: params.triggered_by,
      entity_id: params.entity_id ?? null,
      success: params.success,
      error_message: params.error_message ?? null,
    })
  } catch (err) {
    console.error('[Automation] saveAutomationLog error:', err)
  }
}

// ─── Automações por status ────────────────────────────────────────────────────

/**
 * Envia WhatsApp de confirmação de pagamento.
 */
export async function sendPaymentConfirmation(
  order: OrderForAutomation,
  customer: CustomerForAutomation
): Promise<void> {
  const automationType = 'payment_confirmed'
  const orderNum = formatOrderNumber(order.order_number)
  const datetime = formatDateTime(order.pickup_datetime)
  const message = WA_MESSAGES.payment_confirmed(customer.full_name, orderNum, datetime)

  try {
    await sendText(customer.phone, message)
    await saveOutboundMessage({
      customer_id: customer.id,
      phone: customer.phone,
      content: message,
      automation_type: automationType,
    })
    await saveAutomationLog({
      type: automationType,
      triggered_by: 'webhook_mercadopago',
      entity_id: order.id,
      success: true,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[Automation] sendPaymentConfirmation error:', err)
    await saveAutomationLog({
      type: automationType,
      triggered_by: 'webhook_mercadopago',
      entity_id: order.id,
      success: false,
      error_message: errorMessage,
    })
  }
}

/**
 * Envia WhatsApp quando pedido entra em produção.
 */
export async function sendProductionStarted(
  order: OrderForAutomation,
  customer: CustomerForAutomation
): Promise<void> {
  const automationType = 'production_started'
  const datetime = formatDateTime(order.pickup_datetime)
  const message = WA_MESSAGES.production_started(customer.full_name, datetime)

  try {
    await sendText(customer.phone, message)
    await saveOutboundMessage({
      customer_id: customer.id,
      phone: customer.phone,
      content: message,
      automation_type: automationType,
    })
    await saveAutomationLog({
      type: automationType,
      triggered_by: 'status_change',
      entity_id: order.id,
      success: true,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[Automation] sendProductionStarted error:', err)
    await saveAutomationLog({
      type: automationType,
      triggered_by: 'status_change',
      entity_id: order.id,
      success: false,
      error_message: errorMessage,
    })
  }
}

/**
 * Envia WhatsApp quando kit está pronto para retirada.
 */
export async function sendKitReady(
  order: OrderForAutomation,
  customer: CustomerForAutomation
): Promise<void> {
  const automationType = 'kit_ready'
  const pickupTime = formatDateTime(order.pickup_datetime)
  const message = WA_MESSAGES.kit_ready(customer.full_name, pickupTime)

  try {
    await sendText(customer.phone, message)
    await saveOutboundMessage({
      customer_id: customer.id,
      phone: customer.phone,
      content: message,
      automation_type: automationType,
    })
    await saveAutomationLog({
      type: automationType,
      triggered_by: 'checklist_complete',
      entity_id: order.id,
      success: true,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[Automation] sendKitReady error:', err)
    await saveAutomationLog({
      type: automationType,
      triggered_by: 'checklist_complete',
      entity_id: order.id,
      success: false,
      error_message: errorMessage,
    })
  }
}

/**
 * Envia WhatsApp de agradecimento após entrega.
 */
export async function sendDeliveryThanks(
  order: OrderForAutomation,
  customer: CustomerForAutomation
): Promise<void> {
  const automationType = 'delivery_thanks'
  const googleUrl = BUSINESS_INFO.googleReviewUrl || 'https://g.page/r/buum'
  const message = WA_MESSAGES.delivery_thanks(customer.full_name, googleUrl)

  try {
    await sendText(customer.phone, message)
    await saveOutboundMessage({
      customer_id: customer.id,
      phone: customer.phone,
      content: message,
      automation_type: automationType,
    })
    await saveAutomationLog({
      type: automationType,
      triggered_by: 'status_change',
      entity_id: order.id,
      success: true,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[Automation] sendDeliveryThanks error:', err)
    await saveAutomationLog({
      type: automationType,
      triggered_by: 'status_change',
      entity_id: order.id,
      success: false,
      error_message: errorMessage,
    })
  }
}

// ─── Dispatcher central ───────────────────────────────────────────────────────

/**
 * Chamado sempre que o status de um pedido muda.
 * Despacha a automação correta baseada no novo status.
 */
export async function onOrderStatusChange(
  order: OrderForAutomation,
  newStatus: OrderStatus,
  customer: CustomerForAutomation
): Promise<void> {
  switch (newStatus) {
    case 'confirmado':
      await sendPaymentConfirmation(order, customer)
      break
    case 'em_producao':
      await sendProductionStarted(order, customer)
      break
    case 'pronto':
      await sendKitReady(order, customer)
      break
    case 'entregue':
      await sendDeliveryThanks(order, customer)
      break
    // 'novo', 'retirado', 'cancelado' → sem automação WhatsApp por enquanto
    default:
      break
  }
}
