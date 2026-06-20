import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Target, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { STRATEGY_STATUSES } from './marketingConstants'
import StrategyFormDialog from './StrategyFormDialog'
import { cn } from '@/lib/utils'
import { useMarketingStrategiesQuery } from '@/hooks/marketingstrategies/useMarketingStrategiesQuery'
import { CreateMarketingStrategyInput } from '@/repositories/marketing-strategy.repository'
import { useMarketingStrategyMutations } from '@/hooks/marketingstrategies/useMarketingStratrgyMutations'
import { MarketingStrategyRecord } from '@/db'
import { useUserLimit } from '@/contexts/UserLimitContext'

const statusInfo = Object.fromEntries(STRATEGY_STATUSES.map(s => [s.value, s]))

function StrategyCard({ strategy, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const st = statusInfo[strategy.status] || statusInfo.draft

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-slate-900 text-base">{strategy.name}</h3>
            <Badge className={cn('text-xs', st.color)}>{st.label}</Badge>
          </div>
          {strategy.main_goal && (
            <p className="text-sm text-slate-600 mb-2">🎯 {strategy.main_goal}</p>
          )}
          {strategy.main_channels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {strategy.main_channels.map(ch => (
                <Badge key={ch} variant="outline" className="text-xs">
                  {ch}
                </Badge>
              ))}
            </div>
          )}
          {expanded && (
            <div className="mt-3 space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-3">
              {strategy.target_audience && (
                <div>
                  <span className="font-medium text-slate-700">Target Audience:</span>{' '}
                  {strategy.target_audience}
                </div>
              )}
              {strategy.usp && (
                <div>
                  <span className="font-medium text-slate-700">USP:</span> {strategy.usp}
                </div>
              )}
              {strategy.core_message && (
                <div>
                  <span className="font-medium text-slate-700">Core Message:</span>{' '}
                  {strategy.core_message}
                </div>
              )}

              {/* SMART Goal */}
              {(strategy.smart_specific ||
                strategy.smart_measurable ||
                strategy.smart_achievable ||
                strategy.smart_relevant ||
                strategy.smart_time_bound) && (
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-700 mb-2">SMART Goal</p>
                  <div className="space-y-1.5">
                    {[
                      ['S — Specific', strategy.smart_specific],
                      ['M — Measurable', strategy.smart_measurable],
                      ['A — Achievable', strategy.smart_achievable],
                      ['R — Relevant', strategy.smart_relevant],
                      ['T — Time-bound', strategy.smart_time_bound]
                    ]
                      .filter(([, v]) => v)
                      .map(([label, value]) => (
                        <div key={label} className="flex gap-2 text-xs">
                          <span className="font-semibold text-indigo-600 w-28 flex-shrink-0">
                            {label}
                          </span>
                          <span className="text-slate-700">{value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {strategy.notes && (
                <div>
                  <span className="font-medium text-slate-700">Notes:</span> {strategy.notes}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(strategy)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
            onClick={() => onDelete(strategy.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function StrategyList({ businessId }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { canCreate, data: userLimits } = useUserLimit()

  const isOverLimit = !canCreate('marketingStrategy')

  const { data: strategies = [] } = useMarketingStrategiesQuery({ businessId })

  const { createMutation, updateMutation, deleteMutation } =
    useMarketingStrategyMutations(businessId)

  const handleCreateMarketingStrategy = async (data: CreateMarketingStrategyInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setDialogOpen(false)
    }
  }

  const handleUpdateMarketingStrategy = async ({
    id,
    data
  }: {
    id: string
    data: Partial<MarketingStrategyRecord>
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

  const handleDeleteMarketingStrategy = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setDialogOpen(false)
      setEditing(null)
    }
  }

  const handleSave = form => {
    if (editing) handleUpdateMarketingStrategy({ id: editing.id, data: form })
    else handleCreateMarketingStrategy(form)
  }

  const handleEdit = s => {
    setEditing(s)
    setDialogOpen(true)
  }
  const handleDelete = id => {
    if (confirm('Delete this strategy?')) handleDeleteMarketingStrategy(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {userLimits?.usage?.marketingStrategy}{' '}
          {userLimits?.usage?.marketingStrategy === 1 ? 'strategy' : 'strategies'}
          {isOverLimit ? ` / ${userLimits?.limits?.marketingStrategy}` : ''}
        </p>
        {isOverLimit ? (
          <Button
            size="sm"
            variant="outline"
            className="text-slate-500 cursor-not-allowed"
            disabled
          >
            <Lock className="w-4 h-4 mr-1" /> Limit Reached
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
            <Plus className="w-4 h-4 mr-1" /> New Strategy
          </Button>
        )}
      </div>

      {strategies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No marketing strategies yet</p>
          {isOverLimit && (
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Your First Strategy
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {strategies.map(s => (
            <StrategyCard key={s.id} strategy={s} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <StrategyFormDialog
        open={dialogOpen}
        onOpenChange={v => {
          setDialogOpen(v)
          if (!v) setEditing(null)
        }}
        strategy={editing}
        onSave={handleSave}
      />
    </div>
  )
}
