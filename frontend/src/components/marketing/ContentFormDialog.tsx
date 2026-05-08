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
import { CONTENT_TYPES, PLATFORMS, CONTENT_STATUSES } from './marketingConstants'
import { Campaign } from '@/types/entities'

interface ContentFormData {
  title: string
  campaign_id: string
  type: string
  platform: string
  status: string
  publish_date: string
  cta: string
  asset_url: string
  description: string
  notes: string
}

interface ContentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: any | null
  campaigns: Campaign[]
  onSave: (form: ContentFormData) => void
}

export default function ContentFormDialog({ open, onOpenChange, content, campaigns, onSave }: ContentFormDialogProps) {
  const [form, setForm] = useState<ContentFormData>({
    title: '',
    campaign_id: '',
    type: 'social_post',
    platform: 'instagram',
    status: 'idea',
    publish_date: '',
    cta: '',
    asset_url: '',
    description: '',
    notes: ''
  })

  useEffect(() => {
    if (content) {
      setForm({
        title: content.title || '',
        campaign_id: content.campaign_id || '',
        type: content.type || 'social_post',
        platform: content.platform || 'instagram',
        status: content.status || 'idea',
        publish_date: content.publish_date || '',
        cta: content.cta || '',
        asset_url: content.asset_url || '',
        description: content.description || '',
        notes: content.notes || ''
      })
    } else {
      setForm({
        title: '',
        campaign_id: '',
        type: 'social_post',
        platform: 'instagram',
        status: 'idea',
        publish_date: '',
        cta: '',
        asset_url: '',
        description: '',
        notes: ''
      })
    }
  }, [content, open])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content ? 'Edit Content' : 'New Content / Asset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Title *</label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                placeholder="e.g., 5 Tips for Better Instagram Engagement"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Related Campaign
              </label>
              <Select
                value={form.campaign_id || 'none'}
                onValueChange={v => setForm(f => ({ ...f, campaign_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Type</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Platform</label>
              <Select
                value={form.platform}
                onValueChange={v => setForm(f => ({ ...f, platform: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Publish Date</label>
              <Input
                type="date"
                value={form.publish_date}
                onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">CTA</label>
              <Input
                value={form.cta}
                onChange={e => setForm(f => ({ ...f, cta: e.target.value }))}
                placeholder="e.g., Download Free Guide"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Asset URL / File Link
              </label>
              <Input
                value={form.asset_url}
                onChange={e => setForm(f => ({ ...f, asset_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this content piece"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Notes</label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{content ? 'Update' : 'Create Content'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
