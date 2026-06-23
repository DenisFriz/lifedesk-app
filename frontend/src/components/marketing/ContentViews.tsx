import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  ExternalLink,
  Lock
} from 'lucide-react'
import { CONTENT_TYPES, PLATFORMS, CONTENT_STATUSES } from './marketingConstants'
import ContentFormDialog from './ContentFormDialog'
import { cn } from '@/lib/utils'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns'
import { useMarketingContentMutations } from '@/hooks/marketingcontents/useMarketingContentMutations'
import { CreateMarketingContentInput } from '@/repositories/marketing-content.repository'
import { MarketingCampaignRecord, MarketingContentRecord } from '@/db'
import { useMarketingContentsQuery } from '@/hooks/marketingcontents/useMarketingContentsQuery'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useMarketingCampaignsQuery } from '@/hooks/marketingcampaign/useMarketingCampaignsQuery'

const statusInfo = Object.fromEntries(CONTENT_STATUSES.map(s => [s.value, s]))
const typeInfo = Object.fromEntries(CONTENT_TYPES.map(t => [t.value, t]))
const platformInfo = Object.fromEntries(PLATFORMS.map(p => [p.value, p]))

const KANBAN_COLUMNS = CONTENT_STATUSES.filter(s => s.value !== 'archived')

interface ContentItem {
  id: string
  title: string
  campaign_id?: string
  type?: string
  platform?: string
  status?: string
  publish_date?: string
  cta?: string
  asset_url?: string
  description?: string
}

