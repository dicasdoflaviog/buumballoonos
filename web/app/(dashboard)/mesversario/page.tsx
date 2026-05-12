'use client'

import { useState } from 'react'
import { useContracts } from '@/hooks/use-mesversario'
import { MonthCard } from '@/components/mesversario/month-card'
import { ContractForm } from '@/components/mesversario/contract-form'
import { formatCurrency } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, TrendingUp } from 'lucide-react'

export default function MesversarioPage() {
  const [isAdding, setIsAdding] = useState(false)
  const { contracts, isLoading } = useContracts()

  // Calcular MRR total
  const mrr = contracts.reduce((acc, c) => acc + (c.status === 'ativo' ? c.monthly_price : 0), 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Mêsversários</h1>
          <p className="text-sm text-white/50">Gerencie os planos de assinaturas</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto text-white rounded-xl"
              style={{ background: 'linear-gradient(135deg, #FF3D7F 0%, #C084FC 100%)', border: 'none' }}
            >
              <Plus size={16} className="mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1525', border: '1px solid rgba(255,255,255,0.1)' }}>
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Novo Contrato (12 Meses)</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <ContractForm onSuccess={() => setIsAdding(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI MRR */}
      <div className="bg-white/[0.02] border border-[#C084FC]/20 p-5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#C084FC]/10 text-[#C084FC]">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-white/50">Receita Recorrente (MRR)</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(mrr)}</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-white/50">Contratos Ativos</p>
          <p className="text-xl font-bold text-white">{contracts.filter(c => c.status === 'ativo').length}</p>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-white/40 text-sm">Carregando contratos...</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
          <p className="text-white/50">Nenhum contrato ativo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((contract) => (
            <MonthCard key={contract.id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  )
}
