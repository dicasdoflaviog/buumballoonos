import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type KPIColor = 'rosa' | 'lilas' | 'verde' | 'amarelo'
type KPITrend = 'up' | 'down' | 'neutral'

const COLOR_MAP: Record<
  KPIColor,
  { hex: string; bg: string; glow: string }
> = {
  rosa: {
    hex: '#FF3D7F',
    bg: 'rgba(255,61,127,0.12)',
    glow: 'rgba(255,61,127,0.15)',
  },
  lilas: {
    hex: '#C084FC',
    bg: 'rgba(192,132,252,0.12)',
    glow: 'rgba(192,132,252,0.15)',
  },
  verde: {
    hex: '#06D6A0',
    bg: 'rgba(6,214,160,0.12)',
    glow: 'rgba(6,214,160,0.15)',
  },
  amarelo: {
    hex: '#FFD166',
    bg: 'rgba(255,209,102,0.12)',
    glow: 'rgba(255,209,102,0.15)',
  },
}

const TREND_ICONS: Record<KPITrend, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
}

const TREND_COLORS: Record<KPITrend, string> = {
  up: '#06D6A0',
  down: '#FF3D7F',
  neutral: 'rgba(255,255,255,0.3)',
}

export interface KPICardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  color?: KPIColor
  trend?: KPITrend
}

export function KPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  color = 'rosa',
  trend,
}: KPICardProps) {
  const palette = COLOR_MAP[color]
  const TrendIcon = trend ? TREND_ICONS[trend] : null

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01]"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: `0 0 24px ${palette.glow}`,
      }}
    >
      {/* Topo: label + ícone */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {label}
        </span>
        {Icon && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: palette.bg }}
          >
            <Icon size={16} style={{ color: palette.hex }} />
          </div>
        )}
      </div>

      {/* Valor principal */}
      <div>
        <p
          className="text-2xl font-bold tracking-tight text-white leading-none"
        >
          {value}
        </p>
        {subtitle && (
          <p
            className="text-xs mt-1.5"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Trend indicator */}
      {TrendIcon && (
        <div className="flex items-center gap-1.5">
          <TrendIcon size={13} style={{ color: TREND_COLORS[trend!] }} />
          <span
            className="text-xs font-medium"
            style={{ color: TREND_COLORS[trend!] }}
          >
            {trend === 'up' ? 'Em alta' : trend === 'down' ? 'Em queda' : 'Estável'}
          </span>
        </div>
      )}
    </div>
  )
}
