import React from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Brain } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { LearningItem } from '@/types/entities'

const TYPE_ICONS = {
  book: '📚',
  course: '🎓',
  skill: '🛠️',
  podcast: '🎙️',
  video: '🎥',
  certification: '🏅',
  article: '📄',
  other: '📌'
}

const STATUS_COLORS = {
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  want_to_learn: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_hold: 'bg-slate-50 text-slate-600 border-slate-200'
}

export default function LearningProgressWidget() {
  const { data: items = [] } = useQuery({
    queryKey: ['learningItems-widget'],
    queryFn: () => backend.entities.LearningItem.list('-created_date') as Promise<LearningItem[]>
  })

  const inProgress = items.filter(i => i.status === 'in_progress').slice(0, 3)
  const completed = items.filter(i => i.status === 'completed').length
  const total = items.length

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Learning Progress</h3>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-600">{inProgress.length}</p>
          <p className="text-xs text-slate-500">In Progress</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{completed}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-700">{total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
      </div>
      {inProgress.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing in progress</p>
      ) : (
        <div className="space-y-2">
          {inProgress.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0"
            >
              <span className="text-base">{TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
              </div>
              {item.progress_percentage != null && (
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {item.progress_percentage}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
