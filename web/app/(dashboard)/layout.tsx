'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/shared/sidebar'
import { Header } from '@/components/shared/header'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { RealtimeProvider } from '@/components/shared/realtime-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0D0A14' }}>
      {/* <RealtimeProvider /> */}
      {/* Sidebar fixa — desktop */}
      <aside
        className="hidden lg:flex flex-col shrink-0"
        style={{
          width: '240px',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          backgroundColor: 'rgba(255,255,255,0.02)',
        }}
      >
        <Sidebar onNavigate={() => {}} />
      </aside>

      {/* Sheet (drawer) — mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 border-0"
          style={{
            width: '240px',
            backgroundColor: '#0D0A14',
            borderRight: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Área principal */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header — só visível em mobile */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
