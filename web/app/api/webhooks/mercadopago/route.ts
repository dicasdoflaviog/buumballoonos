import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { processPaymentWebhook } from '@/lib/mercadopago/webhooks'

// ─── Tipos do payload Mercado Pago ────────────────────────────────────────────

interface MPWebhookPayload {
  type: string
  action?: string
  data?: {
    id: string
  }
  id?: string
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Ler body como texto para validar assinatura ─────────────────────────
  const rawBody = await req.text()

  // ── 2. Validar assinatura HMAC SHA256 ──────────────────────────────────────
  const isValid = validateMPSignature(req, rawBody)

  if (!isValid) {
    console.warn('[MP Webhook] Assinatura inválida — requisição rejeitada')
    // Retornar 200 mesmo assim para evitar retry excessivo do MP em caso de config errada
    // Em produção com chave configurada, retornar 401:
    // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    return NextResponse.json({ ok: false, reason: 'invalid_signature' }, { status: 401 })
  }

  // ── 3. Parsear payload ─────────────────────────────────────────────────────
  let body: MPWebhookPayload

  try {
    body = JSON.parse(rawBody)
  } catch {
    console.error('[MP Webhook] Payload inválido — não é JSON')
    return NextResponse.json({ ok: true }) // 200 para MP não repetir
  }

  // ── 4. Processar evento de pagamento ───────────────────────────────────────
  if (body.type === 'payment') {
    const paymentId = body.data?.id ?? body.id

    if (paymentId) {
      // Processar de forma assíncrona — não bloquear a resposta
      // MP espera resposta rápida (< 500ms), o processamento pode demorar mais
      processPaymentWebhook(paymentId).catch((err) => {
        console.error('[MP Webhook] Erro no processPaymentWebhook:', err)
      })
    }
  }

  // ── 5. Sempre retornar 200 ─────────────────────────────────────────────────
  // MP re-tenta automaticamente se não receber 200 em tempo hábil
  return NextResponse.json({ ok: true })
}

// ─── Validação de assinatura HMAC ─────────────────────────────────────────────

/**
 * Valida a assinatura do webhook do Mercado Pago.
 *
 * O MP envia o header x-signature no formato:
 *   ts=<timestamp>,v1=<hmac_hex>
 *
 * A mensagem assinada é: "id:<paymentId>;request-id:<xRequestId>;ts:<ts>;"
 * Ref: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function validateMPSignature(req: NextRequest, _rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET

  // Se a chave não estiver configurada, logar aviso e permitir (útil em dev)
  if (!secret) {
    console.warn('[MP Webhook] MP_WEBHOOK_SECRET não configurado — pulando validação')
    return true
  }

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id') ?? ''

  if (!xSignature) {
    return false
  }

  // Parsear ts e v1 do header x-signature
  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => {
      const [key, ...rest] = part.split('=')
      return [key.trim(), rest.join('=').trim()]
    })
  )

  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) {
    return false
  }

  // Extrair payment id da URL (último segmento antes de query string)
  const url = new URL(req.url)
  const dataId = url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? ''

  // Construir mensagem para HMAC conforme especificação do MP
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  try {
    const expectedHex = createHmac('sha256', secret)
      .update(manifest)
      .digest('hex')

    const expected = Buffer.from(expectedHex, 'utf8')
    const received = Buffer.from(v1, 'utf8')

    // Comparação segura contra timing attacks
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
  } catch {
    return false
  }
}
