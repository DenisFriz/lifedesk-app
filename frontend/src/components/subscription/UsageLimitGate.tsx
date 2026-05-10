import React from 'react'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

interface Props {
  current: number
  max: number | typeof Infinity
  label?: string
  message?: string
  children: React.ReactNode
  className?: string
  inline?: boolean
}

export default function UsageLimitGate({
  current,
  max,
  label,
  message,
  children,
  className
}: Props) {
  const isAtLimit = max !== Infinity && current >= max

  if (!isAtLimit) return <>{children}</>

  const tooltipText =
    message ??
    `You've reached your ${label ? `${label} ` : ''}limit of ${max} on your current plan. Upgrade to add more.`

  return (
    <div className={cn('relative group inline-block', className)}>
      {/* Disabled child */}
      <div className="pointer-events-none select-none opacity-40 grayscale">{children}</div>

      {/* Tooltip - shows below the element, right-aligned to avoid clipping */}
      <div className="absolute top-full right-0 mt-2 z-[9999] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none w-52">
        <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800" />
        <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
          <div className="flex items-start gap-2">
            <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{tooltipText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