interface ListViewProps {
  items: ContentItem[]
  campaigns: MarketingCampaignRecord[]
  onEdit: (item: ContentItem) => void
  onDelete: (id: string) => void
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({ items, campaigns, onEdit, onDelete }: ListViewProps) {
  const campName = (id: string | undefined): string => campaigns.find(c => c.id === id)?.name || '—'

  if (items.length === 0)
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No content found</p>
      </div>
    )

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-36">
                Campaign
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-32">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-28">
                Platform
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-28">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-28">
                Publish Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-40">CTA</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const st = statusInfo[item.status] || statusInfo.idea
              return (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-slate-900 text-sm">{item.title}</div>
                    {item.asset_url && (
                      <a
                        href={item.asset_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Asset
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-600">
                    {campName(item.campaign_id)}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-600">
                    {typeInfo[item.type]?.label || item.type}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-600">
                    {platformInfo[item.platform]?.label || item.platform}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge className={cn('text-xs', st.color)}>{st.label}</Badge>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-600">
                    {item.publish_date ? format(new Date(item.publish_date), 'dd MMM yy') : '—'}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-600">{item.cta || '—'}</td>
                  <td className="px-4 py-3 align-top text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface KanbanViewProps {
  items: ContentItem[]
  campaigns: MarketingCampaignRecord[]
  onEdit: (item: ContentItem) => void
  onDelete: (id: string) => void
}

// ─── Kanban View ──────────────────────────────────────────────────────────────
function KanbanView({ items, campaigns, onEdit, onDelete }: KanbanViewProps) {
  const campName = (id: string | undefined): string | undefined =>
    campaigns.find(c => c.id === id)?.name

  return (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map(col => {
        const colItems = items.filter(i => i.status === col.value)
        return (
          <div key={col.value} className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={cn('text-xs', col.color)}>{col.label}</Badge>
              <span className="text-xs text-slate-400">{colItems.length}</span>
            </div>
            <div className="space-y-2">
              {colItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium text-slate-900 flex-1 leading-tight">
                      {item.title}
                    </p>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-rose-600"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.type && (
                      <Badge variant="outline" className="text-xs">
                        {typeInfo[item.type]?.label || item.type}
                      </Badge>
                    )}
                    {item.platform && (
                      <Badge variant="outline" className="text-xs">
                        {platformInfo[item.platform]?.label || item.platform}
                      </Badge>
                    )}
                  </div>
                  {item.publish_date && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      📅 {format(new Date(item.publish_date), 'dd MMM yy')}
                    </p>
                  )}
                  {item.campaign_id && campName(item.campaign_id) && (
                    <p className="text-xs text-indigo-500 mt-1 truncate">
                      📢 {campName(item.campaign_id)}
                    </p>
                  )}
                  {item.cta && <p className="text-xs text-slate-500 mt-1 truncate">→ {item.cta}</p>}
                </div>
              ))}
              {colItems.length === 0 && (
                <div className="text-center py-6 rounded-lg border-2 border-dashed border-slate-200 text-xs text-slate-400">
                  Empty
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface CalendarViewProps {
  items: ContentItem[]
  onEdit: (item: ContentItem) => void
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ items, onEdit }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const start = startOfMonth(currentMonth)
  const end = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start, end })
  const startDow = start.getDay()

  const itemsByDate = {}
  items.forEach(item => {
    if (item.publish_date) {
      const key = item.publish_date
      if (!itemsByDate[key]) itemsByDate[key] = []
      itemsByDate[key].push(item)
    }
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          ←
        </Button>
        <h3 className="font-semibold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</h3>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          →
        </Button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-slate-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startDow }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="min-h-[80px] border-b border-r border-slate-100 p-1 bg-slate-50"
          />
        ))}
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const dayItems = itemsByDate[key] || []
          const isToday = isSameDay(day, new Date())
          return (
            <div
              key={key}
              className={cn(
                'min-h-[80px] border-b border-r border-slate-100 p-1',
                isToday && 'bg-indigo-50'
              )}
            >
              <div
                className={cn(
                  'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                  isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                )}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map(item => {
                  const st = statusInfo[item.status] || statusInfo.idea
                  return (
                    <button
                      key={item.id}
                      onClick={() => onEdit(item)}
                      className={cn(
                        'w-full text-left text-xs px-1 py-0.5 rounded truncate font-medium',
                        st.color
                      )}
                    >
                      {item.title}
                    </button>
                  )
                })}
                {dayItems.length > 3 && (
                  <div className="text-xs text-slate-400 px-1">+{dayItems.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ContentViewsProps2 {
  businessId: string
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContentViews({ businessId }: ContentViewsProps2) {
  const [view, setView] = useState<string>('list')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')

  const { canCreate, data: userLimits } = useUserLimit()

  const isOverLimit = !canCreate('marketingContent')

  const { data: allContent = [] } = useMarketingContentsQuery(businessId, !!businessId)

  const { data: campaigns = [] } = useMarketingCampaignsQuery({ businessId })

  const { updateMutation, createMutation, deleteMutation } = useMarketingContentMutations()

  const handleCreateMarketingContent = async (data: CreateMarketingContentInput) => {
    try {
      await createMutation.mutateAsync({ ...data, business_id: businessId })
    } catch (e) {
      console.error(e)
    } finally {
      setDialogOpen(false)
    }
  }

  const handleUpdateMarketingContent = async ({
    id,
    data
  }: {
    id: string
    data: Partial<MarketingContentRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setDialogOpen(false)
      setEditing(null)
    }
  }

  const handleDeleteMarketingContent = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setDialogOpen(false)
      setEditing(null)
    }
  }

  const handleSave = (form: any): void => {
    if (editing) handleUpdateMarketingContent({ id: editing.id, data: form })
    else handleCreateMarketingContent(form)
  }

  const handleEdit = (item: ContentItem): void => {
    setEditing(item)
    setDialogOpen(true)
  }
  const handleDelete = (id: string): void => {
    if (confirm('Delete this content?')) handleDeleteMarketingContent(id)
  }

  const filtered = allContent.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false
    if (campaignFilter !== 'all' && c.campaign_id !== campaignFilter) return false
    return true
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-center min-[480px]:justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {CONTENT_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {CONTENT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {campaigns.length > 0 && (
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex flex-col min-[480px]:flex-row justify-between w-full items-center gap-2 self-center">
          {/* View toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium flex items-center gap-1',
                view === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium flex items-center gap-1 border-x border-slate-200',
                view === 'kanban'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium flex items-center gap-1',
                view === 'calendar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
          {isOverLimit ? (
            <Button
              size="sm"
              variant="outline"
              className="text-slate-500 cursor-not-allowed"
              disabled
            >
              <Lock className="w-4 h-4 mr-1" /> Limit Reached (
              {userLimits?.usage?.marketingContent || 0}/{userLimits?.limits?.marketingContent})
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> New Content
            </Button>
          )}
        </div>
      </div>

      {/* Views */}
      {view === 'list' && (
        <ListView
          items={filtered}
          campaigns={campaigns}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      {view === 'kanban' && (
        <KanbanView
          items={filtered}
          campaigns={campaigns}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      {view === 'calendar' && <CalendarView items={filtered} onEdit={handleEdit} />}

      <ContentFormDialog
        open={dialogOpen}
        onOpenChange={v => {
          setDialogOpen(v)
          if (!v) setEditing(null)
        }}
        content={editing}
        campaigns={campaigns}
        onSave={handleSave}
      />
    </div>
  )
}
