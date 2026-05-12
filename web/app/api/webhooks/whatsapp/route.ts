import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// ─── Tipos da Evolution API ───────────────────────────────────────────────────

interface EvolutionMessageKey {
  remoteJid: string
  fromMe: boolean
  id: string
}

interface EvolutionMessageContent {
  conversation?: string
  imageMessage?: { caption?: string; url?: string }
  audioMessage?: { url?: string }
}

interface EvolutionInboundMessage {
  key: EvolutionMessageKey
  message?: EvolutionMessageContent
  messageType?: string
  pushName?: string
  instanceName?: string
}

interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: EvolutionInboundMessage
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: EvolutionWebhookPayload = await req.json()

    // Evolution API envia event: 'messages.upsert' para mensagens recebidas
    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ ok: true })
    }

    const message = body.data

    // Ignorar mensagens enviadas por nós mesmos
    if (message.key.fromMe) {
      return NextResponse.json({ ok: true })
    }

    // Extrair número do remetente (formato: 5573999999999@s.whatsapp.net)
    const rawPhone = message.key.remoteJid ?? ''
    const phone = rawPhone.replace('@s.whatsapp.net', '').replace('@c.us', '')

    if (!phone) {
      return NextResponse.json({ ok: true })
    }

    // Determinar tipo e conteúdo da mensagem
    const messageType = detectMessageType(message)
    const content = extractTextContent(message)
    const mediaUrl = extractMediaUrl(message)

    // Buscar customer_id pelo telefone (opcional — não bloqueia se não encontrar)
    const supabase = await createServiceClient()
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .or(`phone.eq.${phone},phone.eq.+55${phone},phone.eq.55${phone}`)
      .maybeSingle()

    // Salvar mensagem inbound no banco
    await supabase.from('whatsapp_messages').insert({
      customer_id: customer?.id ?? null,
      phone,
      direction: 'inbound',
      message_type: messageType,
      content: content ?? null,
      media_url: mediaUrl ?? null,
      wa_message_id: message.key.id ?? null,
      status: 'delivered',
    })
  } catch (err) {
    // Logar o erro mas sempre retornar 200 para Evolution não fazer retry infinito
    console.error('[Webhook/WhatsApp] Error processing message:', err)
  }

  return NextResponse.json({ ok: true })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectMessageType(
  msg: EvolutionInboundMessage
): 'text' | 'image' | 'audio' | 'template' {
  if (msg.message?.imageMessage) return 'image'
  if (msg.message?.audioMessage) return 'audio'
  return 'text'
}

function extractTextContent(msg: EvolutionInboundMessage): string | undefined {
  return (
    msg.message?.conversation ??
    msg.message?.imageMessage?.caption ??
    undefined
  )
}

function extractMediaUrl(msg: EvolutionInboundMessage): string | undefined {
  return (
    msg.message?.imageMessage?.url ??
    msg.message?.audioMessage?.url ??
    undefined
  )
}
