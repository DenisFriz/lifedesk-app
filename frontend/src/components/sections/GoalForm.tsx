import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Star } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface GoalFormData {
  title: string
  description: string
  important: boolean
  target_date: string
}

interface GoalFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: GoalFormData) => void
  goal?: any
  isLoading?: boolean
}

export default function GoalForm({ open, onClose, onSubmit, goal, isLoading }: GoalFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    important: false,
    target_date: ''
  })

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        important: goal.important || false,
        target_date: goal.target_date || ''
      })
    } else {
      setFormData({ title: '', description: '', important: false, target_date: '' })
    }
  }, [goal, open])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What do you want to achieve?"
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your goal..."
              maxLength={5000}
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.target_date && 'text-slate-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.target_date
                      ? format(new Date(formData.target_date), 'MMM d, yyyy')
                      : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.target_date ? new Date(formData.target_date) : undefined}
                    onSelect={(date: Date | undefined) =>
                      setFormData({
                        ...formData,
                        target_date: date ? format(date, 'yyyy-MM-dd') : ''
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, important: !formData.important })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Star
                  className={cn(
                    'w-5 h-5',
                    formData.important ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                  )}
                />
                <span className="text-sm font-medium text-slate-700">Mark as important</span>
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Saving...' : goal ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
