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

interface FormData {
  title: string
  type: string
  status: string
  priority: string
  skill_category: string
  description: string
  url: string
  author: string
  progress: string
  time_invested_hours: string
  rating: string
  start_date: string
  completed_date: string
  key_takeaways: string
}

const empty = (): FormData => ({
  title: '',
  type: 'course',
  status: 'want_to_learn',
  priority: 'medium',
  skill_category: '',
  description: '',
  url: '',
  author: '',
  progress: '',
  time_invested_hours: '',
  rating: '',
  start_date: '',
  completed_date: '',
  key_takeaways: ''
})

interface Props {
  open: boolean
  onClose: (open?: boolean) => void
  onSubmit: (data: any) => void
  item?: any
  isLoading?: boolean
}

export default function LearningItemForm({
  open,
  onClose,
  onSubmit,
  item,
  isLoading = false
}: Props) {
  const [form, setForm] = useState<FormData>(empty())

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        type: item.type || 'course',
        status: item.status || 'want_to_learn',
        priority: item.priority || 'medium',
        skill_category: item.skill_category || '',
        description: item.description || '',
        url: item.url || '',
        author: item.author || '',
        progress: item.progress ?? '',
        time_invested_hours: item.time_invested_hours ?? '',
        rating: item.rating ?? '',
        start_date: item.start_date || '',
        completed_date: item.completed_date || '',
        key_takeaways: item.key_takeaways || ''
      })
    } else {
      setForm(empty())
    }
  }, [item, open])

  const set = (key: keyof FormData, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = {
      ...form,
      progress: form.progress !== '' ? Number(form.progress) : null,
      time_invested_hours:
        form.time_invested_hours !== '' ? Number(form.time_invested_hours) : null,
      rating: form.rating !== '' ? Number(form.rating) : null,
      skill_category: form.skill_category || null,
      url: form.url || null,
      author: form.author || null,
      start_date: form.start_date || null,
      completed_date: form.completed_date || null,
      key_takeaways: form.key_takeaways || null
    }
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Learning Item' : 'Add Learning Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="title"
            name="title"
            placeholder="Title *"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
          />
          <Input
            id="author"
            name="author"
            placeholder="Author / Instructor (optional)"
            value={form.author}
            onChange={e => set('author', e.target.value)}
          />

          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
            <Select value={form.type} onValueChange={v => set('type', v)}>
              <SelectTrigger id="type" name="type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="skill">Skill</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger id="status" name="status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want_to_learn">Want to Learn</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
            <Select value={form.skill_category} onValueChange={v => set('skill_category', v)}>
              <SelectTrigger id="skill_category" name="skill_category">
                <SelectValue placeholder="Skill Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="programming">Programming</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="language">Language</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="arts">Arts</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.priority} onValueChange={v => set('priority', v)}>
              <SelectTrigger id="priority" name="priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            id="url"
            name="url"
            placeholder="URL / Link (optional)"
            value={form.url}
            onChange={e => set('url', e.target.value)}
          />

          <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3">
            <div>
              <label htmlFor="progress" className="text-xs text-slate-500 mb-1 block">
                Progress (%)
              </label>
              <Input
                id="progress"
                name="progress"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={form.progress}
                onChange={e => set('progress', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="time_invested_hours" className="text-xs text-slate-500 mb-1 block">
                Hours Spent
              </label>
              <Input
                id="time_invested_hours"
                name="time_invested_hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 12"
                value={form.time_invested_hours}
                onChange={e => set('time_invested_hours', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="rating" className="text-xs text-slate-500 mb-1 block">
                Rating (1-5)
              </label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min="1"
                max="5"
                placeholder="1-5"
                value={form.rating}
                onChange={e => set('rating', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
            <div>
              <label htmlFor="start_date" className="text-xs text-slate-500 mb-1 block">
                Start Date
              </label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="completed_date" className="text-xs text-slate-500 mb-1 block">
                Completed Date
              </label>
              <Input
                id="completed_date"
                name="completed_date"
                type="date"
                value={form.completed_date}
                onChange={e => set('completed_date', e.target.value)}
              />
            </div>
          </div>

          <Textarea
            id="description"
            name="description"
            placeholder="Description / Notes"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            maxLength={2000}
            className="resize-none"
            rows={2}
          />

          <Textarea
            id="key_takeaways"
            name="key_takeaways"
            placeholder="Key takeaways (what did you learn?)"
            value={form.key_takeaways}
            onChange={e => set('key_takeaways', e.target.value)}
            maxLength={3000}
            className="resize-none"
            rows={3}
          />

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {item ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
