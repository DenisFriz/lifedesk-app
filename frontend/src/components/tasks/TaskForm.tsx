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
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  title: string
  description: string
  priority: string
  due_date: string
  status: string
}

interface Props {
  open: boolean
  onClose: (open?: boolean) => void
  onSubmit: (data: FormData) => void
  task?: any
  isLoading?: boolean
}

export default function TaskForm({ open, onClose, onSubmit, task, isLoading = false }: Props) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    status: 'pending'
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        status: task.status || 'pending'
      })
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        status: 'pending'
      })
    }
  }, [task, open])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {task ? 'Edit Task' : 'New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              maxLength={200}
              className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details..."
              maxLength={5000}
              className="min-h-[80px] border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-11 justify-start text-left font-normal border-slate-200',
                      !formData.due_date && 'text-slate-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date
                      ? format(new Date(formData.due_date), 'MMM d, yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={date =>
                      setFormData({
                        ...formData,
                        due_date: date ? format(date, 'yyyy-MM-dd') : ''
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              className="flex-1 h-11 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? 'Saving...' : task ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
