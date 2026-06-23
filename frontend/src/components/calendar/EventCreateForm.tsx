import { useEffect, useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
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
import { Trash2 } from 'lucide-react'
import RecurrenceField from './RecurrenceField'
import { useEventMutations } from '@/hooks/events/useEventMutations'

type Business = {
  id: string
  name: string
}

export default function EventCreateForm({ date, time, open, onOpenChange, initialData }) {
  const formatDate = d => {
    if (!d) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = useState(
    initialData
      ? {
          ...initialData,
          start_date: formatDate(date) || initialData.start_date || '',
          start_time: time || initialData.start_time || ''
        }
      : {
          title: '',
          description: '',
          category: 'assets',
          start_date: formatDate(date),
          start_time: time || '',
          end_date: '',
          end_time: '',
          status: 'active',
          important: false
        }
  )

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_date: formatDate(date) || initialData.start_date || '',
        start_time: time || initialData.start_time || ''
      })
    }
  }, [initialData, date, time])

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order') as Promise<Business[]>
  })

  const { createMutation } = useEventMutations()

  const handleCreateEvent = async (data: Record<string, unknown>) => {
    try {
      await createMutation.mutateAsync(data)
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = () => {
    if (!formData.title.trim()) return
    handleCreateEvent(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl h-full max-h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="event-title" className="text-sm font-medium text-slate-700 mb-1 block">
              Title
            </label>
            <Input
              id="event-title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title"
              maxLength={200}
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="event-description"
              className="text-sm font-medium text-slate-700 mb-1 block"
            >
              Description
            </label>
            <Textarea
              id="event-description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event description"
              maxLength={5000}
              rows={3}
            />
          </div>

          <div>
            <label
              htmlFor="event-category"
              className="text-sm font-medium text-slate-700 mb-1 block"
            >
              Category
            </label>
            <Select
              value={
                formData.category === 'business' && formData.business_id
                  ? `business-${formData.business_id}`
                  : formData.category
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
              <SelectTrigger id="event-category">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="event-start-date"
                className="text-sm font-medium text-slate-700 mb-1 block"
              >
                Start Date
              </label>
              <Input
                id="event-start-date"
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <label
                htmlFor="event-start-time"
                className="text-sm font-medium text-slate-700 mb-1 block"
              >
                Start Time
              </label>
              <Input
                id="event-start-time"
                type="time"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="event-end-date"
                className="text-sm font-medium text-slate-700 mb-1 block"
              >
                End Date (Optional)
              </label>
              <Input
                id="event-end-date"
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div>
              <label
                htmlFor="event-end-time"
                className="text-sm font-medium text-slate-700 mb-1 block"
              >
                End Time
              </label>
              <Input
                id="event-end-time"
                type="time"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Reminders</label>
            <div className="space-y-2">
              {(formData.reminders || []).map((totalMinutes, index) => {
                // Convert minutes to appropriate unit
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

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || !formData.title.trim()}
            >
              Create Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
