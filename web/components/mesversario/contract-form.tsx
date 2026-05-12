'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createContract } from '@/app/actions/mesversario'
import { searchCustomers } from '@/hooks/use-customers'
import { MESVERSARIO_PLANS } from '@/lib/utils/constants'
import { formatCurrency, formatPhone, formatDate } from '@/lib/utils/formatters'
import { addMonths, parseISO, isValid } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Calendar, User, Baby } from 'lucide-react'

export function ContractForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Autocomplete Estado
  const [searchQuery, setSearchQuery] = useState('')
  const [customerOptions, setCustomerOptions] = useState<{id: string, full_name: string, phone: string}[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [formData, setFormData] = useState({
    customer_id: '',
    baby_name: '',
    baby_gender: 'nao_informar',
    birth_date: '',
    plan_type: 'basico',
    start_date: '',
    annual_discount_applied: false
  })

  // Selected customer for display
  const [selectedCustomerName, setSelectedCustomerName] = useState('')

  // Efeito do Autocomplete
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        const res = await searchCustomers(searchQuery)
        setCustomerOptions(res)
        setIsSearching(false)
      } else {
        setCustomerOptions([])
      }
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  function selectCustomer(c: {id: string, full_name: string, phone: string}) {
    setFormData(prev => ({ ...prev, customer_id: c.id }))
    setSelectedCustomerName(`${c.full_name} (${formatPhone(c.phone)})`)
    setSearchQuery('')
    setCustomerOptions([])
  }

  // Previsão dos Meses
  const startObj = parseISO(formData.start_date)
  const hasValidStart = isValid(startObj)

  const previewMonths = hasValidStart 
    ? Array.from({ length: 12 }, (_, i) => addMonths(startObj, i))
    : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customer_id) {
      setError('Selecione um cliente válido da lista.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const contract = await createContract(formData)
      if (contract) {
        router.push(`/mesversario/${contract.id}`)
      }
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white/[0.02] border border-white/5 p-5 sm:p-6 rounded-2xl">
      <div className="space-y-5">
        {/* 1. Cliente */}
        <div className="space-y-1.5 relative">
          <Label className="text-white/60">Responsável (Cliente) *</Label>
          {!formData.customer_id ? (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite nome ou telefone para buscar..."
                  className="pl-9 bg-white/5 border-white/10 text-white" 
                />
              </div>
              {/* Dropdown de opções */}
              {customerOptions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#1a1525] border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                  {customerOptions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center justify-between text-sm transition-colors"
                    >
                      <span className="text-white font-medium">{c.full_name}</span>
                      <span className="text-white/40">{formatPhone(c.phone)}</span>
                    </button>
                  ))}
                </div>
              )}
              {isSearching && <p className="text-xs text-white/40 mt-1">Buscando...</p>}
            </>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#C084FC]/10 border border-[#C084FC]/30">
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#C084FC]" />
                <span className="text-sm font-medium text-white">{selectedCustomerName}</span>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFormData(prev => ({ ...prev, customer_id: '' })); setSelectedCustomerName('') }}
                className="h-6 text-xs text-[#C084FC] hover:text-[#C084FC] hover:bg-[#C084FC]/20"
              >
                Trocar
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Bebê */}
          <div className="space-y-1.5">
            <Label className="text-white/60 flex items-center gap-1.5"><Baby size={14} /> Nome do Bebê *</Label>
            <Input 
              required
              value={formData.baby_name}
              onChange={(e) => setFormData(prev => ({ ...prev, baby_name: e.target.value }))}
              placeholder="Ex: Theo"
              className="bg-white/5 border-white/10 text-white" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 flex items-center gap-1.5"><Calendar size={14} /> Data de Nascimento *</Label>
            <Input 
              type="date"
              required
              value={formData.birth_date}
              onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              className="bg-white/5 border-white/10 text-white" 
            />
          </div>

          <div className="space-y-1.5 md:col-span-2 pt-2">
            <Label className="text-white/60">Plano do Mêsversário *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {Object.entries(MESVERSARIO_PLANS).map(([key, plan]) => (
                <label 
                  key={key}
                  className={`
                    flex flex-col p-3 rounded-xl border cursor-pointer transition-colors
                    ${formData.plan_type === key 
                      ? 'bg-[#C084FC]/10 border-[#C084FC] text-[#C084FC]' 
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{plan.label}</span>
                    <input 
                      type="radio" 
                      name="plan" 
                      value={key} 
                      checked={formData.plan_type === key}
                      onChange={() => setFormData(prev => ({ ...prev, plan_type: key }))}
                      className="accent-[#C084FC]"
                    />
                  </div>
                  <span className="text-lg font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-xs opacity-60">/mês</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60">Data do 1º Mês (Início) *</Label>
            <Input 
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="bg-white/5 border-white/10 text-white" 
            />
          </div>

          <div className="space-y-1.5 flex items-end">
            <label className="flex items-center gap-3 p-3 w-full rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
              <input 
                type="checkbox"
                checked={formData.annual_discount_applied}
                onChange={(e) => setFormData(prev => ({ ...prev, annual_discount_applied: e.target.checked }))}
                className="w-4 h-4 accent-[#FF3D7F] rounded"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Aplicar desconto anual (10%)</span>
                <span className="text-xs text-white/40">Para fechamento do pacote completo</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Preview Timeline */}
      {hasValidStart && (
        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Previsão dos 12 meses</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {previewMonths.map((date, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-2 flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Mês {idx + 1}</span>
                <span className="text-xs text-white/50">{formatDate(date).slice(0, 5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full text-white h-11"
          style={{ background: 'linear-gradient(135deg, #FF3D7F, #C084FC)', border: 'none' }}
        >
          {loading ? 'Gerando Contrato...' : 'Criar Contrato (12 meses)'}
        </Button>
      </div>
    </form>
  )
}
