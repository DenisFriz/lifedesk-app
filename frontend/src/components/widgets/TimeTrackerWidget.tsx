import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Clock, DollarSign } from 'lucide-react'
import { startOfWeek, endOfWeek, format, isWithinInterval, parseISO } from 'date-fns'
import type { TimeEntry } from '@/types/entities'

export default function TimeTrackerWidget() {
  const { data: entries = [] } = useQuery({
    queryKey: ['timeEntries-widget'],
    queryFn: () => backend.entities.TimeEntry.list('-date', 100) as Promise<TimeEntry[]>
  })

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const thisWeek = entries.filter(e => {
    if (!e.date || !e.end_time) return false
    const d = parseISO(e.date)
    return isWithinInterval(d, { start: weekStart, end: weekEnd })
  })

  const totalSeconds = thisWeek.reduce((sum, e) => sum + (e.duration || 0), 0)
  const billableSeconds = thisWeek
    .filter(e => e.billable)
    .reduce((sum, e) => sum + (e.duration || 0), 0)
  const nonBillableSeconds = totalSeconds - billableSeconds

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs === 0) return `${mins}m`
    return `${hrs}h ${mins}m`
  }

  const pct = totalSeconds > 0 ? Math.round((billableSeconds / totalSeconds) * 100) : 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">Time This Week</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-slate-900">{formatTime(totalSeconds)}</span>
          <span className="text-xs text-slate-500">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            {formatTime(billableSeconds)} billable
          </span>
          <span>{formatTime(nonBillableSeconds)} non-billable</span>
        </div>
        {thisWeek.length === 0 && (
          <p className="text-xs text-slate-400 text-center pt-1">No tracked time this week</p>
        )}
      </div>
    </div>
  )
}
