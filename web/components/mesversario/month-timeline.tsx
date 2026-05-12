import { useState } from 'react'
import { formatDateTime } from '@/lib/utils/formatters'
import { Check, Clock, ChevronDown, PenTool, Gift } from 'lucide-react'
import type { MesversarioMonth } from '@/hooks/use-mesversario'
import { updateMonthStatus } from '@/app/actions/mesversario'

interface MonthTimelineProps {
  months: MesversarioMonth[]
}

const STATUS_COLORS: Record<string, { bg: string, text: string, icon: any }> = {
  agendado: { bg: 'bg-white/10', text: 'text-white/40', icon: Clock },
  tema_confirmado: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: PenTool },
  produzindo: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Gift },
  pronto: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Check },
  entregue: { bg: 'bg-green-500/20', text: 'text-green-400', icon: Check },
  cancelado: { bg: 'bg-red-500/20', text: 'text-red-400', icon: Clock }
}

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  tema_confirmado: 'Tema Confirmado',
  produzindo: 'Produzindo',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
}

export function MonthTimeline({ months }: MonthTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Acha qual é o próximo mês que ainda não foi entregue/cancelado
  const currentMonthIdx = months.findIndex(m => !['entregue', 'cancelado'].includes(m.status))

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {months.map((month, idx) => {
        const isCurrent = idx === currentMonthIdx
        const conf = STATUS_COLORS[month.status] || STATUS_COLORS.agendado
        const Icon = conf.icon
        const isExpanded = expandedId === month.id

        return (
          <div key={month.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Ícone (Nó da timeline) */}
            <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#1a1525] ${conf.bg} ${conf.text} absolute left-[-24px] md:left-1/2 md:-translate-x-1/2 shadow shrink-0 md:order-1 transition-transform ${isCurrent ? 'scale-125 ring-2 ring-white/20' : ''}`}>
              <Icon size={10} className="stroke-[3]" />
            </div>

            {/* Card Content */}
            <div 
              className={`w-[calc(100%-1rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border transition-all cursor-pointer ${
                isCurrent 
                  ? 'bg-white/[0.04] border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
              onClick={() => setExpandedId(isExpanded ? null : month.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">Mês {month.month_number}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conf.bg} ${conf.text}`}>
                  {STATUS_LABELS[month.status] || 'Desconhecido'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">{formatDateTime(month.scheduled_date).split(' ')[0]}</p>
                <ChevronDown size={14} className={`text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>

              {/* Área Expandida */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Tema escolhido</p>
                    <p className="text-sm text-white font-medium">{month.theme || 'Ainda não definido'}</p>
                  </div>
                  
                  {month.order_id && (
                    <div>
                      <p className="text-xs text-white/40 mb-1">Pedido Vinculado</p>
                      <a href={`/pedidos/${month.order_id}`} className="text-sm text-[#C084FC] hover:underline block">
                        Acessar pedido da loja
                      </a>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    {month.status === 'agendado' && (
                       <button onClick={(e) => { e.stopPropagation(); updateMonthStatus(month.id, 'tema_confirmado'); }} className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition">
                         Confirmar Tema
                       </button>
                    )}
                    {/* Apenas de exemplo, no fluxo real a transição ocorre pelo pedido em si */}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
