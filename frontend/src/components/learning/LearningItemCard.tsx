import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, ExternalLink, Star, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const TYPE_ICONS = {
  course: '🎓',
  book: '📚',
  skill: '🛠️',
  podcast: '🎙️',
  video: '▶️',
  certification: '🏅',
  article: '📄',
  other: '📌'
}

const STATUS_COLORS = {
  want_to_learn: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700'
}

const STATUS_LABELS = {
  want_to_learn: 'Want to Learn',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold'
}

const PRIORITY_COLORS = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-slate-100 text-slate-600'
}

interface Props {
  item: any & {
    id: string
    title: string
    type?: string
    status?: string
    priority?: string
    author?: string
    skill_category?: string
    progress?: number
    time_invested_hours?: number
    rating?: number
    completed_date?: string
    key_takeaways?: string
    url?: string
  }
  onEdit: (item: any) => void
  onDelete: (id: string) => void
  onUpdateStatus?: (item: any, status: string) => void
}

export default function LearningItemCard({ item, onEdit, onDelete, onUpdateStatus }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
      <div className="flex gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[item.type] || '📌'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                {item.priority === 'high' && (
                  <Badge className={PRIORITY_COLORS.high}>High Priority</Badge>
                )}
              </div>
              {item.author && <p className="text-xs text-slate-500 mb-2">by {item.author}</p>}
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                {item.skill_category && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.skill_category}
                  </Badge>
                )}
                {item.type && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.type}
                  </Badge>
                )}
              </div>

              {/* Progress bar for in_progress */}
              {item.status === 'in_progress' && item.progress != null && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Progress</span>
                    <span className="text-xs font-medium text-slate-700">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                {item.time_invested_hours > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time_invested_hours}h
                  </span>
                )}
                {item.rating && (
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3 h-3',
                          i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        )}
                      />
                    ))}
                  </span>
                )}
                {item.completed_date && (
                  <span>Completed {format(new Date(item.completed_date), 'MMM d, yyyy')}</span>
                )}
              </div>

              {/* Expandable takeaways */}
              {item.key_takeaways && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    Key Takeaways
                    {expanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                  {expanded && (
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded p-2 whitespace-pre-wrap">
                      {item.key_takeaways}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
