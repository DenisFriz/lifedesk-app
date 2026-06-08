import React from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, MessageCircle, Trash2, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { CommunityIdeaRecord } from '@/db'

const CATEGORY_STYLES = {
  new_feature: { label: '✨ New Feature', cls: 'bg-indigo-100 text-indigo-700' },
  optimization: { label: '⚡ Optimization', cls: 'bg-amber-100 text-amber-700' },
  ui_ux: { label: '🎨 UI / UX', cls: 'bg-pink-100 text-pink-700' },
  bug_fix: { label: '🐛 Bug Fix', cls: 'bg-red-100 text-red-700' },
  other: { label: '💡 Other', cls: 'bg-slate-100 text-slate-600' }
} as const

const STATUS_STYLES = {
  new: { label: 'New', cls: 'bg-slate-100 text-slate-600' },
  under_review: { label: 'Under Review', cls: 'bg-blue-100 text-blue-700' },
  planned: { label: 'Planned', cls: 'bg-indigo-100 text-indigo-700' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  implemented: { label: '✅ Implemented', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' }
} as const

interface IdeaCardProps {
  idea: CommunityIdeaRecord
  hasVoted: boolean
  onVote: (idea: CommunityIdeaRecord) => void
  onSelect: (idea: CommunityIdeaRecord) => void
  onDelete: (ideaId: string) => void
  isAdmin: boolean
  rank: number
  canLike: boolean
}

export default function IdeaCard({
  idea,
  hasVoted,
  onVote,
  onSelect,
  onDelete,
  isAdmin,
  rank,
  canLike
}: IdeaCardProps) {
  const cat = CATEGORY_STYLES[idea.category] || CATEGORY_STYLES.other
  const status = STATUS_STYLES[idea.status] || STATUS_STYLES.new

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer p-5"
      onClick={() => onSelect(idea)}
    >
      <div className="flex gap-4">
        {/* Rank + Vote */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[48px]">
          {rank <= 3 && (
            <span className="text-lg">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
          )}
          {rank > 3 && <span className="text-xs font-bold text-slate-400">#{rank}</span>}
          {canLike ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onVote(idea)
              }}
              className={`flex flex-col items-center gap-0 h-auto py-1 px-2 ${hasVoted ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs font-bold">{idea.likes_count || 0}</span>
            </Button>
          ) : (
            <Link to="/upgrade" onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-0 h-auto py-1 px-2 text-slate-300"
              >
                <Lock className="w-3 h-3" />
                <span className="text-xs font-bold">{idea.likes_count || 0}</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 leading-snug">{idea.title}</h3>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  onDelete(idea.id)
                }}
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
              </Button>
            )}
          </div>

          {idea.description && (
            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{idea.description}</p>
          )}

          <div
            className="flex items-center gap-2 flex-wrap"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <span
              className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cat.cls}`}
            >
              {cat.label}
            </span>
            <span
              className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}
            >
              {status.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <MessageCircle className="w-3 h-3" />
              {idea.comments_count || 0}
            </span>
            <span className="text-xs text-slate-400">
              by {idea.anonymous ? 'Anonymous' : idea.created_by?.split('@')[0]}
            </span>
            {idea.createdAt && (
              <span className="text-xs text-slate-400">
                ·{' '}
                {formatDistanceToNow(
                  new Date(idea.createdAt.endsWith('Z') ? idea.createdAt : idea.createdAt + 'Z'),
                  { addSuffix: true }
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
