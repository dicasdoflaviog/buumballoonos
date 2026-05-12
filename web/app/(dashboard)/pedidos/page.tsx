'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOrders } from '@/hooks/use-orders'
import { OrderCard } from '@/components/pedidos/order-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Filter } from 'lucide-react'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'

export default function PedidosPage() {
  const [activeTab, setActiveTab] = useState('ativos')
  const [search, setSearch] = useState('')

  // Map tabs to status filters
  const statusFilter = 
    activeTab === 'ativos' ? ['novo', 'confirmado', 'em_producao', 'pronto'] :
    activeTab === 'concluidos' ? ['entregue', 'retirado'] :
    activeTab === 'cancelados' ? ['cancelado'] : undefined

  const { orders, isLoading } = useOrders({ status: statusFilter })

  const filteredOrders = orders.filter(o => 
    search === '' || 
    o.order_number.toString().includes(search) ||
    o.customers?.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Pedidos</h1>
          <p className="text-sm text-white/50">Gerencie todas as encomendas</p>
        </div>
        <Link href="/pedidos/novo">
          <Button
            className="w-full sm:w-auto text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg, #FF3D7F 0%, #C084FC 100%)', border: 'none' }}
          >
            <Plus size={16} className="mr-2" />
            Novo Pedido
          </Button>
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou nº do pedido..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-10"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto bg-white/5 border border-white/10 h-10 p-1 rounded-xl">
            <TabsTrigger value="ativos" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Ativos</TabsTrigger>
            <TabsTrigger value="concluidos" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Concluídos</TabsTrigger>
            <TabsTrigger value="cancelados" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-white/40 text-sm">Carregando pedidos...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
          <p className="text-white/50">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
