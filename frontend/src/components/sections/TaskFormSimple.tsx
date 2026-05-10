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
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon, Repeat } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TaskFormData {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  due_date: string
  problem_id: string
  goal_id: string
  is_recurring: boolean
  recurrence_frequency: string
  recurrence_interval: number
  recurrence_days_of_week: number[]
}

interface TaskFormSimpleProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TaskFormData) => void
  task?: any
  problems?: any[]
  goals?: any[]
  isLoading?: boolean
}

export default function TaskFormSimple({
  open,
  onClose,
  onSubmit,
  task,
  problems = [],
  goals = [],
  isLoading
}: TaskFormSimpleProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    problem_id: '',
    goal_id: '',
    is_recurring: false,
    recurrence_frequency: 'weekly',
    recurrence_interval: 1,
    recurrence_days_of_week: []
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        problem_id: task.problem_id || '',
        goal_id: task.goal_id || '',
        is_recurring: task.is_recurring || false,
        recurrence_frequency: task.recurrence_frequency || 'weekly',
        recurrence_interval: task.recurrence_interval || 1,
        recurrence_days_of_week: task.recurrence_days_of_week || []
      })
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        problem_id: '',
        goal_id: '',
        is_recurring: false,
        recurrence_frequency: 'weekly',
        recurrence_interval: 1,
        recurrence_days_of_week: []
      })
    }
  }, [task, open])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details..."
              maxLength={5000}
              className="min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value =>
                  setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' })
                }
              >
                <SelectTrigger>
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
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.due_date && 'text-slate-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(new Date(formData.due_date), 'MMM d') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={date =>
                      setFormData({ ...formData, due_date: date ? format(date, 'yyyy-MM-dd') : '' })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link to Problem (optional)</Label>
            <Select
              value={formData.problem_id}
              onValueChange={value => setFormData({ ...formData, problem_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select problem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {problems
                  ?.filter(p => p.status === 'active')
                  .map(problem => (
                    <SelectItem key={problem.id} value={problem.id}>
                      {problem.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Link to Goal (optional)</Label>
            <Select
              value={formData.goal_id}
              onValueChange={value => setFormData({ ...formData, goal_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {goals
                  ?.filter(g => g.status === 'active')
                  .map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={checked =>
                  setFormData({ ...formData, is_recurring: checked === true })
                }
              />
              <Label htmlFor="is_recurring" className="flex items-center gap-2 cursor-pointer">
                <Repeat className="w-4 h-4" />
                Make this a recurring task
              </Label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-3 pl-6 border-l-2 border-purple-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formData.recurrence_frequency}
                      onValueChange={value =>
                        setFormData({ ...formData, recurrence_frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Every</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.recurrence_interval}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          recurrence_interval: parseInt(e.target.value) || 1
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                </div>

                {formData.recurrence_frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant={
                            formData.recurrence_days_of_week.includes(index) ? 'default' : 'outline'
                          }
                          size="sm"
                          className="w-12"
                          onClick={() => {
                            const days = formData.recurrence_days_of_week.includes(index)
                              ? formData.recurrence_days_of_week.filter(d => d !== index)
                              : [...formData.recurrence_days_of_week, index]
                            setFormData({ ...formData, recurrence_days_of_week: days })
                          }}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? 'Saving...' : task ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
