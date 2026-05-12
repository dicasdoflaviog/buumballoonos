import { cn } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils/constants'

interface OrderStatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const label = ORDER_STATUS_LABELS[status] ?? status
  const colorClass = ORDER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        colorClass,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      )}
    >
      {label}
    </span>
  )
}
