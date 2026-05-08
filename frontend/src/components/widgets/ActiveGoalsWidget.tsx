import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Target } from 'lucide-react'
import { parseISO, differenceInDays } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Goal } from '@/types/entities'

const CATEGORY_LABELS = {
  health_body: 'Health',
  health_mind: 'Mind',
  fitness: 'Fitness',
  assets: 'Assets',
  finances: 'Finance',
  business: 'Business',
  hobbies: 'Hobbies',
  learning: 'Learning',
  relationships: 'Relations'
}

const CATEGORY_COLORS = {
  health_body: 'bg-rose-50 text-rose-700 border-rose-200',
  health_mind: 'bg-pink-50 text-pink-700 border-pink-200',
  fitness: 'bg-blue-50 text-blue-700 border-blue-200',
  assets: 'bg-amber-50 text-amber-700 border-amber-200',
  finances: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  business: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  hobbies: 'bg-purple-50 text-purple-700 border-purple-200',
  learning: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  relationships: 'bg-orange-50 text-orange-700 border-orange-200'
}

export default function ActiveGoalsWidget() {
  const { data: goals = [] } = useQuery({
    queryKey: ['goals-active-widget'],
    queryFn: () => backend.entities.Goal.filter({ status: 'active' }) as Promise<Goal[]>
  })

  const sorted = [...goals]
    .filter(g => g.target_date)
    .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())
    .slice(0, 5)

  const noDateGoals = goals.filter(g => !g.target_date).slice(0, 2)

  const allShown = [...sorted, ...noDateGoals].slice(0, 5)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-900">Active Goals</h3>
        <span className="ml-auto text-xs text-slate-400">{goals.length} total</span>
      </div>
      {allShown.length === 0 ? (
        <p className="text-sm text-slate-500">No active goals</p>
      ) : (
        <div className="space-y-2">
          {allShown.map(goal => {
            const daysLeft = goal.target_date
              ? differenceInDays(parseISO(goal.target_date), new Date())
              : null
            const overdue = daysLeft !== null && daysLeft < 0
            return (
              <div
                key={goal.id}
                className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-0"
              >
                <Target className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{goal.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', CATEGORY_COLORS[goal.category as keyof typeof CATEGORY_COLORS])}
                    >
                      {CATEGORY_LABELS[goal.category as keyof typeof CATEGORY_LABELS] || goal.category}
                    </Badge>
                    {goal.target_date && (
                      <span
                        className={cn(
                          'text-xs',
                          overdue ? 'text-rose-600 font-semibold' : 'text-slate-400'
                        )}
                      >
                        {overdue
                          ? `${Math.abs(daysLeft!)}d overdue`
                          : daysLeft === 0
                            ? 'Today'
                            : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
