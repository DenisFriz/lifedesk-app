import React from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Task } from '@/types/entities'

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

export default function BusinessTasksWidget() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-business'],
    queryFn: () => backend.entities.Task.filter({ category: 'business', status: 'pending' }) as Promise<Task[]>
  })

  const recentTasks = tasks.slice(0, 5)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Business Tasks</h3>
      </div>
      {recentTasks.length === 0 ? (
        <p className="text-sm text-slate-500">No pending business tasks</p>
      ) : (
        <div className="space-y-2">
          {recentTasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-0"
            >
              <Circle className="w-4 h-4 text-slate-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                <Badge
                  variant="outline"
                  className={`text-xs mt-1 ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                >
                  {task.priority}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
