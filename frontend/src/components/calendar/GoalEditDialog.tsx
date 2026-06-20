import { useEffect, useState } from 'react'
import { backend } from '@/api/backend'
import { useQueryClient, useQuery } from '@tanstack/react-query'
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
import { useGoalMutations } from '@/hooks/goals/useGoalMutations'

type Business = {
  id: string
  name: string
}

export default function GoalEditDialog({ goal, open, onOpenChange }) {
  const [formData, setFormData] = useState(goal || {})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (goal) {
      setFormData(goal)
    }
  }, [goal])

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order') as Promise<Business[]>
  })

  const { updateMutation, deleteMutation } = useGoalMutations()

  const handleUpdateGoal = async ({ id, data }: { id: string; data: any }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = () => {
    handleUpdateGoal({ id: goal.id, data: formData })
  }

  const handleDelete = () => {
    if (goal.is_recurring) {
      setShowDeleteDialog(true)
    } else {
      if (confirm('Are you sure you want to delete this goal?')) {
        handleDeleteGoal(goal.id)
      }
    }
  }

  const handleDeleteConfirm = deleteType => {
    if (deleteType === 'single') {
      // Add the current instance date to excluded_dates, keeping all other settings
      const excludedDates = Array.isArray(goal.excluded_dates) ? [...goal.excluded_dates] : []
      const dateToExclude = goal.target_date

      if (!excludedDates.includes(dateToExclude)) {
        excludedDates.push(dateToExclude)

        // Only update the excluded_dates field, don't change any other recurrence settings
        backend.entities.Goal.update(goal.id, { excluded_dates: excludedDates }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['goals'] })
          onOpenChange(false)
        })
      } else {
        onOpenChange(false)
      }
    } else {
      // Delete all recurring entries
      handleDeleteGoal(goal.id)
    }
  }

  const toggleImportant = () => {
    setFormData({ ...formData, important: !formData.important })
  }

  return (
    <>
      <DeleteRecurringDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-full h-full max-w-full max-h-full lg:max-w-2xl lg:h-auto lg:max-h-[90vh] overflow-y-auto m-0 lg:m-auto rounded-none lg:rounded-lg"
          aria-describedby="goal-edit-description"
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
              Edit Goal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
              <Input
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Goal title"
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Goal description"
                maxLength={5000}
                rows={3}
              />
            </div>

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
                      business_id: value.replace('business-', '')
                    })
                  } else {
                    setFormData({ ...formData, category: value, business_id: null })
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Target Date</label>
                <Input
                  type="date"
                  value={formData.target_date || ''}
                  onChange={e => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Target Time</label>
                <Input
                  type="time"
                  value={formData.target_time || ''}
                  onChange={e => setFormData({ ...formData, target_time: e.target.value })}
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

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
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
