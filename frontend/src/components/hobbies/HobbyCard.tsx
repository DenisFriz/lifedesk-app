import { HobbyItem } from '@/types/entities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Trash2, Pencil, Clock, Calendar, Zap } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'

const COLOR_BG = {
  purple: 'bg-purple-100',
  pink: 'bg-pink-100',
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  orange: 'bg-orange-100',
  amber: 'bg-amber-100',
  rose: 'bg-rose-100',
  teal: 'bg-teal-100',
  indigo: 'bg-indigo-100',
  cyan: 'bg-cyan-100'
}
const COLOR_TEXT = {
  purple: 'text-purple-700',
  pink: 'text-pink-700',
  blue: 'text-blue-700',
  green: 'text-green-700',
  orange: 'text-orange-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700',
  teal: 'text-teal-700',
  indigo: 'text-indigo-700',
  cyan: 'text-cyan-700'
}
const COLOR_DOT = {
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500'
}

const CATEGORY_EMOJI = {
  music: '🎵',
  arts_crafts: '🎨',
  sports_outdoor: '🏃',
  gaming: '🎮',
  cooking_food: '🍳',
  reading_writing: '📚',
  technology: '💻',
  collecting: '🪙',
  travel: '✈️',
  other: '⭐'
}

const SKILL_COLORS = {
  beginner: 'bg-slate-100 text-slate-600',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-indigo-100 text-indigo-700',
  expert: 'bg-purple-100 text-purple-700'
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  on_pause: 'bg-amber-100 text-amber-700',
  want_to_start: 'bg-sky-100 text-sky-700',
  retired: 'bg-slate-100 text-slate-500'
}

const FREQ_LABELS = {
  daily: 'Daily',
  few_times_week: 'Few times/wk',
  weekly: 'Weekly',
  monthly: 'Monthly',
  occasionally: 'Occasionally'
}

interface Props {
  hobby: HobbyItem & {
    description?: string
    frequency?: string
    avg_session_minutes?: number
    started_date?: string
    equipment?: string
    status?: string
  }
  onEdit: (hobby: any) => void
  onDelete: (id: string) => void
}

export default function HobbyCard({ hobby, onEdit, onDelete }: Props) {
  const color = hobby.color || 'purple'

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-2 w-full ${COLOR_DOT[color]}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl">{CATEGORY_EMOJI[hobby.category] || '⭐'}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{hobby.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${SKILL_COLORS[hobby.skill_level]}`}
                >
                  {hobby.skill_level}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[hobby.status]}`}
                >
                  {hobby.status?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(hobby)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(hobby.id)} className="text-rose-600">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hobby.description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{hobby.description}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
          {hobby.frequency && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> {FREQ_LABELS[hobby.frequency]}
            </span>
          )}
          {hobby.avg_session_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {hobby.avg_session_minutes} min/session
            </span>
          )}
          {hobby.started_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Since{' '}
              {format(new Date(hobby.started_date), 'MMM yyyy')}
            </span>
          )}
        </div>

        {hobby.equipment && (
          <p className="text-xs text-slate-400 mt-2 truncate">🛠 {hobby.equipment}</p>
        )}
      </CardContent>
    </Card>
  )
}
