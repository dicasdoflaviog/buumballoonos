'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomer, updateCustomer } from '@/app/actions/customers'
import { formatPhone, formatCPF } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Customer } from '@/hooks/use-customers'

interface CustomerFormProps {
  initialData?: Customer
  onSuccess?: () => void
}

export function CustomerForm({ initialData, onSuccess }: CustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: initialData?.full_name ?? '',
    phone: initialData?.phone ? formatPhone(initialData.phone) : '',
    cpf: initialData?.cpf ?? '',
    email: initialData?.email ?? '',
    neighborhood: initialData?.neighborhood ?? '',
    instagram: initialData?.instagram ?? '',
    gender: initialData?.gender ?? 'nao_informar',
    customer_type: initialData?.customer_type ?? 'pessoa_fisica',
    source: initialData?.source ?? '',
  })

  function handleChange(field: string, value: string) {
    if (field === 'phone') {
      value = formatPhone(value)
    }
    if (field === 'cpf') {
      value = formatCPF(value)
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (initialData?.id) {
        await updateCustomer(initialData.id, formData)
      } else {
        const newCustomer = await createCustomer(formData)
        if (newCustomer) {
          router.push(`/clientes/${newCustomer.id}`)
        }
      }
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white/[0.02] border border-white/5 p-5 sm:p-6 rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-white/60">Nome Completo *</Label>
          <Input 
            required
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="Ex: Maria Joaquina"
            className="bg-white/5 border-white/10 text-white" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60">Telefone / WhatsApp *</Label>
          <Input 
            required
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(73) 99999-9999"
            maxLength={15}
            className="bg-white/5 border-white/10 text-white" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60">CPF</Label>
          <Input 
            value={formData.cpf}
            onChange={(e) => handleChange('cpf', e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            className="bg-white/5 border-white/10 text-white" 
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-white/60">Bairro</Label>
          <Input 
            value={formData.neighborhood}
            onChange={(e) => handleChange('neighborhood', e.target.value)}
            placeholder="Ex: Urbis"
            className="bg-white/5 border-white/10 text-white" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60">E-mail</Label>
          <Input 
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="maria@email.com"
            className="bg-white/5 border-white/10 text-white" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60">Instagram</Label>
          <Input 
            value={formData.instagram}
            onChange={(e) => handleChange('instagram', e.target.value)}
            placeholder="@maria"
            className="bg-white/5 border-white/10 text-white" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60">Gênero</Label>
          <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="nao_informar">Prefiro não informar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60">Origem (Onde nos conheceu?)</Label>
          <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="google">Busca no Google</SelectItem>
              <SelectItem value="passando_frente">Passando na frente</SelectItem>
              <SelectItem value="ifood">iFood / Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2 mt-4">
          {error}
        </p>
      )}

      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full text-white h-11"
          style={{ background: 'linear-gradient(135deg, #06D6A0, #04b385)', border: 'none' }}
        >
          {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </Button>
      </div>
    </form>
  )
}
