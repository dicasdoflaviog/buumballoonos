import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// ─── CPF ─────────────────────────────────────────────────────────────────────

/**
 * Valida CPF brasileiro (formato e dígitos verificadores).
 * @example validateCPF('000.000.000-00') → false (sequência inválida)
 * @example validateCPF('529.982.247-25') → true
 */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')

  if (digits.length !== 11) return false

  // Rejeitar sequências repetidas (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(digits)) return false

  // Calcular primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[9])) return false

  // Calcular segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[10])) return false

  return true
}

/**
 * Encripta CPF usando AES-256-CBC.
 * Retorna string no formato: iv:ciphertext (ambos em hex).
 */
export function encryptCPF(cpf: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)

  const digits = cpf.replace(/\D/g, '')
  let encrypted = cipher.update(digits, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decripta CPF encriptado com encryptCPF.
 * Retorna CPF com apenas dígitos (sem pontuação).
 */
export function decryptCPF(encrypted: string): string {
  try {
    const key = getEncryptionKey()
    const [ivHex, ciphertext] = encrypted.split(':')

    if (!ivHex || !ciphertext) throw new Error('Formato inválido')

    const iv = Buffer.from(ivHex, 'hex')
    const decipher = createDecipheriv('aes-256-cbc', key, iv)

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch {
    return ''
  }
}

// ─── Telefone ─────────────────────────────────────────────────────────────────

/**
 * Valida número de telefone brasileiro (celular ou fixo).
 * Aceita formatos: (73) 9 9999-9999, 73999999999, +5573999999999
 */
export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')

  // Remove DDI 55 se presente
  const local = digits.startsWith('55') && digits.length > 11
    ? digits.slice(2)
    : digits

  // Celular (11 dígitos com 9 na frente) ou fixo (10 dígitos)
  if (local.length === 11) {
    // Celular: segundo dígito após DDD deve ser 9
    return local[2] === '9'
  }

  if (local.length === 10) {
    return true
  }

  return false
}

/**
 * Formata telefone para padrão E.164 (necessário para Evolution API).
 * @example formatPhoneE164('(73) 9 9999-9999') → "5573999999999"
 */
export function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  // Já tem DDI 55
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits
  }

  // Adiciona DDI 55
  return `55${digits}`
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Deriva uma chave de 32 bytes da ENCRYPTION_KEY do ambiente.
 * Faz padding ou truncamento para garantir exatamente 32 bytes.
 */
function getEncryptionKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY ?? 'buum-os-secret-key-2026-change-this'
  // Garante exatamente 32 bytes para AES-256
  return Buffer.from(rawKey.padEnd(32, '0').slice(0, 32), 'utf8')
}
