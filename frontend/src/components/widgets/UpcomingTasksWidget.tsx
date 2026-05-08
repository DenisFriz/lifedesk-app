import React from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { ListTodo, Circle, Target, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task, Goal, Event } from '@/types/entities'

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

export default function UpcomingTasksWidget() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-upcoming'],
    queryFn: async () => {
      const allTasks = (await backend.entities.Task.filter({ status: 'pending' })) as Task[]
      return allTasks
        .filter(t => t.due_date)
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 3)
    }
  })

  const { data: goals = [] } = useQuery({
    queryKey: ['goals-upcoming'],
    queryFn: async () => {
      const allGoals = (await backend.entities.Goal.filter({ status: 'active' })) as Goal[]
      return allGoals
        .filter(g => g.target_date)
        .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())
        .slice(0, 2)
    }
  })

  const { data: events = [] } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: async () => {
      const allEvents = (await backend.entities.Event.filter({ status: 'active' })) as Event[]
      return allEvents
        .filter(e => e.start_date)
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .slice(0, 2)
    }
  })

  const allItems = [
    ...tasks.map(t => ({ ...t, type: 'task' as const, date: t.due_date! })),
    ...goals.map(g => ({ ...g, type: 'goal' as const, date: g.target_date! })),
    ...events.map(e => ({ ...e, type: 'event' as const, date: e.start_date }))
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">All Tasks & Events</h3>
      </div>
      {allItems.length === 0 ? (
        <p className="text-sm text-slate-500">No upcoming items</p>
      ) : (
        <div className="space-y-2">
          {allItems.map(item => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-0"
            >
              {item.type === 'task' && <Circle className="w-4 h-4 text-slate-400 mt-0.5" />}
              {item.type === 'goal' && <Target className="w-4 h-4 text-emerald-600 mt-0.5" />}
              {item.type === 'event' && <Clock className="w-4 h-4 text-purple-600 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      item.type === 'task' && 'bg-blue-50 text-blue-700 border-blue-200',
                      item.type === 'goal' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      item.type === 'event' && 'bg-purple-50 text-purple-700 border-purple-200'
                    )}
                  >
                    {item.type}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {format(new Date(item.date), 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
