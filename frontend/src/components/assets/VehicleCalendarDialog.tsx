import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarPlus } from 'lucide-react'
import { backend } from '@/api/backend'
import { toast } from 'sonner'

const REMINDER_OPTIONS = [
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
  { label: '1 week before', value: 10080 }
]

type EventPayload = {
  title: string
  category: string
  start_date: string
  status: string
  start_time?: string
  end_time?: string
  reminders?: unknown[]
  is_recurring?: boolean
  recurrence_frequency?: string
  recurrence_interval?: number
  recurrence_end_type?: string
}

type FormState = {
  start_time: string
  end_time: string
  reminders: number[]
  is_recurring: boolean
  recurrence_frequency: string
  recurrence_interval: number
  recurrence_end_type: string
  recurrence_end_date?: string
  recurrence_end_count?: number
}

export default function VehicleCalendarDialog({ open, onClose, title, date }) {
  const [form, setForm] = useState<FormState>({
    start_time: '',
    end_time: '',
    reminders: [],
    is_recurring: false,
    recurrence_frequency: 'yearly',
    recurrence_interval: 1,
    recurrence_end_type: 'never'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        start_time: '',
        end_time: '',
        reminders: [],
        is_recurring: false,
        recurrence_frequency: 'yearly',
        recurrence_interval: 1,
        recurrence_end_type: 'never'
      })
    }
  }, [open])

  const toggleReminder = val => {
    setForm(prev => ({
      ...prev,
      reminders: prev.reminders.includes(val)
        ? prev.reminders.filter(r => r !== val)
        : [...prev.reminders, val]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: EventPayload = {
        title,
        category: 'assets',
        start_date: date,
        status: 'active'
      }
      if (form.start_time) payload.start_time = form.start_time
      if (form.end_time) payload.end_time = form.end_time
      if (form.reminders.length > 0) payload.reminders = form.reminders
      if (form.is_recurring) {
        payload.is_recurring = true
        payload.recurrence_frequency = form.recurrence_frequency
        payload.recurrence_interval = form.recurrence_interval || 1
        payload.recurrence_end_type = form.recurrence_end_type
      }
      await backend.entities.Event.create(payload)
      toast.success('Calendar event added successfully!')
      onClose()
    } catch (err) {
      toast.error('Failed to create event')
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-indigo-600" />
            Add to Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <p className="font-medium text-slate-800">{title}</p>
            <p className="text-slate-500">{date}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>End Time</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reminders</Label>
            <div className="space-y-2">
              {REMINDER_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`rem-${opt.value}`}
                    checked={form.reminders.includes(opt.value)}
                    onCheckedChange={() => toggleReminder(opt.value)}
                  />
                  <label
                    htmlFor={`rem-${opt.value}`}
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={form.is_recurring}
                onCheckedChange={v => setForm(p => ({ ...p, is_recurring: !!v }))}
              />
              <label
                htmlFor="recurring"
                className="text-sm font-medium text-slate-700 cursor-pointer"
              >
                Repeat
              </label>
            </div>

            {form.is_recurring && (
              <div className="pl-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <Select
                      value={form.recurrence_frequency}
                      onValueChange={v => setForm(p => ({ ...p, recurrence_frequency: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Every</Label>
                    <Input
                      type="number"
                      min="1"
                      className="h-8 text-xs"
                      value={form.recurrence_interval}
                      onChange={e =>
                        setForm(p => ({
                          ...p,
                          recurrence_interval: Number(e.target.value) || 1
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ends</Label>
                  <Select
                    value={form.recurrence_end_type}
                    onValueChange={v => setForm(p => ({ ...p, recurrence_end_type: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="on_date">On Date</SelectItem>
                      <SelectItem value="after_count">After N times</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.recurrence_end_type === 'on_date' && (
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={form.recurrence_end_date || ''}
                      onChange={e => setForm(p => ({ ...p, recurrence_end_date: e.target.value }))}
                    />
                  </div>
                )}
                {form.recurrence_end_type === 'after_count' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Number of occurrences</Label>
                    <Input
                      type="number"
                      min="1"
                      className="h-8 text-xs"
                      value={form.recurrence_end_count || ''}
                      onChange={e =>
                        setForm(p => ({
                          ...p,
                          recurrence_end_count: Number(e.target.value) || 1
                        }))
                      }
                    />
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
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? 'Adding...' : 'Add to Calendar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
