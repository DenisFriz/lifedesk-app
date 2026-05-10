import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Heart, TrendingUp, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Task, Goal } from '@/types/entities'

export default function HealthScoreTrendWidget() {
  const { data: bodyTasks = [] } = useQuery({
    queryKey: ['tasks-health-body'],
    queryFn: () => backend.entities.Task.filter({ category: 'health_body' }) as Promise<Task[]>
  })

  const { data: mindTasks = [] } = useQuery({
    queryKey: ['tasks-health-mind'],
    queryFn: () => backend.entities.Task.filter({ category: 'health_mind' }) as Promise<Task[]>
  })

  const { data: bodyGoals = [] } = useQuery({
    queryKey: ['goals-health-body'],
    queryFn: () => backend.entities.Goal.filter<Goal>({ category: 'health_body' })
  })

  const { data: mindGoals = [] } = useQuery({
    queryKey: ['goals-health-mind'],
    queryFn: () => backend.entities.Goal.filter({ category: 'health_mind' }) as Promise<Goal[]>
  })

  const allTasks = [...bodyTasks, ...mindTasks]
  const completedTasks = allTasks.filter(t => t.status === 'completed').length
  const totalTasks = allTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const allGoals = [...bodyGoals, ...mindGoals]
  const achievedGoals = allGoals.filter(g => g.status === 'completed').length
  const activeGoals = allGoals.filter(g => g.status === 'active').length

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-rose-600" />
        <h3 className="font-semibold text-slate-900">Health Overview</h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Task Completion</span>
            <span className="text-sm font-semibold text-slate-900">{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-slate-600">Active Goals</span>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
            {activeGoals}
          </Badge>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-slate-600">Achieved Goals</span>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
            {achievedGoals}
          </Badge>
        </div>
      </div>
    </div>
  )
}
