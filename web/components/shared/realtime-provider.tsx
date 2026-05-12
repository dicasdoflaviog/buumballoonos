'use client'

import { useCallback } from 'react'
import { useOrdersRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'

export function RealtimeProvider() {
  const handleOrderChange = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      // Alerta sonoro / visual para novo pedido
      toast.success(`Novo pedido recebido! 🎈`, {
        description: `Pedido #${String(payload.new.order_number).padStart(3, '0')} acabou de entrar no sistema.`,
      })
    } 
    else if (payload.eventType === 'UPDATE') {
      // Avaliar mudança de status (comparar old e new se disponíveis)
      // O Supabase envia o OLD se o REPLICA IDENTITY estiver full, senão pode não ter tudo.
      // Aqui checamos só se foi um update de fato e ignoramos updates que não alteram status.
      // (Para ter payload.old.status confiável, a tabela precisa ter REPLICA IDENTITY FULL ou verificar a mudança no cliente localmente,
      // mas vamos assumir que o update veio por status)
      
      if (payload.old && payload.new.status === payload.old.status) {
        return // Ignora updates que não mudaram o status
      }

      const statusLabel = ORDER_STATUS_LABELS[payload.new.status] || payload.new.status

      toast.info(`Pedido Atualizado`, {
        description: `O Pedido #${String(payload.new.order_number).padStart(3, '0')} agora está: ${statusLabel}`,
      })
    }
  }, [])

  useOrdersRealtime(handleOrderChange)

  // Esse componente é headless (não renderiza UI), apenas roda os hooks
  return null
}
