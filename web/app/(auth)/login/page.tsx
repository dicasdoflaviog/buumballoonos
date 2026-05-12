'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('E-mail ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="text-3xl">🎈</span>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#FF3D7F' }}
          >
            Buum OS
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Sistema operacional da Buum Balloon
        </p>
      </div>

      {/* Card de login */}
      <div
        className="rounded-2xl p-7 shadow-xl"
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <h2 className="text-xl font-semibold text-white mb-6">Entrar</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/70 text-sm">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11 text-white placeholder:text-white/30"
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/70 text-sm">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 text-white placeholder:text-white/30"
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-semibold text-white rounded-xl mt-2 transition-all duration-200"
            style={{
              background: loading
                ? 'rgba(255,61,127,0.5)'
                : 'linear-gradient(135deg, #FF3D7F 0%, #C084FC 100%)',
              border: 'none',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Buum Balloon · Teixeira de Freitas, BA
      </p>
    </div>
  )
}
