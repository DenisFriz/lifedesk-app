import { BookOpen, Clock, Trophy, TrendingUp } from 'lucide-react'

interface Props {
  items: any[]
}

export default function LearningStats({ items }: Props) {
  const completed = items.filter(i => i.status === 'completed').length
  const inProgress = items.filter(i => i.status === 'in_progress').length
  const totalHours = items.reduce((sum, i) => sum + (i.time_invested_hours || 0), 0)
  const total = items.length

  const stats = [
    {
      label: 'Total Items',
      value: total,
      icon: BookOpen,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Completed',
      value: completed,
      icon: Trophy,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Hours Invested',
      value: totalHours.toFixed(0),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
        >
          <div
            className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
