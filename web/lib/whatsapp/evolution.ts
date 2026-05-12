import axios from 'axios'

const BASE_URL = process.env.EVOLUTION_API_URL ?? ''
const INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'buum'
const API_KEY = process.env.EVOLUTION_API_KEY ?? ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    apikey: API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

/**
 * Envia mensagem de texto via Evolution API.
 * Erro é logado mas NÃO lança exceção — não quebra o fluxo do app.
 */
export async function sendText(phone: string, message: string): Promise<void> {
  try {
    await api.post(`/message/sendText/${INSTANCE}`, {
      number: phone,
      text: message,
    })
  } catch (err) {
    console.error('[WhatsApp] sendText error:', err)
  }
}

/**
 * Envia imagem com legenda via Evolution API.
 * Erro é logado mas NÃO lança exceção.
 */
export async function sendImage(
  phone: string,
  imageUrl: string,
  caption: string
): Promise<void> {
  try {
    await api.post(`/message/sendMedia/${INSTANCE}`, {
      number: phone,
      mediatype: 'image',
      media: imageUrl,
      caption,
    })
  } catch (err) {
    console.error('[WhatsApp] sendImage error:', err)
  }
}

/**
 * Retorna o status de conexão da instância Evolution.
 * Retorna 'close' em caso de erro para indicar instância indisponível.
 */
export async function getConnectionStatus(): Promise<'open' | 'close'> {
  try {
    const { data } = await api.get(
      `/instance/connectionState/${INSTANCE}`
    )
    return data?.instance?.state === 'open' ? 'open' : 'close'
  } catch (err) {
    console.error('[WhatsApp] getConnectionStatus error:', err)
    return 'close'
  }
}
