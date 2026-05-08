import React, { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface IdeaFormData {
  title: string
  description: string
  category: string
  likes_count?: number
  comments_count?: number
  anonymous?: boolean
}

interface IdeaFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: IdeaFormData) => void
  isLoading: boolean
}

const CATEGORIES = [
  { value: 'new_feature', label: '✨ New Feature' },
  { value: 'optimization', label: '⚡ Optimization' },
  { value: 'ui_ux', label: '🎨 UI / UX' },
  { value: 'bug_fix', label: '🐛 Bug Fix' },
  { value: 'other', label: '💡 Other' }
]

export default function IdeaForm({ open, onClose, onSubmit, isLoading }: IdeaFormProps) {
  const [form, setForm] = useState<IdeaFormData>({ title: '', description: '', category: 'new_feature' })
  const [showName, setShowName] = useState<boolean>(true)

  const set = (k: keyof IdeaFormData, v: string): void => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    onSubmit({ ...form, likes_count: 0, comments_count: 0, anonymous: !showName })
    setForm({ title: '', description: '', category: 'new_feature' })
    setShowName(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>💡 Submit Your Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Give your idea a clear title *"
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('title', e.target.value.slice(0, 50))}
              required
              maxLength={50}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.title.length}/50</p>
          </div>
          <Select value={form.category} onValueChange={(v: string) => set('category', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <Textarea
              placeholder="Describe your idea in detail — what problem does it solve? How should it work?"
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('description', e.target.value.slice(0, 500))}
              rows={5}
              className="resize-none"
              maxLength={500}
              required
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {(form.description || '').length}/500
            </p>
          </div>
          <div className="flex items-center gap-3 py-1">
            <Switch id="show-name" checked={showName} onCheckedChange={setShowName} />
            <Label htmlFor="show-name" className="text-sm text-slate-600 cursor-pointer">
              {showName ? 'Show my name on this idea' : 'Submit anonymously'}
            </Label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Submitting...' : 'Submit Idea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
