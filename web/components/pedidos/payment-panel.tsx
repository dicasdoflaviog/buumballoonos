'use client'

import { useState } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Clock, Ban, Plus, FileText } from 'lucide-react'
import type { Payment, AddPaymentInput } from '@/hooks/use-payments'

interface PaymentPanelProps {
  orderId: string
  total: number
  payments: Payment[]
  role?: string
  onAddPayment: (data: AddPaymentInput) => Promise<void>
  onUpdateStatus: (id: string, status: 'pendente' | 'recebido' | 'estornado') => Promise<void>
}

export function PaymentPanel({
  orderId,
  total,
  payments,
  role = 'helper',
  onAddPayment,
  onUpdateStatus,
}: PaymentPanelProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<AddPaymentInput['method']>('pix')
  const [notes, setNotes] = useState('')

  const canManagePayments = role === 'admin' || role === 'operator'

  const totalPaid = payments
    .filter((p) => p.status === 'recebido')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const totalPending = payments
    .filter((p) => p.status === 'pendente')
    .reduce((sum, p) => sum + p.amount, 0)

  const balance = total - totalPaid

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!amount) return

    const numStr = amount.replace(',', '.')
    const centavos = Math.round(parseFloat(numStr) * 100)
    if (isNaN(centavos) || centavos <= 0) return

    setLoading(true)
    try {
      await onAddPayment({
        order_id: orderId,
        amount: centavos,
        method,
        notes: notes || undefined,
      })
      setIsAdding(false)
      setAmount('')
      setNotes('')
    } finally {
      setLoading(false)
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'recebido': return <CheckCircle2 size={14} className="text-emerald-400" />
      case 'estornado': return <Ban size={14} className="text-red-400" />
      default: return <Clock size={14} className="text-yellow-400" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-xs text-white/50 mb-1">Total do Pedido</p>
          <p className="text-base font-bold text-white">{formatCurrency(total)}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: balance <= 0 ? 'rgba(6,214,160,0.1)' : 'rgba(255,61,127,0.1)', border: `1px solid ${balance <= 0 ? 'rgba(6,214,160,0.2)' : 'rgba(255,61,127,0.2)'}` }}>
          <p className="text-xs text-white/50 mb-1">Falta Pagar</p>
          <p className="text-base font-bold" style={{ color: balance <= 0 ? '#06D6A0' : '#FF3D7F' }}>
            {formatCurrency(Math.max(0, balance))}
          </p>
        </div>
      </div>

      {/* Lista de Pagamentos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">Histórico</h3>
          {canManagePayments && balance > 0 && (
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-[#C084FC] hover:text-[#C084FC] hover:bg-[#C084FC]/10 px-2">
                  <Plus size={12} /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent style={{ backgroundColor: '#1a1525', border: '1px solid rgba(255,255,255,0.1)' }}>
                <DialogHeader>
                  <DialogTitle className="text-white">Registrar Pagamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4 pt-2">
                  <div>
                    <Label className="text-white/60">Valor (R$)</Label>
                    <Input
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Ex: 150,00"
                      className="text-white mt-1.5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                    <p className="text-xs text-white/40 mt-1.5">Sugerido: {formatCurrency(balance)}</p>
                  </div>
                  <div>
                    <Label className="text-white/60">Método</Label>
                    <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                      <SelectTrigger className="text-white mt-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/60">Observações (opcional)</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Sinal via PIX"
                      className="text-white mt-1.5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white"
                    style={{ background: 'linear-gradient(135deg, #FF3D7F, #C084FC)', border: 'none' }}
                  >
                    {loading ? 'Salvando...' : 'Salvar Pagamento'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-4">Nenhum pagamento registrado.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="p-3 rounded-lg flex items-center justify-between gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getStatusIcon(p.status)}</div>
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      {formatCurrency(p.amount)} <span className="text-xs text-white/40 uppercase ml-1">{p.method.replace('_', ' ')}</span>
                    </p>
                    <div className="text-[10px] text-white/40 flex items-center gap-2 mt-0.5">
                      <span>{formatDateTime(p.created_at)}</span>
                      {p.notes && (
                        <span className="flex items-center gap-0.5" title={p.notes}><FileText size={10} /> nota</span>
                      )}
                    </div>
                  </div>
                </div>

                {canManagePayments && p.status === 'pendente' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateStatus(p.id, 'recebido')}
                    className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-2"
                  >
                    Confirmar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
