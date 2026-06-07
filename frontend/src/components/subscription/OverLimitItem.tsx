import React from 'react'
import { Lock, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  className?: string
}

export default function OverLimitItem({ children, className }: Props) {
  return (
    <div className={cn('relative group', className)}>
      {/* Blurred, non-interactive content */}
      <div className="pointer-events-none select-none blur-sm opacity-60">{children}</div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Link
          to="/upgrade"
          className="flex items-center gap-2 bg-slate-800/90 text-white text-xs font-medium rounded-full px-3 py-1.5 shadow-lg pointer-events-auto hover:bg-slate-700 transition-colors"
        >
          <Lock className="w-3 h-3" />
          <span>Over plan limit</span>
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400">Upgrade</span>
        </Link>
      </div>
    </div>
  )
}
