import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formata valor em centavos para exibição monetária brasileira.
 * @example formatCurrency(8000) → "R$ 80,00"
 */
export function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

/**
 * Formata data para padrão brasileiro.
 * @example formatDate('2026-06-14') → "14/06/2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

/**
 * Formata data e hora para padrão brasileiro.
 * @example formatDateTime('2026-06-14T14:00:00') → "14/06/2026 às 14:00"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/**
 * Formata número de telefone brasileiro.
 * @example formatPhone('73999999999') → "(73) 9 9999-9999"
 * @example formatPhone('7333333333') → "(73) 3333-3333"
 */
export function formatPhone(phone: string): string {
  // Remove tudo que não for dígito
  const digits = phone.replace(/\D/g, '')

  // Remove DDI 55 se presente
  const local = digits.startsWith('55') && digits.length > 11
    ? digits.slice(2)
    : digits

  if (local.length === 11) {
    // Celular com 9 dígito: (DD) 9 XXXX-XXXX
    return `(${local.slice(0, 2)}) ${local[2]} ${local.slice(3, 7)}-${local.slice(7)}`
  } else if (local.length === 10) {
    // Fixo: (DD) XXXX-XXXX
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }

  // Retorna o original se não bater os padrões
  return phone
}

/**
 * Formata CPF para exibição mascarada.
 * @example formatCPF('00000000000') → "000.000.000-00"
 */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Formata número do pedido com padding de 3 dígitos.
 * @example formatOrderNumber(1) → "#001"
 * @example formatOrderNumber(42) → "#042"
 */
export function formatOrderNumber(num: number): string {
  return `#${String(num).padStart(3, '0')}`
}
