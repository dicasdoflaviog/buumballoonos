import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KPICard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime, formatOrderNumber } from '@/lib/utils/formatters'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils/constants'
import {
  DollarSign,
  ShoppingBag,
  Baby,
  TrendingUp,
  Plus,
  UserPlus,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Tipos
interface UpcomingOrder {
  id: string
  order_number: number
  status: string
  pickup_datetime: string
  total: number
  customers: any
}

// ─── Server Component: busca todos os dados no servidor ───────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()

  // ── 1. Faturamento do mês atual ────────────────────────────────────────────
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  let faturamentoMes = 0
  try {
    const { data: paymentsThisMonth } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'recebido')
      .gte('received_at', startOfMonth)
      .lte('received_at', endOfMonth)

    faturamentoMes = (paymentsThisMonth ?? []).reduce(
      (sum, p) => sum + p.amount, 0
    )
  } catch (err) {
    console.error('Erro ao buscar faturamentoMes:', err)
  }

  // ── 2. Pedidos em aberto ───────────────────────────────────────────────────
  let pedidosAberto = 0
  try {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['novo', 'confirmado', 'em_producao', 'pronto'])
    pedidosAberto = count ?? 0
  } catch (err) {
    console.error('Erro ao buscar pedidosAberto:', err)
  }

  // ── 3. Mêsversários ativos ────────────────────────────────────────────────
  let mesversariosAtivos = 0
  try {
    const { count } = await supabase
      .from('mesversario_contracts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ativo')
    mesversariosAtivos = count ?? 0
  } catch (err) {
    console.error('Erro ao buscar mesversariosAtivos:', err)
  }

  // ── 4. MRR (receita recorrente) ───────────────────────────────────────────
  let mrr = 0
  try {
    const { data: contratosAtivos } = await supabase
      .from('mesversario_contracts')
      .select('monthly_price')
      .eq('status', 'ativo')

    mrr = (contratosAtivos ?? []).reduce(
      (sum, c) => sum + c.monthly_price, 0
    )
  } catch (err) {
    console.error('Erro ao buscar mrr:', err)
  }

  // ── 5. Próximas 5 entregas (próximos 3 dias) ──────────────────────────────
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  let upcomingOrders: UpcomingOrder[] = []
  
  try {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, pickup_datetime, total, customers(full_name)')
      .gte('pickup_datetime', now.toISOString())
      .lte('pickup_datetime', in3Days)
      .not('status', 'in', '("cancelado","entregue","retirado")')
      .order('pickup_datetime', { ascending: true })
      .limit(5)
      
    upcomingOrders = (data ?? []) as UpcomingOrder[]
  } catch (err) {
    console.error('Erro ao buscar upcomingOrders:', err)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Atalhos rápidos */}
        <div className="flex items-center gap-2">
          <Link href="/pedidos/novo">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold text-white rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #FF3D7F 0%, #C084FC 100%)',
                border: 'none',
              }}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Novo Pedido</span>
              <span className="sm:hidden">Pedido</span>
            </Button>
          </Link>
          <Link href="/clientes">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-medium rounded-xl border-white/15 text-white/60 hover:text-white hover:bg-white/10"
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline">Novo Cliente</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Faturamento do mês"
          value={formatCurrency(faturamentoMes)}
          subtitle="Pagamentos recebidos"
          icon={DollarSign}
          color="verde"
          trend="neutral"
        />
        <KPICard
          label="Pedidos em aberto"
          value={pedidosAberto ?? 0}
          subtitle="Novo · Confirmado · Produção · Pronto"
          icon={ShoppingBag}
          color="rosa"
          trend={((pedidosAberto ?? 0) > 5) ? 'up' : 'neutral'}
        />
        <KPICard
          label="Mêsversários ativos"
          value={mesversariosAtivos ?? 0}
          subtitle="Contratos em andamento"
          icon={Baby}
          color="lilas"
          trend="neutral"
        />
        <KPICard
          label="MRR"
          value={formatCurrency(mrr)}
          subtitle="Receita recorrente mensal"
          icon={TrendingUp}
          color="amarelo"
          trend="neutral"
        />
      </div>

      {/* Próximas entregas */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Header da seção */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,61,127,0.15)' }}
            >
              <Calendar size={14} style={{ color: '#FF3D7F' }} />
            </div>
            <h2 className="text-sm font-semibold text-white">
              Próximas entregas
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              próximos 3 dias
            </span>
          </div>
          <Link href="/pedidos">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-white/40 hover:text-white/70 gap-1"
            >
              Ver todos <ChevronRight size={12} />
            </Button>
          </Link>
        </div>

        {/* Lista */}
        {!upcomingOrders || upcomingOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span className="text-3xl mb-3">🎈</span>
            <p className="text-sm font-medium text-white/50">
              Nenhuma entrega nos próximos 3 dias
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Crie um pedido para aparecer aqui
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {(upcomingOrders as UpcomingOrder[]).map((order) => (
              <Link
                key={order.id}
                href={`/pedidos/${order.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03] group"
              >
                {/* Número do pedido */}
                <div className="shrink-0">
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: '#FF3D7F' }}
                  >
                    {formatOrderNumber(order.order_number)}
                  </span>
                </div>

                {/* Cliente */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {Array.isArray(order.customers) 
                      ? order.customers[0]?.full_name 
                      : order.customers?.full_name ?? '—'}
                  </p>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {formatDateTime(order.pickup_datetime)}
                  </p>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                  </span>
                </div>

                {/* Valor */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(order.total)}
                  </p>
                </div>

                {/* Seta hover */}
                <ChevronRight
                  size={16}
                  className="shrink-0 text-white/20 group-hover:text-white/50 transition-colors"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
