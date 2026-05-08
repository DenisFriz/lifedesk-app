import { useEffect, useState } from 'react'
import { backend } from '@/api/backend'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
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
import { Trash2, Star } from 'lucide-react'
import RecurrenceField from './RecurrenceField'
import DeleteRecurringDialog from './DeleteRecurringDialog'

type Business = {
  id: string
  name: string
}

type Goal = {
  id: string
  title: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  category: string
  business_id?: string | null
  target_date?: string
  target_time?: string
  reminders?: number[]
  important?: boolean
}

type TaskUpdateInput = {
  id: string
  data: Record<string, unknown>
}

export default function TaskEditDialog({ task, open, onOpenChange }) {
  const [formData, setFormData] = useState(task || {})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (task) {
      setFormData(task)
    }
  }, [task])

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['businesses'],
    queryFn: async () => {
      const data = (await backend.entities.Business.list('order')) as Business[]
      return data as Business[]
    }
  })

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const data = await backend.entities.Goal.list('-created_date')
      return data as Goal[]
    }
  })

  const updateMutation = useMutation<unknown, Error, TaskUpdateInput>({
    mutationFn: ({ id, data }) => backend.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onOpenChange(false)
    }
  })

  const deleteMutation = useMutation<unknown, Error, string>({
    mutationFn: id => backend.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onOpenChange(false)
    }
  })

  const handleSave = () => {
    updateMutation.mutate({ id: task.id, data: formData })
  }

  const handleDelete = () => {
    if (task.is_recurring) {
      setShowDeleteDialog(true)
    } else {
      if (confirm('Are you sure you want to delete this task?')) {
        deleteMutation.mutate(task.id)
      }
    }
  }

  const handleDeleteConfirm = deleteType => {
    if (deleteType === 'single') {
      // Add the current instance date to excluded_dates, keeping all other settings
      const excludedDates = Array.isArray(task.excluded_dates) ? [...task.excluded_dates] : []
      const dateToExclude = task.due_date

      if (!excludedDates.includes(dateToExclude)) {
        excludedDates.push(dateToExclude)

        // Only update the excluded_dates field, don't change any other recurrence settings
        backend.entities.Task.update(task.id, { excluded_dates: excludedDates }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          onOpenChange(false)
        })
      } else {
        onOpenChange(false)
      }
    } else {
      // Delete all recurring entries
      deleteMutation.mutate(task.id)
    }
  }

  const toggleImportant = () => {
    setFormData({ ...formData, important: !formData.important })
  }

  const relevantGoals = goals.filter(
    g =>
      g.status === 'active' &&
      g.category === formData.category &&
      g.business_id === formData.business_id
  )

  return (
    <>
      <DeleteRecurringDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-full h-full max-w-full max-h-full lg:max-w-2xl lg:h-auto lg:max-h-none overflow-y-auto m-0 lg:m-auto rounded-none lg:rounded-lg"
          aria-describedby="task-edit-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button onClick={toggleImportant}>
                <Star
                  className={
                    formData.important
                      ? 'w-5 h-5 fill-amber-400 text-amber-400'
                      : 'w-5 h-5 text-slate-300'
                  }
                />
              </button>
              Edit Task
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
              <Input
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                maxLength={5000}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Category</label>
                <Select
                  value={
                    formData.category === 'business' && formData.business_id
                      ? `business-${formData.business_id}`
                      : formData.category || ''
                  }
                  onValueChange={value => {
                    if (value.startsWith('business-')) {
                      setFormData({
                        ...formData,
                        category: 'business',
                        business_id: value.replace('business-', ''),
                        goal_id: null
                      })
                    } else {
                      setFormData({
                        ...formData,
                        category: value,
                        business_id: null,
                        goal_id: null
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assets">Assets</SelectItem>
                    <SelectItem value="health_body">Health</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="hobbies">Hobbies</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="relationships">Relationships</SelectItem>
                    {businesses.map(business => (
                      <SelectItem key={business.id} value={`business-${business.id}`}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Goal</label>
                <Select
                  value={formData.goal_id || 'none'}
                  onValueChange={value =>
                    setFormData({ ...formData, goal_id: value === 'none' ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Goal</SelectItem>
                    {relevantGoals.map(goal => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Due Time</label>
                <Input
                  type="time"
                  value={formData.due_time || ''}
                  onChange={e => setFormData({ ...formData, due_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Reminders</label>
              <div
                className={
                  (formData.reminders || []).length > 5
                    ? 'space-y-2 max-h-[300px] overflow-y-auto pr-2'
                    : 'space-y-2'
                }
              >
                {(formData.reminders || []).map((totalMinutes, index) => {
                  let value = totalMinutes
                  let unit = 'minutes'

                  if (totalMinutes % 10080 === 0 && totalMinutes >= 10080) {
                    value = totalMinutes / 10080
                    unit = 'weeks'
                  } else if (totalMinutes % 1440 === 0 && totalMinutes >= 1440) {
                    value = totalMinutes / 1440
                    unit = 'days'
                  } else if (totalMinutes % 60 === 0 && totalMinutes >= 60) {
                    value = totalMinutes / 60
                    unit = 'hours'
                  }

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={value}
                        onChange={e => {
                          const newValue = parseInt(e.target.value) || 1
                          const multiplier =
                            unit === 'minutes'
                              ? 1
                              : unit === 'hours'
                                ? 60
                                : unit === 'days'
                                  ? 1440
                                  : 10080
                          const newMinutes = newValue * multiplier

                          const newReminders = [...(formData.reminders || [])]
                          newReminders[index] = newMinutes
                          setFormData({ ...formData, reminders: newReminders })
                        }}
                        className="w-24"
                      />
                      <Select
                        value={unit}
                        onValueChange={newUnit => {
                          const multiplier =
                            newUnit === 'minutes'
                              ? 1
                              : newUnit === 'hours'
                                ? 60
                                : newUnit === 'days'
                                  ? 1440
                                  : 10080
                          const newMinutes = value * multiplier

                          const newReminders = [...(formData.reminders || [])]
                          newReminders[index] = newMinutes
                          setFormData({ ...formData, reminders: newReminders })
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newReminders = (formData.reminders || []).filter(
                            (_, i) => i !== index
                          )
                          setFormData({ ...formData, reminders: newReminders })
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-slate-500" />
                      </Button>
                    </div>
                  )
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newReminders = [...(formData.reminders || []), 30]
                    setFormData({ ...formData, reminders: newReminders })
                  }}
                >
                  Add reminder
                </Button>
              </div>
            </div>

            <RecurrenceField formData={formData} setFormData={setFormData} />

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
