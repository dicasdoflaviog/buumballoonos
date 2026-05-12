'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/app/actions/orders'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OCCASION_TAGS, DELIVERY_TYPES } from '@/lib/utils/constants'
import { formatCurrency } from '@/lib/utils/formatters'
import { Trash2, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoPedidoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Dados do formulário
  const [customerId, setCustomerId] = useState('')
  const [deliveryType, setDeliveryType] = useState('retirada')
  const [pickupDatetime, setPickupDatetime] = useState('')
  const [occasion, setOccasion] = useState('')
  const [notes, setNotes] = useState('')

  // Itens
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([])
  
  // Opções para selects
  const [customers, setCustomers] = useState<{id: string, full_name: string}[]>([])
  const [products, setProducts] = useState<{id: string, name: string, base_price: number}[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const [custRes, prodRes] = await Promise.all([
        supabase.from('customers').select('id, full_name').order('full_name'),
        supabase.from('products').select('id, name, base_price').order('name')
      ])
      if (custRes.data) setCustomers(custRes.data)
      if (prodRes.data) setProducts(prodRes.data)
    }
    loadData()
  }, [])

  function addItem() {
    setItems([...items, { productId: '', quantity: 1 }])
  }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId || !pickupDatetime || items.length === 0 || items.some(i => !i.productId)) {
      alert('Preencha todos os campos obrigatórios e adicione pelo menos um item.')
      return
    }

    setLoading(true)
    try {
      const orderItems = items.map(item => {
        const prod = products.find(p => p.id === item.productId)
        return {
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: prod?.base_price ?? 0,
        }
      })

      const order = await createOrder({
        customer_id: customerId,
        delivery_type: deliveryType as any,
        pickup_datetime: new Date(pickupDatetime).toISOString(),
        occasion_tag: occasion || undefined,
        notes: notes || undefined,
        items: orderItems
      })

      router.push(`/pedidos/${order.id}`)
    } catch (err) {
      console.error(err)
      alert('Erro ao criar pedido.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pedidos">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Novo Pedido</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente e Data */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold text-white/80">Informações Básicas</h2>
          
          <div className="space-y-1.5">
            <Label className="text-white/60">Cliente *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/60">Data e Hora *</Label>
              <Input 
                type="datetime-local" 
                required 
                value={pickupDatetime}
                onChange={e => setPickupDatetime(e.target.value)}
                className="bg-white/5 border-white/10 text-white" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60">Entrega/Retirada</Label>
              <Select value={deliveryType} onValueChange={setDeliveryType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DELIVERY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60">Ocasião (Tag)</Label>
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {OCCASION_TAGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">Itens do Pedido *</h2>
            <Button type="button" onClick={addItem} variant="ghost" size="sm" className="h-7 text-xs text-[#06D6A0] hover:text-[#06D6A0] hover:bg-[#06D6A0]/10">
              <Plus size={14} className="mr-1" /> Adicionar
            </Button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <Select value={item.productId} onValueChange={v => updateItem(idx, 'productId', v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.base_price)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Input 
                  type="number" min="1" value={item.quantity} 
                  onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                  className="bg-white/5 border-white/10 text-white" 
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-white/40 text-center py-2">Nenhum item adicionado.</p>}
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-1.5">
          <Label className="text-white/60">Observações Gerais</Label>
          <Input 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="bg-white/5 border-white/10 text-white" 
            placeholder="Ex: Cores específicas, balão personalizado..." 
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full text-white h-12 text-base rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #FF3D7F, #C084FC)', border: 'none' }}>
          {loading ? 'Criando...' : 'Criar Pedido'}
        </Button>
      </form>
    </div>
  )
}
