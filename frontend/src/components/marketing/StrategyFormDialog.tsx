import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { STRATEGY_STATUSES, CHANNELS } from './marketingConstants'

export default function StrategyFormDialog({ open, onOpenChange, strategy, onSave }) {
  const [form, setForm] = useState({
    name: '',
    main_goal: '',
    smart_specific: '',
    smart_measurable: '',
    smart_achievable: '',
    smart_relevant: '',
    smart_time_bound: '',
    target_audience: '',
    usp: '',
    core_message: '',
    main_channels: [],
    notes: '',
    status: 'draft'
  })
  const [channelInput, setChannelInput] = useState('')

  useEffect(() => {
    if (strategy) {
      setForm({
        name: strategy.name || '',
        main_goal: strategy.main_goal || '',
        smart_specific: strategy.smart_specific || '',
        smart_measurable: strategy.smart_measurable || '',
        smart_achievable: strategy.smart_achievable || '',
        smart_relevant: strategy.smart_relevant || '',
        smart_time_bound: strategy.smart_time_bound || '',
        target_audience: strategy.target_audience || '',
        usp: strategy.usp || '',
        core_message: strategy.core_message || '',
        main_channels: strategy.main_channels || [],
        notes: strategy.notes || '',
        status: strategy.status || 'draft'
      })
    } else {
      setForm({
        name: '',
        main_goal: '',
        smart_specific: '',
        smart_measurable: '',
        smart_achievable: '',
        smart_relevant: '',
        smart_time_bound: '',
        target_audience: '',
        usp: '',
        core_message: '',
        main_channels: [],
        notes: '',
        status: 'draft'
      })
    }
  }, [strategy, open])

  const addChannel = ch => {
    if (ch && !form.main_channels.includes(ch)) {
      setForm(f => ({ ...f, main_channels: [...f.main_channels, ch] }))
    }
    setChannelInput('')
  }

  const removeChannel = ch => {
    setForm(f => ({ ...f, main_channels: f.main_channels.filter(c => c !== ch) }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{strategy ? 'Edit Strategy' : 'New Marketing Strategy'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Strategy Name *
              </label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g., Q2 2026 Growth Strategy"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Main Goal</label>
              <Input
                value={form.main_goal}
                onChange={e => setForm(f => ({ ...f, main_goal: e.target.value }))}
                placeholder="e.g., Increase leads by 30% in Q2"
              />
            </div>

            {/* SMART Goal Section */}
            <div className="col-span-2 border border-indigo-100 rounded-lg p-4 bg-indigo-50/40">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  SMART Goal
                </span>
                <span className="text-xs text-slate-500">
                  Break your goal down using the SMART method
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    key: 'smart_specific',
                    label: 'S — Specific',
                    placeholder: 'What exactly do you want to achieve?'
                  },
                  {
                    key: 'smart_measurable',
                    label: 'M — Measurable',
                    placeholder: 'How will you measure success? (e.g. 100 leads, 5% CTR)'
                  },
                  {
                    key: 'smart_achievable',
                    label: 'A — Achievable',
                    placeholder: 'Is this goal realistic given your resources?'
                  },
                  {
                    key: 'smart_relevant',
                    label: 'R — Relevant',
                    placeholder: 'Why does this matter for your business?'
                  },
                  {
                    key: 'smart_time_bound',
                    label: 'T — Time-bound',
                    placeholder: 'By when? (e.g. End of Q2 2026)'
                  }
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex gap-3 items-start">
                    <span className="text-xs font-semibold text-indigo-600 w-32 flex-shrink-0 pt-2">
                      {label}
                    </span>
                    <Input
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Target Audience
              </label>
              <Textarea
                value={form.target_audience}
                onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                placeholder="Who are you targeting?"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">USP</label>
              <Textarea
                value={form.usp}
                onChange={e => setForm(f => ({ ...f, usp: e.target.value }))}
                placeholder="Unique Selling Proposition"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Core Message</label>
              <Textarea
                value={form.core_message}
                onChange={e => setForm(f => ({ ...f, core_message: e.target.value }))}
                placeholder="The key message to communicate"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Main Channels</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.main_channels.map(ch => (
                  <Badge key={ch} variant="secondary" className="gap-1">
                    {ch}
                    <button type="button" onClick={() => removeChannel(ch)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Select value="" onValueChange={addChannel}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add channel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.filter(c => !form.main_channels.includes(c)).map(c => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={channelInput}
                  onChange={e => setChannelInput(e.target.value)}
                  placeholder="Or type custom..."
                  className="flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addChannel(channelInput)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addChannel(channelInput)}
                >
                  Add
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGY_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit">{strategy ? 'Update' : 'Create Strategy'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
