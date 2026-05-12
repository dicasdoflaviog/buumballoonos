'use client'

import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 h-14 lg:hidden shrink-0"
      style={{
        backgroundColor: 'rgba(13,10,20,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Hamburger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-white/60 hover:text-white hover:bg-white/10 -ml-1"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </Button>

      {/* Logo centralizado */}
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <span className="text-xl">🎈</span>
        <span
          className="text-base font-bold"
          style={{ color: '#FF3D7F' }}
        >
          Buum OS
        </span>
      </div>

      {/* Sino de notificações (UI only) */}
      <Button
        variant="ghost"
        size="icon"
        className="text-white/40 hover:text-white hover:bg-white/10 -mr-1"
        aria-label="Notificações"
      >
        <Bell size={20} />
      </Button>
    </header>
  )
}
