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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data)
    }
    loadProfile()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full py-5">
      {/* Logo */}
      <div className="px-5 mb-7">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 group"
        >
          <span className="text-2xl">🎈</span>
          <div>
            <p
              className="text-base font-bold leading-none"
              style={{ color: '#FF3D7F' }}
            >
              Buum OS
            </p>
            <p
              className="text-[10px] leading-none mt-0.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Buum Balloon
            </p>
          </div>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive(href)
                ? 'text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            )}
            style={
              isActive(href)
                ? {
                    background:
                      'linear-gradient(135deg, rgba(255,61,127,0.2) 0%, rgba(192,132,252,0.12) 100%)',
                    color: '#FF3D7F',
                    boxShadow: 'inset 0 0 0 1px rgba(255,61,127,0.2)',
                  }
                : {}
            }
          >
            <Icon
              size={18}
              style={isActive(href) ? { color: '#FF3D7F' } : {}}
            />
            {label}
          </Link>
        ))}
      </nav>

      <Separator
        className="mx-3 my-4"
        style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
      />

      {/* Rodapé: usuário + sair */}
      <div className="px-4 space-y-3">
        {profile && (
          <div className="flex items-start gap-3">
            {/* Avatar inicial */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, #FF3D7F 0%, #C084FC 100%)',
              }}
            >
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">
                {profile.full_name}
              </p>
              <Badge
                variant="outline"
                className="mt-0.5 text-[10px] px-1.5 py-0 border-white/20 text-white/40"
              >
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-colors text-white/40 hover:text-red-400 hover:bg-red-400/10"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  )
}
