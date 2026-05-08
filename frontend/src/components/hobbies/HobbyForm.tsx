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
import { Label } from '@/components/ui/label'

const CATEGORIES = [
  { value: 'music', label: '🎵 Music' },
  { value: 'arts_crafts', label: '🎨 Arts & Crafts' },
  { value: 'sports_outdoor', label: '🏃 Sports & Outdoor' },
  { value: 'gaming', label: '🎮 Gaming' },
  { value: 'cooking_food', label: '🍳 Cooking & Food' },
  { value: 'reading_writing', label: '📚 Reading & Writing' },
  { value: 'technology', label: '💻 Technology' },
  { value: 'collecting', label: '🪙 Collecting' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'other', label: '⭐ Other' }
]

const COLORS = [
  'purple',
  'pink',
  'blue',
  'green',
  'orange',
  'amber',
  'rose',
  'teal',
  'indigo',
  'cyan'
]

const COLOR_CLASSES = {
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

interface FormData {
  name: string
  category: string
  description: string
  skill_level: string
  status: string
  started_date: string
  frequency: string
  avg_session_minutes: number | null
  equipment: string
  color: string
}

const EMPTY: FormData = {
  name: '',
  category: '',
  description: '',
  skill_level: 'beginner',
  status: 'active',
  started_date: '',
  frequency: '',
  avg_session_minutes: null,
  equipment: '',
  color: 'purple'
}

interface Props {
  open: boolean
  onClose: (open?: boolean) => void
  onSubmit: (data: any) => void
  hobby?: any
  isLoading?: boolean
}

export default function HobbyForm({ open, onClose, onSubmit, hobby, isLoading = false }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY)

  useEffect(() => {
    if (hobby) {
      setForm({ ...EMPTY, ...hobby, avg_session_minutes: hobby.avg_session_minutes ?? '' })
    } else {
      setForm(EMPTY)
    }
  }, [hobby, open])

  const set = (key: keyof FormData, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = { ...form }
    data.avg_session_minutes = data.avg_session_minutes ?? null

    if (!data.started_date) delete data.started_date
    if (!data.frequency) delete data.frequency
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{hobby ? 'Edit Hobby' : 'Add Hobby'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              placeholder="e.g. Guitar, Hiking, Photography..."
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => set('category', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_pause">On Pause</SelectItem>
                  <SelectItem value="want_to_start">Want to Start</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="What do you love about this hobby? Any notes..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Skill Level</Label>
              <Select value={form.skill_level} onValueChange={v => set('skill_level', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={v => set('frequency', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="few_times_week">Few times/week</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Started Date</Label>
              <Input
                type="date"
                value={form.started_date}
                onChange={e => set('started_date', e.target.value)}
              />
            </div>
            <div>
              <Label>Avg Session (min)</Label>
              <Input
                type="number"
                placeholder="e.g. 60"
                value={form.avg_session_minutes}
                onChange={e => set('avg_session_minutes', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Equipment / Tools</Label>
            <Input
              placeholder="e.g. Acoustic guitar, hiking boots..."
              value={form.equipment}
              onChange={e => set('equipment', e.target.value)}
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={`w-7 h-7 rounded-full ${COLOR_CLASSES[c]} transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {hobby ? 'Save Changes' : 'Add Hobby'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
