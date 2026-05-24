import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Settings2 } from 'lucide-react'

const daysOfWeek = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' }
]

export default function RecurrenceField({ formData, setFormData }) {
  const [customOpen, setCustomOpen] = useState(false)

  const toggleRecurring = () => {
    if (formData.is_recurring) {
      setFormData({
        ...formData,
        is_recurring: false,
        recurrence_frequency: undefined,
        recurrence_interval: undefined,
        recurrence_days_of_week: undefined,
        recurrence_end_type: undefined,
        recurrence_end_date: undefined,
        recurrence_end_count: undefined
      })
    } else {
      setFormData({
        ...formData,
        is_recurring: true,
        recurrence_frequency: 'daily',
        recurrence_interval: 1,
        recurrence_end_type: 'never'
      })
    }
  }

  const toggleDay = day => {
    const currentDays = formData.recurrence_days_of_week || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b)
    setFormData({ ...formData, recurrence_days_of_week: newDays })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={formData.is_recurring || false}
          onCheckedChange={toggleRecurring}
          id="is-recurring"
        />
        <label htmlFor="is-recurring" className="text-sm font-medium text-slate-700 cursor-pointer">
          Repeat
        </label>
      </div>

      {formData.is_recurring && (
        <div className="space-y-3 pl-6 border-l-2 border-slate-200">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 w-16">Every</label>
            <Input
              type="number"
              min="1"
              value={formData.recurrence_interval || 1}
              onChange={e =>
                setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 1 })
              }
              className="w-20"
            />
            <Select
              value={formData.recurrence_frequency || 'daily'}
              onValueChange={value => setFormData({ ...formData, recurrence_frequency: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Day(s)</SelectItem>
                <SelectItem value="weekly">Week(s)</SelectItem>
                <SelectItem value="monthly">Month(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.recurrence_frequency === 'weekly' && (
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Repeat on</label>
              <div className="flex gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                      (formData.recurrence_days_of_week || []).includes(day.value)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.recurrence_frequency === 'monthly' && (
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Repeat on</label>
              <Select
                value={formData.recurrence_monthly_type || 'day_of_month'}
                onValueChange={value =>
                  setFormData({ ...formData, recurrence_monthly_type: value })
                }
              >
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day_of_month">Same day of month</SelectItem>
                  <SelectItem value="first_weekday">First weekday of month</SelectItem>
                  <SelectItem value="last_weekday">Last weekday of month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Dialog open={customOpen} onOpenChange={setCustomOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Custom recurrence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Custom recurrence</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 w-20">Repeat every</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurrence_interval || 1}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        recurrence_interval: parseInt(e.target.value) || 1
                      })
                    }
                    className="w-20"
                  />
                  <Select
                    value={formData.recurrence_frequency || 'daily'}
                    onValueChange={value =>
                      setFormData({ ...formData, recurrence_frequency: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Day(s)</SelectItem>
                      <SelectItem value="weekly">Week(s)</SelectItem>
                      <SelectItem value="monthly">Month(s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrence_frequency === 'weekly' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Repeat on</label>
                    <div className="flex gap-2">
                      {daysOfWeek.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                            (formData.recurrence_days_of_week || []).includes(day.value)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.recurrence_frequency === 'monthly' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Repeat on</label>
                    <Select
                      value={formData.recurrence_monthly_type || 'day_of_month'}
                      onValueChange={value =>
                        setFormData({ ...formData, recurrence_monthly_type: value })
                      }
                    >
                      <SelectTrigger className="w-60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day_of_month">Same day of month</SelectItem>
                        <SelectItem value="first_weekday">First weekday of month</SelectItem>
                        <SelectItem value="last_weekday">Last weekday of month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Ends</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="end_type"
                        checked={(formData.recurrence_end_type || 'never') === 'never'}
                        onChange={() => setFormData({ ...formData, recurrence_end_type: 'never' })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Never</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="end_type"
                        checked={formData.recurrence_end_type === 'on_date'}
                        onChange={() =>
                          setFormData({ ...formData, recurrence_end_type: 'on_date' })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">On</span>
                      <Input
                        type="date"
                        value={formData.recurrence_end_date || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            recurrence_end_type: 'on_date',
                            recurrence_end_date: e.target.value
                          })
                        }
                        onClick={() => setFormData({ ...formData, recurrence_end_type: 'on_date' })}
                        className="flex-1"
                      />
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="end_type"
                        checked={formData.recurrence_end_type === 'after_count'}
                        onChange={() =>
                          setFormData({ ...formData, recurrence_end_type: 'after_count' })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">After</span>
                      <Input
                        type="number"
                        min="1"
                        value={formData.recurrence_end_count || 1}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            recurrence_end_type: 'after_count',
                            recurrence_end_count: parseInt(e.target.value) || 1
                          })
                        }
                        onClick={() =>
                          setFormData({ ...formData, recurrence_end_type: 'after_count' })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-slate-700">occurrences</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setCustomOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => setCustomOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {formData.recurrence_end_type === 'on_date' && formData.recurrence_end_date && (
            <p className="text-xs text-slate-500">
              Ends on {new Date(formData.recurrence_end_date).toLocaleDateString()}
            </p>
          )}
          {formData.recurrence_end_type === 'after_count' && formData.recurrence_end_count && (
            <p className="text-xs text-slate-500">
              Ends after {formData.recurrence_end_count} occurrences
            </p>
          )}
        </div>
      )}
    </div>
  )
}
