import Link from 'next/link'
import { formatCurrency, formatDateTime, formatOrderNumber } from '@/lib/utils/formatters'
import { OrderStatusBadge } from './order-status-badge'
import { ChevronRight, Clock, MapPin, Tag } from 'lucide-react'
import type { Order } from '@/hooks/use-orders'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const customerName = order.customers?.full_name ?? 'Cliente Desconhecido'

  return (
    <Link href={`/pedidos/${order.id}`} className="block group">
      <div 
        className="p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01]"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold" style={{ color: '#FF3D7F' }}>
              {formatOrderNumber(order.order_number)}
            </span>
            <OrderStatusBadge status={order.status} size="sm" />
          </div>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(order.total)}
          </span>
        </div>

        <h3 className="text-base font-medium text-white/90 truncate mb-1">
          {customerName}
        </h3>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Clock size={12} />
            <span className="truncate">{formatDateTime(order.pickup_datetime)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <MapPin size={12} />
            <span className="truncate capitalize">{order.delivery_type.replace('_', ' ')}</span>
          </div>
          {order.occasion_tag && (
            <div className="flex items-center gap-1.5 text-xs text-white/50 col-span-2">
              <Tag size={12} />
              <span className="truncate">{order.occasion_tag}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
