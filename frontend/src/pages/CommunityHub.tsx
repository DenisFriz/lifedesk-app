import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Lightbulb, Plus, Search, CheckCircle2, X } from 'lucide-react'
import CommunityStats from '@/components/community/CommunityStats'
import IdeaCard from '@/components/community/IdeaCard'
import IdeaForm from '@/components/community/IdeaForm'
import IdeaDetail from '@/components/community/IdeaDetail'
import { useSubscription } from '@/hooks/useSubscription'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '@/lib/AuthContext'
import { useCommunityIdeaMutations } from '@/hooks/communityideas/useCommunityIdeaMutations'
import { CreateCommunityIdeaInput } from '@/repositories/community-idea.repository'
import { CommunityIdeaRecord } from '@/db'
import { useCommunityIdeasQuery } from '@/hooks/communityideas/useCommunityIdeasQuery'
import { useUserLimit } from '@/contexts/UserLimitContext'

const STATUS_TABS = [
  { value: 'new', label: 'New' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'implemented', label: '✅ Implemented' }
] as const

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'new_feature', label: '✨ New Feature' },
  { value: 'optimization', label: '⚡ Optimization' },
  { value: 'ui_ux', label: '🎨 UI / UX' },
  { value: 'bug_fix', label: '🐛 Bug Fix' },
  { value: 'other', label: '💡 Other' }
] as const

type CommunityVote = {
  id: string
  idea_id: string
  user_email: string
}

type CommunityIdea = {
  id: string
  title: string
  description?: string
  status?: string
  category?: string
  likes_count?: number
  comments_count?: number
  created_by?: string
  created_date?: string
  anonymous?: boolean
}

