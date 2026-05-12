'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useOrder, updateOrderStatus } from '@/hooks/use-orders'
import { usePayments, addPayment, updatePaymentStatus } from '@/hooks/use-payments'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime, formatOrderNumber } from '@/lib/utils/formatters'
import { OrderStatusBadge } from '@/components/pedidos/order-status-badge'
import { OrderItemsEditor } from '@/components/pedidos/order-items-editor'
import { PaymentPanel } from '@/components/pedidos/payment-panel'
import { ChecklistPanel } from '@/components/pedidos/checklist-panel'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, MapPin, Tag, Phone } from 'lucide-react'

// Utiliza a prop params descapsulada com React.use para evitar aviso do Next.js
export default function PedidoDetalhePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const id = params.id
  
  const router = useRouter()
  const { order, isLoading, refetch: refetchOrder } = useOrder(id)
  const { payments, refetch: refetchPayments } = usePayments(id)
  const [role, setRole] = useState('helper')

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data) setRole(data.role)
    }
    loadRole()
  }, [])

  if (isLoading) {
    return <div className="text-center py-12 text-white/40 text-sm">Carregando pedido...</div>
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">Pedido não encontrado.</p>
        <Button variant="outline" onClick={() => router.push('/pedidos')} className="text-white">Voltar</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header do Pedido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/pedidos">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 shrink-0">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono" style={{ color: '#FF3D7F' }}>
                {formatOrderNumber(order.order_number)}
              </h1>
              <OrderStatusBadge status={order.status} size="md" />
            </div>
            <p className="text-sm text-white/50 mt-1">Criado em {formatDateTime(order.created_at)}</p>
          </div>
        </div>

        {role !== 'helper' && order.status === 'novo' && (
          <Button 
            onClick={() => updateOrderStatus(order.id, 'confirmado')}
            className="text-white"
            style={{ background: 'linear-gradient(135deg, #06D6A0, #04b385)', border: 'none' }}
          >
            Confirmar Pedido
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda (Cliente + Itens + Financeiro) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cliente Info */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Dados do Cliente</h2>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-medium text-white">{order.customers?.full_name}</p>
                <div className="flex items-center gap-2 text-sm text-white/50 mt-1">
                  <Phone size={14} />
                  <span>{order.customers?.phone}</span>
                </div>
              </div>
              <Link href={`/clientes/${order.customer_id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white/80">
                  <Edit size={14} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Entrega Info */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Logística</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Data/Hora</p>
                <p className="text-sm font-medium text-white/90">{formatDateTime(order.pickup_datetime)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Tipo</p>
                <p className="text-sm font-medium text-white/90 flex items-center gap-1.5 capitalize">
                  <MapPin size={14} className="text-[#FFD166]" />
                  {order.delivery_type.replace('_', ' ')}
                </p>
              </div>
              {order.occasion_tag && (
                <div className="col-span-2 pt-2 border-t border-white/5 mt-2">
                  <p className="text-xs text-white/40 mb-1">Ocasião</p>
                  <p className="text-sm font-medium text-white/90 flex items-center gap-1.5">
                    <Tag size={14} className="text-[#C084FC]" />
                    {order.occasion_tag}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Itens */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Itens</h2>
            <OrderItemsEditor 
              items={order.order_items || []} 
              role={role}
              onUpdate={() => refetchOrder()}
            />
          </div>

        </div>

        {/* Coluna Direita (Checklist + Pagamentos) */}
        <div className="space-y-6">

          {/* Checklist (Produção) */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Produção</h2>
            <ChecklistPanel 
              orderId={order.id}
              status={order.status}
              items={order.order_items || []}
              onConfirmReady={() => updateOrderStatus(order.id, 'pronto')}
              onConfirmDelivery={() => updateOrderStatus(order.id, order.delivery_type === 'retirada' ? 'retirado' : 'entregue')}
            />
          </div>

          {/* Financeiro */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Financeiro</h2>
            <PaymentPanel 
              orderId={order.id}
              total={order.total}
              payments={payments}
              role={role}
              onAddPayment={async (input) => { await addPayment(input); refetchPayments(); }}
              onUpdateStatus={async (id, s) => { await updatePaymentStatus(id, s); refetchPayments(); }}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
