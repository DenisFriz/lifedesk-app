import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Megaphone, Lock } from 'lucide-react'
import { CAMPAIGN_TYPES, CAMPAIGN_STATUSES } from './marketingConstants'
import CampaignFormDialog from './CampaignFormDialog'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Strategy } from '@/types/entities'
import { useMarketingCampaignsQuery } from '@/hooks/marketingcampaign/useMarketingCampaignsQuery'
import { useMarketingCampaignMutations } from '@/hooks/marketingcampaign/useMarketingCampaignMutations'
import { CreateMarketingCampaignInput } from '@/repositories/marketing-campaign.repository'
import { MarketingCampaignRecord } from '@/db'
import { useUserLimit } from '@/contexts/UserLimitContext'

const statusInfo = Object.fromEntries(CAMPAIGN_STATUSES.map(s => [s.value, s]))
const typeInfo = Object.fromEntries(CAMPAIGN_TYPES.map(t => [t.value, t]))

interface CampaignListProps {
  businessId: string
}

export default function CampaignList({ businessId }: CampaignListProps) {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { canCreate, data: userLimits } = useUserLimit()

  const isOverLimit = !canCreate('marketingCampaign')

  const { data: campaigns = [] } = useMarketingCampaignsQuery({ businessId })

  const { data: strategies = [] } = useQuery<Strategy[]>({
    queryKey: ['marketing_strategies', businessId],
    queryFn: async (): Promise<Strategy[]> => {
      const result = businessId
        ? await backend.entities.MarketingStrategy.filter({
            business_id: businessId,
            is_deleted: false
          })
        : await backend.entities.MarketingStrategy.filter({ is_deleted: false }, '-created_date')

      return result as Strategy[]
    }
  })

  const { createMutation, updateMutation, deleteMutation } =
    useMarketingCampaignMutations(businessId)

  const handleCreateMarketingCampaign = async (data: CreateMarketingCampaignInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setDialogOpen(false)
    }
  }

  const handleUpdateMarketingCampaign = async ({
    id,
    data
  }: {
    id: string
    data: Partial<MarketingCampaignRecord>
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

  const handleDeleteMarketingCampaign = async (id: string) => {
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
    if (editing) handleUpdateMarketingCampaign({ id: editing.id, data: form })
    else handleCreateMarketingCampaign(form)
  }

  const filtered = campaigns.filter((c: any) => {
    const statusMatch = statusFilter === 'all' || c.status === statusFilter
    const typeMatch = typeFilter === 'all' || c.campaign_type === typeFilter
    return statusMatch && typeMatch
  })

  const strategyName = (id: string): string =>
    strategies.find((s: Strategy) => s.id === id)?.name || '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {CAMPAIGN_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {CAMPAIGN_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isOverLimit ? (
          <Button
            size="sm"
            variant="outline"
            className="text-slate-500 cursor-not-allowed"
            disabled
          >
            <Lock className="w-4 h-4 mr-1" /> Limit Reached (
            {userLimits?.usage?.marketingCampaign || 0}/{userLimits?.limits?.marketingCampaign})
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
            <Plus className="w-4 h-4 mr-1" /> New Campaign
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No campaigns yet</p>
          {!isOverLimit && (
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Your First Campaign
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-48">
                    Campaign Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-44">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Goal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-32">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-28">
                    Start
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-28">
                    End
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-24">
                    Budget
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 w-28">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const st = statusInfo[c.status] || statusInfo.planned
                  const tp = typeInfo[c.campaign_type]
                  return (
                    <React.Fragment key={c.id}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-slate-900 text-sm">{c.name}</div>
                          {c.strategy_id && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {strategyName(c.strategy_id)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-600">
                          {tp?.label || c.campaign_type}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-600 max-w-[200px]">
                          <span className="line-clamp-2">{c.goal || '—'}</span>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-600">
                          {c.channel || '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-600">
                          {c.start_date ? format(new Date(c.start_date), 'dd MMM yy') : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-600">
                          {c.end_date ? format(new Date(c.end_date), 'dd MMM yy') : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-600">
                          {c.budget != null ? `$${c.budget.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge className={cn('text-xs', st.color)}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-3 align-top text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditing(c)
                                setDialogOpen(true)
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                              onClick={() => {
                                if (confirm('Delete campaign?')) handleDeleteMarketingCampaign(c.id)
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {c.kpis?.length > 0 && (
                        <tr className="border-b border-slate-100 bg-emerald-50/40">
                          <td colSpan={9} className="px-4 py-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs font-bold text-emerald-700">KPIs:</span>
                              {c.kpis.map((kpi, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 text-xs bg-white border border-emerald-200 rounded-md px-2 py-1"
                                >
                                  <span className="font-medium text-slate-700">{kpi.name}</span>
                                  {kpi.target && (
                                    <>
                                      <span className="text-slate-400 ml-1">target:</span>
                                      <span className="text-slate-600 ml-0.5">{kpi.target}</span>
                                    </>
                                  )}
                                  {kpi.actual && (
                                    <>
                                      <span className="text-slate-400 ml-1">actual:</span>
                                      <span className="font-semibold text-emerald-600 ml-0.5">
                                        {kpi.actual}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CampaignFormDialog
        open={dialogOpen}
        onOpenChange={v => {
          setDialogOpen(v)
          if (!v) setEditing(null)
        }}
        campaign={editing}
        strategies={strategies}
        onSave={handleSave}
      />
    </div>
  )
}
