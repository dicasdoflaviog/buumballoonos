'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useContract } from '@/hooks/use-mesversario'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { MESVERSARIO_PLANS } from '@/lib/utils/constants'
import { MonthTimeline } from '@/components/mesversario/month-timeline'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, ExternalLink, Baby, Calendar } from 'lucide-react'

export default function MesversarioDetalhePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const id = params.id
  
  const router = useRouter()
  const { contract, isLoading } = useContract(id)

  if (isLoading) {
    return <div className="text-center py-12 text-white/40 text-sm">Carregando contrato...</div>
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">Contrato não encontrado.</p>
        <Button variant="outline" onClick={() => router.push('/mesversario')} className="text-white">Voltar</Button>
      </div>
    )
  }

  const planLabel = MESVERSARIO_PLANS[contract.plan_type]?.label || contract.plan_type

  // Encontrar qual é o próximo mês agendado
  const nextMonth = contract.mesversario_months?.find(m => !['entregue', 'cancelado'].includes(m.status))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/mesversario">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 shrink-0">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Baby className="text-[#C084FC]" size={24} />
              {contract.baby_name}
            </h1>
            <p className="text-sm text-white/50 mt-1">Plano {planLabel} • Iniciado em {formatDate(contract.start_date)}</p>
          </div>
        </div>

        {nextMonth && (
          <Link href={`/pedidos/novo?customer_id=${contract.customer_id}&mesversario_month_id=${nextMonth.id}`}>
            <Button 
              className="text-white"
              style={{ background: 'linear-gradient(135deg, #FF3D7F, #C084FC)', border: 'none' }}
            >
              <Plus size={16} className="mr-2" />
              Criar Pedido do Mês {nextMonth.month_number}
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Dados Gerais */}
        <div className="space-y-6">
          {/* Perfil Vinculado */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Responsável</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{contract.customers?.full_name}</p>
                <p className="text-sm text-white/50">{contract.customers?.phone}</p>
              </div>
              <Link href={`/clientes/${contract.customer_id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#C084FC] hover:bg-[#C084FC]/10">
                  <ExternalLink size={16} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Dados do Contrato */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Contrato</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/40">Status</p>
                <p className={`text-sm font-medium capitalize ${contract.status === 'ativo' ? 'text-[#06D6A0]' : 'text-white/80'}`}>
                  {contract.status}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Plano</p>
                <p className="text-sm font-medium text-white">{planLabel}</p>
              </div>

              <div>
                <p className="text-xs text-white/40">Valor da Mensalidade</p>
                <p className="text-sm font-medium text-white">{formatCurrency(contract.monthly_price)}</p>
                {contract.annual_discount_applied && (
                  <p className="text-xs text-[#06D6A0] mt-0.5">Desconto anual de 10% aplicado</p>
                )}
              </div>

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-white/40">Nascimento</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-white mt-1">
                  <Calendar size={14} className="text-white/40" />
                  {formatDate(contract.birth_date)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Timeline de 12 Meses */}
        <div className="lg:col-span-2">
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-6">Linha do Tempo (12 Meses)</h2>
            <MonthTimeline months={contract.mesversario_months || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
