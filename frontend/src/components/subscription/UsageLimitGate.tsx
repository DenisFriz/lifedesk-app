import React from 'react'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

interface Props {
  allowed: boolean
  label?: string
  message?: string
  children: React.ReactNode
  className?: string
}

export default function UsageLimitGate({ allowed, label, message, children, className }: Props) {
  const isBlocked = !allowed

  if (!isBlocked) return <>{children}</>

  const tooltipText =
    message ??
    `You've reached your ${label ? `${label} ` : ''}limit on your current plan. Upgrade to continue.`

  return (
    <div className={cn('relative group inline-block', className)}>
      {/* Disabled child */}
      <div className="pointer-events-none select-none opacity-40 grayscale">{children}</div>

      {/* Tooltip */}
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
