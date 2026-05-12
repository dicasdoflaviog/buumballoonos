'use client'

import { useState, useTransition } from 'react'
import { updateOrderItem, removeOrderItem } from '@/app/actions/orders'
import { formatCurrency } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, Pencil, Tag } from 'lucide-react'
import type { OrderItem } from '@/hooks/use-orders'

interface OrderItemsEditorProps {
  items: OrderItem[]
  role?: string
  onUpdate?: () => void
}

export function OrderItemsEditor({ items, role = 'helper', onUpdate }: OrderItemsEditorProps) {
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null)
  const [overrideValue, setOverrideValue] = useState('')
  const [isPending, startTransition] = useTransition()

  const canEditPrice = role === 'admin' || role === 'operator'

  function openEdit(item: OrderItem) {
    setEditingItem(item)
    const currentPrice = item.unit_price_override ?? item.unit_price
    setOverrideValue((currentPrice / 100).toFixed(2).replace('.', ','))
  }

  function handleSaveOverride() {
    if (!editingItem) return

    // Converter "80,00" → 8000 centavos
    const numStr = overrideValue.replace(',', '.')
    const centavos = Math.round(parseFloat(numStr) * 100)
    if (isNaN(centavos) || centavos < 0) return

    startTransition(async () => {
      await updateOrderItem(editingItem.id, { unit_price_override: centavos })
      setEditingItem(null)
      onUpdate?.()
    })
  }

  function handleClearOverride() {
    if (!editingItem) return
    startTransition(async () => {
      await updateOrderItem(editingItem.id, { unit_price_override: null })
      setEditingItem(null)
      onUpdate?.()
    })
  }

  function handleRemove(itemId: string) {
    if (!confirm('Remover este item do pedido?')) return
    startTransition(async () => {
      await removeOrderItem(itemId)
      onUpdate?.()
    })
  }

  const total = items.reduce((sum, item) => {
    const price = item.unit_price_override ?? item.unit_price
    return sum + price * item.quantity
  }, 0)

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Nenhum item adicionado
        </p>
      ) : (
        <>
          {items.map((item) => {
            const finalPrice = item.unit_price_override ?? item.unit_price
            const hasOverride = item.unit_price_override != null
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl p-3.5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Info do produto */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {item.products?.name ?? 'Produto'}
                  </p>
                  {item.notes && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Tag size={11} /> {item.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Qtd: {item.quantity}
                    </span>
                    {hasOverride && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,209,102,0.15)', color: '#FFD166' }}>
                        preço ajustado
                      </span>
                    )}
                  </div>
                </div>

                {/* Preço */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(finalPrice * item.quantity)}
                  </p>
                  {hasOverride && (
                    <p className="text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {formatCurrency(item.unit_price * item.quantity)}
                    </p>
                  )}
                </div>

                {/* Ações */}
                {canEditPrice && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/30 hover:text-white/70"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/30 hover:text-red-400"
                      onClick={() => handleRemove(item.id)}
                      disabled={isPending}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Total */}
          <div
            className="flex justify-between items-center px-4 py-3 rounded-xl mt-1"
            style={{ backgroundColor: 'rgba(255,61,127,0.08)', border: '1px solid rgba(255,61,127,0.15)' }}
          >
            <span className="text-sm font-medium text-white/60">Total</span>
            <span className="text-base font-bold" style={{ color: '#FF3D7F' }}>
              {formatCurrency(total)}
            </span>
          </div>
        </>
      )}

      {/* Modal de edição de preço */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent style={{ backgroundColor: '#1a1525', border: '1px solid rgba(255,255,255,0.1)' }}>
          <DialogHeader>
            <DialogTitle className="text-white">Ajustar preço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {editingItem?.products?.name} — original: {formatCurrency(editingItem?.unit_price ?? 0)}
            </p>
            <div>
              <label className="text-sm text-white/60 block mb-1.5">Novo preço unitário (R$)</label>
              <Input
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                placeholder="Ex: 80,00"
                className="text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            <div className="flex gap-2 pt-1">
              {editingItem?.unit_price_override != null && (
                <Button
                  variant="outline"
                  onClick={handleClearOverride}
                  disabled={isPending}
                  className="flex-1 border-white/15 text-white/60 hover:text-white"
                >
                  Usar preço original
                </Button>
              )}
              <Button
                onClick={handleSaveOverride}
                disabled={isPending}
                className="flex-1 text-white"
                style={{ background: 'linear-gradient(135deg, #FF3D7F, #C084FC)', border: 'none' }}
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
