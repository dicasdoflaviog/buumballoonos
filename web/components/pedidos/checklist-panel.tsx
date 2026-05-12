'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckSquare, Square, PackageCheck, Send } from 'lucide-react'
import type { OrderItem } from '@/hooks/use-orders'

interface ChecklistPanelProps {
  orderId: string
  status: string
  items: OrderItem[]
  onConfirmReady: () => Promise<void>
  onConfirmDelivery: () => Promise<void>
}

export function ChecklistPanel({
  status,
  items,
  onConfirmReady,
  onConfirmDelivery,
}: ChecklistPanelProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const allChecked = items.length > 0 && checkedItems.size === items.length
  
  const isEmProducao = status === 'em_producao' || status === 'confirmado'
  const isPronto = status === 'pronto'

  function toggleCheck(id: string) {
    const next = new Set(checkedItems)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCheckedItems(next)
  }

  async function handleReady() {
    setLoading(true)
    try {
      await onConfirmReady()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelivery() {
    setLoading(true)
    try {
      await onConfirmDelivery()
    } finally {
      setLoading(false)
    }
  }

  if (status === 'novo' || status === 'cancelado' || status === 'entregue' || status === 'retirado') {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-white/40">Checklist indisponível no status atual.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isEmProducao && (
        <>
          <p className="text-sm text-white/60 mb-2">Marque os itens conforme finalizados:</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="mt-0.5 text-white/50">
                  {checkedItems.has(item.id) ? (
                    <CheckSquare size={18} className="text-emerald-400" />
                  ) : (
                    <Square size={18} />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${checkedItems.has(item.id) ? 'text-white/50 line-through' : 'text-white/90'}`}>
                    {item.products?.name}
                  </p>
                  <p className="text-xs text-white/40">Qtd: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleReady}
            disabled={!allChecked || loading}
            className="w-full mt-4 text-white"
            style={allChecked ? { background: 'linear-gradient(135deg, #06D6A0, #04b385)', border: 'none' } : {}}
            variant={allChecked ? 'default' : 'secondary'}
          >
            <PackageCheck size={16} className="mr-2" />
            {loading ? 'Processando...' : 'Confirmar Pedido Pronto'}
          </Button>
        </>
      )}

      {isPronto && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/20 text-emerald-400 mb-2">
            <PackageCheck size={24} />
          </div>
          <p className="text-sm text-white/80">O pedido está pronto e aguardando entrega/retirada.</p>
          <Button
            onClick={handleDelivery}
            disabled={loading}
            className="w-full text-white mt-2"
            style={{ background: 'linear-gradient(135deg, #FFD166, #ffb703)', color: '#000', border: 'none' }}
          >
            <Send size={16} className="mr-2" />
            {loading ? 'Processando...' : 'Confirmar Entrega/Retirada'}
          </Button>
        </div>
      )}
    </div>
  )
}
