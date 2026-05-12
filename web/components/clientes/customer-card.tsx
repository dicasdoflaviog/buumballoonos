import Link from 'next/link'
import { formatCurrency, formatPhone } from '@/lib/utils/formatters'
import { Phone, MapPin, ShoppingBag, ChevronRight } from 'lucide-react'
import type { Customer } from '@/hooks/use-customers'

interface CustomerCardProps {
  customer: Customer
}

export function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <Link href={`/clientes/${customer.id}`} className="block group">
      <div 
        className="p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01]"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-semibold text-white truncate max-w-[70%]">
            {customer.full_name}
          </h3>
          <div className="text-right">
            <p className="text-xs text-white/40">LTV</p>
            <p className="text-sm font-bold" style={{ color: '#06D6A0' }}>
              {formatCurrency(customer.total_spent)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 mt-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Phone size={14} />
            <span>{formatPhone(customer.phone)}</span>
          </div>
          
          {customer.neighborhood && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <MapPin size={14} />
              <span className="truncate">{customer.neighborhood}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-white/60">
            <ShoppingBag size={14} />
            <span>{customer.total_orders} pedido{customer.total_orders !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
           <ChevronRight size={18} className="text-white/20 group-hover:text-[#FF3D7F] transition-colors" />
        </div>
      </div>
    </Link>
  )
}
