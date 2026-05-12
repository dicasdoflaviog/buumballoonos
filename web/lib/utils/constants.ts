// ─── Status de Pedidos ────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  em_producao: 'Em produção',
  pronto: 'Pronto para retirada',
  retirado: 'Retirado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  novo: 'bg-gray-100 text-gray-800',
  confirmado: 'bg-blue-100 text-blue-800',
  em_producao: 'bg-yellow-100 text-yellow-800',
  pronto: 'bg-purple-100 text-purple-800',
  retirado: 'bg-green-100 text-green-800',
  entregue: 'bg-green-200 text-green-900',
  cancelado: 'bg-red-100 text-red-800',
}

/** Sequência válida de transições de status */
export const ORDER_STATUS_FLOW: string[] = [
  'novo',
  'confirmado',
  'em_producao',
  'pronto',
  'retirado',
  'entregue',
]

// ─── Tags de Ocasião ──────────────────────────────────────────────────────────

export const OCCASION_TAGS: Record<string, string> = {
  aniversario: '🎂 Aniversário',
  mesversario: '🎈 Mêsversário',
  namoro: '💑 Namoro',
  escola: '🎒 Escola',
  trabalho: '🏢 Trabalho',
  batizado: '✝️ Batizado',
  cha: '🍼 Chá',
  outro: '🎉 Outro',
}

// ─── Tipos de Entrega ─────────────────────────────────────────────────────────

export const DELIVERY_TYPES: Record<string, string> = {
  retirada: '🏪 Retirada na loja',
  entrega_nossa: '🚗 Entrega nossa',
  cliente_app: '📱 Cliente pede app',
}

// ─── Planos de Mêsversário ────────────────────────────────────────────────────

export const MESVERSARIO_PLANS: Record<
  string,
  { label: string; price: number }
> = {
  basico: { label: 'Básico', price: 12000 },
  memoria: { label: 'Memória ⭐', price: 18000 },
  celebracao: { label: 'Celebração', price: 28000 },
}

// ─── Informações do Negócio ───────────────────────────────────────────────────

export const BUSINESS_INFO = {
  name: 'Buum Balloon',
  shortName: 'Buum OS',
  phone: '5573999999999', // atualizar com número real
  instagram: 'buumballoonn',
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/buumballoonn',
  googleReviewUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? '',
  city: 'Teixeira de Freitas',
  state: 'BA',
  pixKey: '', // atualizar com chave PIX real
} as const

// ─── Tags de Clientes ─────────────────────────────────────────────────────────

export const CUSTOMER_TAG_LABELS: Record<string, string> = {
  VIP: '⭐ VIP',
  mesversario_ativo: '🎈 Mêsversário Ativo',
  presenteador: '🎁 Presenteador',
  indicadora: '📣 Indicadora',
  inativa_30d: '😴 Inativa 30d',
  escola: '🎒 Escola',
  corporativo: '🏢 Corporativo',
}

// ─── Métodos de Pagamento ─────────────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: '💸 PIX',
  dinheiro: '💵 Dinheiro',
  cartao_debito: '💳 Débito',
  cartao_credito: '💳 Crédito',
}

// ─── Tipos de Relacionamento ──────────────────────────────────────────────────

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  filho: '👶 Filho(a)',
  cônjuge: '💑 Cônjuge',
  mãe: '👩 Mãe',
  pai: '👨 Pai',
  amigo: '🤝 Amigo(a)',
  outro: '👤 Outro',
}
