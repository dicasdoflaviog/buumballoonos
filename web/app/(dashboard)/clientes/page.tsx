'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCustomers } from '@/hooks/use-customers'
import { CustomerCard } from '@/components/clientes/customer-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Filter } from 'lucide-react'
import { CustomerForm } from '@/components/clientes/customer-form'

export default function ClientesPage() {
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // Debounced form of search
  const [isAdding, setIsAdding] = useState(false)

  // Em um app real, colocaríamos um debounce no setSearchQuery
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(search)
    }
  }

  const { customers, isLoading } = useCustomers(searchQuery)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Clientes</h1>
          <p className="text-sm text-white/50">Gerencie sua base de clientes e LTV</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto text-white rounded-xl"
              style={{ background: 'linear-gradient(135deg, #FF3D7F 0%, #C084FC 100%)', border: 'none' }}
            >
              <Plus size={16} className="mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1525', border: '1px solid rgba(255,255,255,0.1)' }}>
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <CustomerForm onSuccess={() => setIsAdding(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Buscar por nome, telefone ou bairro (Pressione Enter)..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-10"
          />
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-white/40 text-sm">Carregando clientes...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
          <p className="text-white/50">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  )
}
