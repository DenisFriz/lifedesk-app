import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ThumbsUp, MessageCircle, Send, Lock } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { CommunityIdeaRecord } from '@/db'

interface IdeaComment {
  id: string
  content: string
  created_by?: string
  author_display_name?: string
  created_date?: string
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'implemented', label: '✅ Implemented' },
  { value: 'rejected', label: 'Rejected' }
] as const

const STATUS_STYLES = {
  new: 'bg-slate-100 text-slate-600',
  under_review: 'bg-blue-100 text-blue-700',
  planned: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-amber-100 text-amber-700',
  implemented: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700'
} as const

interface IdeaDetailProps {
  idea: CommunityIdeaRecord | null
  comments: IdeaComment[]
  hasVoted: boolean
  onVote: (idea: CommunityIdeaRecord | null) => void
  onComment: (comment: string) => void
  onStatusChange: (idea: CommunityIdeaRecord, status: string) => void
  isAdmin: boolean
  isLoading: boolean
  canLike: boolean
  canComment: boolean
}

export default function IdeaDetail({
  idea,
  comments,
  hasVoted,
  onVote,
  onComment,
  onStatusChange,
  isAdmin,
  isLoading,
  canLike,
  canComment
}: IdeaDetailProps) {
  const [comment, setComment] = useState<string>('')

  if (!idea) return null

  const handleComment = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (!comment.trim()) return
    onComment(comment.trim())
    setComment('')
  }

  return (
    <Dialog open={!!idea} onOpenChange={() => onVote(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg leading-snug pr-8">{idea.title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Badge className={`text-xs ${STATUS_STYLES[idea.status] || STATUS_STYLES.new}`}>
            {STATUS_OPTIONS.find(s => s.value === idea.status)?.label || 'New'}
          </Badge>
          <span className="text-xs text-slate-400">by {idea.created_by?.split('@')[0]}</span>
          {idea.createdAt && (
            <span className="text-xs text-slate-400">
              · {formatDistanceToNow(parseISO(idea.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {idea.description && (
          <p className="text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">
            {idea.description}
          </p>
        )}

        {/* Vote + Admin status change */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          {canLike ? (
            <Button
              onClick={() => onVote(idea)}
              variant={hasVoted ? 'default' : 'outline'}
              size="sm"
              className={hasVoted ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {hasVoted ? 'Liked' : 'Like'} · {idea.likes_count || 0}
            </Button>
          ) : (
            <Link to="/upgrade">
              <Button variant="outline" size="sm" className="text-slate-400 border-slate-200">
                <Lock className="w-4 h-4 mr-1" />
                Like · {idea.likes_count || 0} · Upgrade
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Select value={idea.status} onValueChange={val => onStatusChange(idea, val)}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Comments */}
        <div className="mt-4">
          <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments ({comments.length})
          </h4>

          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {comments.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                No comments yet. Be the first!
              </p>
            )}
            {comments.map(c => (
              <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-700">
                    {c.author_display_name || c.created_by?.split('@')[0]}
                  </span>
                  {c.created_date && (
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(parseISO(c.created_date), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{c.content}</p>
              </div>
            ))}
          </div>

          {canComment ? (
            <form onSubmit={handleComment} className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !comment.trim()}
                className="flex-shrink-0 h-auto"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <Link to="/upgrade">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm cursor-pointer hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                <Lock className="w-4 h-4" />
                Upgrade your plan to leave comments
              </div>
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
