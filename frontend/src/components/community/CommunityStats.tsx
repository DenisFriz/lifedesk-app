import { Lightbulb, ThumbsUp, CheckCircle, Clock } from 'lucide-react'
import { CommunityIdeaRecord } from '@/db'

interface CommunityStatsProps {
  ideas: CommunityIdeaRecord[]
}

export default function CommunityStats({ ideas }: CommunityStatsProps) {
  const total = ideas.length
  const totalVotes = ideas.reduce((sum, i) => sum + (i.likes_count || 0), 0)
  const implemented = ideas.filter(i => i.status === 'implemented').length
  const inProgress = ideas.filter(i =>
    ['planned', 'in_progress', 'under_review'].includes(i.status)
  ).length

  const stats = [
    {
      label: 'Total Ideas',
      value: total,
      icon: Lightbulb,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Total Votes',
      value: totalVotes,
      icon: ThumbsUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Implemented',
      value: implemented,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
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
