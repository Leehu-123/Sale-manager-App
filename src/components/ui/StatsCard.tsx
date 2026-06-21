import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: { value: string; positive: boolean }
  gradient: string
  delay?: number
}

export function StatsCard({ icon: Icon, label, value, trend, gradient, delay = 0 }: StatsCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl p-5 text-white overflow-hidden',
        'hover:scale-[1.02] transition-transform duration-200 cursor-default',
        'animate-fade-in shadow-lg',
        gradient
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-4 translate-x-4" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-6 -translate-x-6" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon size={20} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
              {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend.value}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-white/80 mt-1">{label}</p>
      </div>
    </div>
  )
}
