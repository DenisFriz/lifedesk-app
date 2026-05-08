import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { CAMPAIGN_TYPES, CAMPAIGN_STATUSES, CHANNELS } from './marketingConstants'
import { Plus, Trash2 } from 'lucide-react'
import { Campaign, Strategy } from '@/types/entities'

interface KPI {
  name: string
  target: string
  actual: string
}

interface CampaignFormData {
  name: string
  strategy_id: string
  campaign_type: string
  goal: string
  channel: string
  start_date: string
  end_date: string
  budget: string
  status: string
  kpis: KPI[]
  notes: string
}

interface CampaignFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
  strategies: Strategy[]
  onSave: (form: CampaignFormData) => void
}

export default function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
  strategies,
  onSave
}: CampaignFormDialogProps) {
  const [form, setForm] = useState<CampaignFormData>({
    name: '',
    strategy_id: '',
    campaign_type: 'social_media',
    goal: '',
    channel: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'planned',
    kpis: [],
    notes: ''
  })

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name || '',
        strategy_id: campaign.strategy_id || '',
        campaign_type: campaign.campaign_type || 'social_media',
        goal: campaign.goal || '',
        channel: campaign.channel || '',
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        budget: campaign.budget != null ? String(campaign.budget) : '',
        status: campaign.status || 'planned',
        kpis: (campaign.kpis || []).map(kpi => ({
          name: kpi,
          target: '',
          actual: ''
        })),
        notes: campaign.notes || ''
      })
    } else {
      setForm({
        name: '',
        strategy_id: '',
        campaign_type: 'social_media',
        goal: '',
        channel: '',
        start_date: '',
        end_date: '',
        budget: '',
        status: 'planned',
        kpis: [],
        notes: ''
      })
    }
  }, [campaign, open])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Campaign Name *
              </label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g., Summer Launch 2026"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Related Strategy
              </label>
              <Select
                value={form.strategy_id || 'none'}
                onValueChange={(v: string) =>
                  setForm(f => ({ ...f, strategy_id: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {strategies.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Campaign Type</label>
              <Select
                value={form.campaign_type}
                onValueChange={(v: string) => setForm(f => ({ ...f, campaign_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Goal</label>
              <Input
                value={form.goal}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm(f => ({ ...f, goal: e.target.value }))
                }
                placeholder="What should this campaign achieve?"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Channel</label>
              <Select
                value={form.channel || 'none'}
                onValueChange={v => setForm(f => ({ ...f, channel: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {CHANNELS.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Budget</label>
              <Input
                type="number"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Start Date</label>
              <Input
                type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">End Date</label>
              <Input
                type="date"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* KPIs */}
            <div className="col-span-2 border border-emerald-100 rounded-lg p-4 bg-emerald-50/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    KPIs
                  </span>
                  <span className="text-xs text-slate-500">
                    Track success metrics for this campaign
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    setForm(f => ({
                      ...f,
                      kpis: [...f.kpis, { name: '', target: '', actual: '' }]
                    }))
                  }
                >
                  <Plus className="w-3 h-3 mr-1" /> Add KPI
                </Button>
              </div>
              {form.kpis.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">
                  No KPIs yet — add metrics like Leads, CTR, Conversions, Revenue...
                </p>
              )}
              <div className="space-y-2">
                {form.kpis.map((kpi, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="KPI name (e.g. Leads)"
                      value={kpi.name}
                      onChange={e => {
                        const kpis = [...form.kpis]
                        kpis[i] = { ...kpis[i], name: e.target.value }
                        setForm(f => ({ ...f, kpis }))
                      }}
                      className="bg-white text-sm"
                    />
                    <Input
                      placeholder="Target (e.g. 100)"
                      value={kpi.target}
                      onChange={e => {
                        const kpis = [...form.kpis]
                        kpis[i] = { ...kpis[i], target: e.target.value }
                        setForm(f => ({ ...f, kpis }))
                      }}
                      className="bg-white text-sm w-32"
                    />
                    <Input
                      placeholder="Actual"
                      value={kpi.actual}
                      onChange={e => {
                        const kpis = [...form.kpis]
                        kpis[i] = { ...kpis[i], actual: e.target.value }
                        setForm(f => ({ ...f, kpis }))
                      }}
                      className="bg-white text-sm w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-rose-500 hover:bg-rose-50"
                      onClick={() =>
                        setForm(f => ({ ...f, kpis: f.kpis.filter((_, idx) => idx !== i) }))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Notes</label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{campaign ? 'Update' : 'Create Campaign'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