export default function CommunityHub() {
  const [showForm, setShowForm] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState(null)
  const [statusFilter, setStatusFilter] = useState('new')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('likes')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  // Current user
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { can } = useSubscription()

  const { canCreate } = useUserLimit()

  const canCreateCommunityIdeas = canCreate('communityIdeas')

  // Fetch ideas
  const { data: ideas = [] } = useCommunityIdeasQuery()

  // Fetch user's votes
  const { data: myVotes = [] } = useQuery<CommunityVote[]>({
    queryKey: ['community_votes', user?.email],
    queryFn: () =>
      backend.entities.CommunityVote.filter({
        user_email: user?.email
      }) as Promise<CommunityVote[]>,
    enabled: !!user?.email
  })

  // Fetch comments for selected idea
  const { data: comments = [] } = useQuery({
    queryKey: ['community_comments', selectedIdea?.id],
    queryFn: () =>
      backend.entities.CommunityComment.filter({ idea_id: selectedIdea?.id }, 'created_date'),
    enabled: !!selectedIdea?.id
  })

  const votedIdeaIds = useMemo(() => new Set(myVotes.map(v => v.idea_id)), [myVotes])

  const {
    createMutation: createCommunityIdeaMutation,
    deleteMutation: deleteCommunityIdeaMutation,
    updateMutation: updateCommunityIdeaMutation
  } = useCommunityIdeaMutations()

  const handleCreateCommunityIdea = async (data: CreateCommunityIdeaInput) => {
    try {
      await createCommunityIdeaMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
    }
  }

  const handleDeleteCommunityIdea = async (id: string) => {
    try {
      await deleteCommunityIdeaMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateCommunityIdea = async ({
    id,
    data
  }: {
    id: string
    data: Partial<CommunityIdeaRecord>
  }) => {
    try {
      await updateCommunityIdeaMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    }
  }

  // Vote
  const voteMutation = useMutation({
    mutationFn: async (idea: CommunityIdea) => {
      const hasVoted = votedIdeaIds.has(idea.id)
      if (hasVoted) {
        // Remove vote
        const vote = myVotes.find(v => v.idea_id === idea.id)
        if (vote) await backend.entities.CommunityVote.delete(vote.id)
        await handleUpdateCommunityIdea({
          id: idea.id,
          data: { likes_count: Math.max(0, (idea.likes_count || 0) - 1) }
        })
      } else {
        // Add vote
        await backend.entities.CommunityVote.create({ idea_id: idea.id, user_email: user.email })
        await handleUpdateCommunityIdea({
          id: idea.id,
          data: { likes_count: (idea.likes_count || 0) + 1 }
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_ideas'] })
      queryClient.invalidateQueries({ queryKey: ['community_votes', user?.email] })
    }
  })

  // Comment
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await backend.entities.CommunityComment.create({ idea_id: selectedIdea.id, content })
      await backend.entities.CommunityIdea.update(selectedIdea.id, {
        comments_count: (selectedIdea.comments_count || 0) + 1
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_comments', selectedIdea?.id] })
      queryClient.invalidateQueries({ queryKey: ['community_ideas'] })
    }
  })

  // Fetch unread notifications for current user
  const { data: myNotifications = [] } = useQuery({
    queryKey: ['community_notifications', user?.email],
    queryFn: () =>
      backend.entities.CommunityNotification.filter({ user_email: user?.email, read: false }),
    enabled: !!user?.email,
    refetchInterval: 30000
  })

  const [shownNotifications, setShownNotifications] = useState([])

  // Show popup for any unread notifications (deduplicate by idea_id)
  useEffect(() => {
    if (myNotifications.length > 0) {
      const seen = new Set()
      const deduped = myNotifications.filter((n: any) => {
        if (seen.has(n.idea_id)) return false
        seen.add(n.idea_id)
        return true
      })
      setShownNotifications(deduped)
    }
  }, [myNotifications])

  const dismissNotification = async (notif: any) => {
    setShownNotifications(prev => prev.filter(n => n.id !== notif.id))
    await backend.entities.CommunityNotification.update(notif.id, { read: true })
    queryClient.invalidateQueries({ queryKey: ['community_notifications', user?.email] })
  }

  // Status change (admin)
  const statusMutation = useMutation({
    mutationFn: async ({ idea, status }: { idea: any; status: string }) => {
      await backend.entities.CommunityIdea.update(idea.id, { status })
      // If changing to "implemented", notify creator and all voters
      if (status === 'implemented') {
        const votes = await backend.entities.CommunityVote.filter({ idea_id: idea.id })
        const voterEmails = new Set(votes.map(v => v.user_email))
        const isCreator = email => email === idea.created_by

        // Build unique recipients (excluding the admin performing the action)
        const allRecipients = new Set([idea.created_by, ...voterEmails])
        allRecipients.delete(user?.email)

        await Promise.all(
          [...allRecipients].map(email => {
            const message = isCreator(email)
              ? `Your idea "${idea.title}" has been implemented! 🎉`
              : `An idea you liked — "${idea.title}" — has been implemented! 🎉`
            return backend.entities.CommunityNotification.create({
              user_email: email,
              idea_id: idea.id,
              idea_title: idea.title,
              message,
              read: false
            })
          })
        )
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community_ideas'] })
  })

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...ideas]

    list = list.filter(i => i.status === statusFilter)

    if (categoryFilter !== 'all') {
      list = list.filter(i => i.category === categoryFilter)
    }

    if (search) {
      list = list.filter(
        i =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (sortBy === 'likes') {
      list.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      )
    }

    return list
  }, [ideas, statusFilter, categoryFilter, search, sortBy])

  // Get updated selected idea from fresh data
  const liveSelectedIdea = useMemo(
    () => (selectedIdea ? ideas.find(i => i.id === selectedIdea.id) || selectedIdea : null),
    [selectedIdea, ideas]
  )

  // Pre-compute tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    STATUS_TABS.forEach(tab => {
      counts[tab.value] = ideas.filter(i => i.status === tab.value).length
    })
    return counts
  }, [ideas])

  return (
    <>
      <Helmet>
        <title>Community Hub | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        {/* Implementation Notifications */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {shownNotifications.map(notif => (
            <div
              key={notif.id}
              className="bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-800">Idea Implemented! 🎉</p>
                <p className="text-xs text-emerald-700 mt-0.5 leading-snug">{notif.message}</p>
              </div>
              <button
                onClick={() => dismissNotification(notif)}
                className="text-emerald-400 hover:text-emerald-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-6 sm:py-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <Lightbulb className="w-8 h-8 sm:w-9 sm:h-9 text-amber-500" />
                Community Hub
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Vote on ideas, suggest new features, and report bugs to shape LifeOS's future
              </p>
            </div>
            {canCreateCommunityIdeas ? (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 w-full lg:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Idea
              </Button>
            ) : (
              <Link to="/upgrade">
                <Button
                  variant="outline"
                  className="w-full lg:w-auto border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Idea · Upgrade
                </Button>
              </Link>
            )}
          </div>

          <CommunityStats ideas={ideas} />

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search ideas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="likes">🔥 Most Liked</SelectItem>
                <SelectItem value="newest">🕐 Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label} ({tabCounts[tab.value]})
              </button>
            ))}
          </div>

          {/* Idea List */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">
                {ideas.length === 0
                  ? 'Be the first to submit an idea!'
                  : 'No ideas match your filters.'}
              </p>
              {ideas.length === 0 && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit the First Idea
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {filtered.map((idea, idx) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  rank={idx + 1}
                  hasVoted={votedIdeaIds.has(idea.id)}
                  onVote={() => voteMutation.mutate(idea)}
                  onSelect={setSelectedIdea}
                  onDelete={handleDeleteCommunityIdea}
                  isAdmin={isAdmin}
                  canLike={can('community_like')}
                />
              ))}
            </div>
          )}

          <IdeaForm
            open={showForm}
            onClose={() => setShowForm(false)}
            onSubmit={handleCreateCommunityIdea}
            isLoading={createCommunityIdeaMutation.isPending}
          />

          <IdeaDetail
            idea={liveSelectedIdea}
            comments={comments}
            hasVoted={liveSelectedIdea ? votedIdeaIds.has(liveSelectedIdea.id) : false}
            onVote={idea => {
              if (!idea) {
                setSelectedIdea(null)
                return
              }
              voteMutation.mutate(idea)
            }}
            onComment={commentMutation.mutate}
            onStatusChange={(idea, status) => statusMutation.mutate({ idea, status })}
            isAdmin={isAdmin}
            isLoading={commentMutation.isPending}
            canLike={can('community_like')}
            canComment={canCreate('community_comment')}
          />
        </div>
      </div>
    </>
  )
}
