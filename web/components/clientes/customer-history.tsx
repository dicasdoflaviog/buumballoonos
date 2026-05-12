import Link from 'next/link'
import { formatCurrency, formatDateTime, formatOrderNumber } from '@/lib/utils/formatters'
import { OrderStatusBadge } from '@/components/pedidos/order-status-badge'
import { ChevronRight } from 'lucide-react'
import type { Order } from '@/hooks/use-orders'

interface CustomerHistoryProps {
  orders: Order[]
}

export function CustomerHistory({ orders }: CustomerHistoryProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
        <p className="text-sm text-white/40">Nenhum pedido encontrado para este cliente.</p>
      </div>
    )
  }

  // Sort orders descending by created_at
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {sortedOrders.map((order) => (
          <Link
            key={order.id}
            href={`/pedidos/${order.id}`}
            className="flex items-center justify-between gap-4 p-4 hover:bg-white/[0.03] transition-colors group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono font-bold" style={{ color: '#FF3D7F' }}>
                  {formatOrderNumber(order.order_number)}
                </span>
                <OrderStatusBadge status={order.status} size="sm" />
              </div>
              <p className="text-xs text-white/50">
                {formatDateTime(order.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-white">
                {formatCurrency(order.total)}
              </span>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
