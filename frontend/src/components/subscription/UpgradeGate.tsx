import React from 'react'
import { cn } from '@/lib/utils'
import { Lock, Zap } from 'lucide-react'

interface Props {
  enabled: boolean
  message?: string
  children: React.ReactNode
  className?: string
  inline?: boolean
  align?: 'center' | 'left' | 'right'
}

export default function UpgradeGate({
  enabled,
  message,
  children,
  className,
  inline = false,
  align = 'center'
}: Props) {
  if (enabled) return <>{children}</>

  const tooltipText = message ?? 'Upgrade your plan to unlock this feature.'

  const tooltipPositionClass =
    align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2'

  const arrowPositionClass =
    align === 'right' ? 'right-4' : align === 'left' ? 'left-4' : 'left-1/2 -translate-x-1/2'

  return (
    <div className={cn('relative group', inline ? 'inline-block' : 'block', className)}>
      {/* Greyed-out, non-interactive children */}
      <div className="pointer-events-none select-none opacity-40 grayscale">{children}</div>

      {/* Lock overlay — subtle indicator */}
      <div className="absolute inset-0 top-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="bg-slate-800/80 rounded-full p-1">
          <Lock className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Tooltip */}
      <div
        className={cn(
          `
    absolute
    left-1/2
    -translate-x-1/2
    bottom-full
    mb-3
    z-50
    opacity-0
    group-hover:opacity-100
    transition-opacity
    duration-150
    pointer-events-none

    w-max
    max-w-[220px]

    max-[640px]:max-w-[180px]
    max-[480px]:max-w-[160px]
    max-[360px]:max-w-[140px]

    lg:bottom-0
    lg:mb-0
    `,
          tooltipPositionClass
        )}
      >
        <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl flex items-start gap-2">
          <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>{tooltipText}</span>
        </div>
        {/* Arrow */}
        <div
          className={cn(
            'absolute top-full border-4 border-transparent border-t-slate-800',
            arrowPositionClass
          )}
        />
      </div>
    </div>
  )
}
