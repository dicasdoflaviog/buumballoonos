'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Baby,
  LogOut,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/mesversario', label: 'Mêsversário', icon: Baby },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  operator: 'Operador',
  helper: 'Auxiliar',
}

interface SidebarProps {
  onNavigate: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<{
    full_name: string
    role: string
  } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single()

        if (data) setProfile(data)
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      }
    }
    loadProfile()
  }, [])

  async function handleSignOut() {
    try {