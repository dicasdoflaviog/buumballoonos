'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCustomer } from '@/hooks/use-customers'
import { formatCurrency, formatPhone, formatDateTime } from '@/lib/utils/formatters'
import { CustomerHistory } from '@/components/clientes/customer-history'
import { CustomerForm } from '@/components/clientes/customer-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Edit, Plus, Phone, MapPin, Instagram, Mail, Calendar } from 'lucide-react'

// Utiliza a prop params descapsulada com React.use
export default function ClienteDetalhePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const id = params.id
  
  const router = useRouter()
  const { customer, isLoading, refetch } = useCustomer(id)
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) {
    return <div className="text-center py-12 text-white/40 text-sm">Carregando perfil...</div>
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">Cliente não encontrado.</p>
        <Button variant="outline" onClick={() => router.push('/clientes')} className="text-white">Voltar</Button>
      </div>
    )
  }

  // Mascarar CPF se existir
  const maskedCpf = customer.cpf ? `***.***.***-${customer.cpf.slice(-2)}` : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 shrink-0">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {customer.full_name}
            </h1>
            <p className="text-sm text-white/50 mt-1">Cliente desde {formatDateTime(customer.created_at).split(' ')[0]}</p>
          </div>
        </div>

        <Link href={`/pedidos/novo?customer_id=${customer.id}`}>
          <Button 
            className="text-white"
            style={{ background: 'linear-gradient(135deg, #FF3D7F, #C084FC)', border: 'none' }}
          >
            <Plus size={16} className="mr-2" />
            Novo Pedido
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Perfil */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl relative">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-white/40 hover:text-white/80 hover:bg-white/10">
                  <Edit size={14} />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1525', border: '1px solid rgba(255,255,255,0.1)' }}>
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Editar Cliente</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <CustomerForm initialData={customer} onSuccess={() => { setIsEditing(false); refetch(); }} />
                </div>
              </DialogContent>
            </Dialog>

            <h2 className="text-sm font-semibold text-white/80 mb-5">Dados Pessoais</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Phone size={16} className="text-white/40 mt-0.5" />
                <div>
                  <p className="text-white/90 font-medium">{formatPhone(customer.phone)}</p>
                  <p className="text-xs text-white/40">WhatsApp / Telefone</p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-start gap-3 text-sm">
                  <Mail size={16} className="text-white/40 mt-0.5" />
                  <div>
                    <p className="text-white/90 font-medium">{customer.email}</p>
                    <p className="text-xs text-white/40">E-mail</p>
                  </div>
                </div>
              )}

              {customer.instagram && (
                <div className="flex items-start gap-3 text-sm">
                  <Instagram size={16} className="text-white/40 mt-0.5" />
                  <div>
                    <p className="text-white/90 font-medium">{customer.instagram}</p>
                    <p className="text-xs text-white/40">Instagram</p>
                  </div>
                </div>
              )}

              {customer.neighborhood && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={16} className="text-white/40 mt-0.5" />
                  <div>
                    <p className="text-white/90 font-medium">{customer.neighborhood}</p>
                    <p className="text-xs text-white/40">Bairro</p>
                  </div>
                </div>
              )}

              {maskedCpf && (
                <div className="pt-2 border-t border-white/5 mt-4">
                  <p className="text-xs text-white/40">CPF</p>
                  <p className="text-sm font-mono text-white/80">{maskedCpf}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Tags do Cliente</h2>
            {(!customer.tags || customer.tags.length === 0) ? (
              <p className="text-xs text-white/40 text-center py-2">Nenhuma tag associada.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customer.tags.map(t => (
                  <span 
                    key={t.tags.id} 
                    className="text-xs font-medium px-2.5 py-1 rounded-full border"
                    style={{ 
                      backgroundColor: `${t.tags.color}15`, 
                      color: t.tags.color,
                      borderColor: `${t.tags.color}30` 
                    }}
                  >
                    {t.tags.name}
                  </span>
                ))}
              </div>
            )}
            {/* O modal de adicionar tags pode ser incluído no futuro */}
          </div>
        </div>

        {/* Coluna Direita: Pedidos e LTV */}
        <div className="lg:col-span-2 space-y-6">
          {/* LTV Resumo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#06D6A0]/10 text-[#06D6A0]">
                <span className="font-bold text-lg">R$</span>
              </div>
              <div>
                <p className="text-xs text-white/50">LTV (Total Gasto)</p>
                <p className="text-xl font-bold text-white">{formatCurrency(customer.total_spent)}</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#C084FC]/10 text-[#C084FC]">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-white/50">Total de Pedidos</p>
                <p className="text-xl font-bold text-white">{customer.total_orders}</p>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Histórico de Pedidos</h2>
            <CustomerHistory orders={customer.orders || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
