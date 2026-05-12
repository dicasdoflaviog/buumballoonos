import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { MESVERSARIO_PLANS } from '@/lib/utils/constants'
import { ChevronRight, Calendar, Baby, AlertCircle } from 'lucide-react'
import type { ContractWithRelations } from '@/hooks/use-mesversario'

interface MonthCardProps {
  contract: ContractWithRelations
}

export function MonthCard({ contract }: MonthCardProps) {
  // Encontrar o próximo mês pendente
  const months = contract.mesversario_months || []
  const nextMonth = months.find(m => !['entregue', 'cancelado'].includes(m.status))
  
  // Calcular se está próximo (próximos 15 dias)
  const now = new Date()
  let isNear = false
  if (nextMonth) {
    const scheduled = new Date(nextMonth.scheduled_date)
    const diffDays = Math.ceil((scheduled.getTime() - now.getTime()) / (1000 * 3600 * 24))
    isNear = diffDays >= 0 && diffDays <= 15
  }

  const planLabel = MESVERSARIO_PLANS[contract.plan_type]?.label || 'Desconhecido'

  return (
    <Link href={`/mesversario/${contract.id}`} className="block group">
      <div 
        className={`p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01] ${isNear ? 'border-[#C084FC]/50 shadow-[0_0_15px_rgba(192,132,252,0.1)]' : 'border-white/5'}`}
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Baby size={16} className="text-[#C084FC]" />
              <h3 className="text-base font-semibold text-white">
                {contract.baby_name}
              </h3>
            </div>
            <p className="text-xs text-white/50 mt-1">Resp: {contract.customers?.full_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Valor / mês</p>
            <p className="text-sm font-bold text-white">
              {formatCurrency(contract.monthly_price)}
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-3 mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 mb-0.5">Andamento</p>
            <p className="text-sm font-medium text-white">
              Mês {nextMonth ? nextMonth.month_number : '12'} de 12
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 mb-0.5">Próxima entrega</p>
            <div className="flex items-center gap-1.5 justify-end">
              {isNear && <AlertCircle size={12} className="text-[#C084FC]" />}
              <p className={`text-sm font-medium ${isNear ? 'text-[#C084FC]' : 'text-white/90'}`}>
                {nextMonth ? formatDate(nextMonth.scheduled_date).slice(0, 5) : 'Concluído'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-white/60">
            {planLabel}
          </span>
          <ChevronRight size={18} className="text-white/20 group-hover:text-[#C084FC] transition-colors" />
        </div>
      </div>
    </Link>
  )
}
