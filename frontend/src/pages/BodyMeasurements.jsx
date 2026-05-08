import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  Calendar,
  Heart,
  Activity,
  Dumbbell
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'
import OverLimitItem from '@/components/subscription/OverLimitItem'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const METRIC_GROUPS = [
  {
    label: 'Vitals',
    icon: Heart,
    color: 'text-rose-500',
    fields: [
      { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', step: '1' },
      { key: 'blood_pressure_systolic', label: 'BP Systolic', unit: 'mmHg', step: '1' },
      { key: 'blood_pressure_diastolic', label: 'BP Diastolic', unit: 'mmHg', step: '1' },
      { key: 'spo2', label: 'SpO2', unit: '%', step: '0.1' },
      { key: 'hrv', label: 'HRV', unit: 'ms', step: '1' },
      { key: 'respiratory_rate', label: 'Respiratory Rate', unit: 'breaths/min', step: '1' },
      { key: 'body_temperature', label: 'Body Temperature', unit: '°C', step: '0.1' }
    ]
  },
  {
    label: 'Body Composition',
    icon: Dumbbell,
    color: 'text-indigo-500',
    fields: [
      { key: 'weight', label: 'Weight', unit: 'kg', step: '0.1' },
      { key: 'bmi', label: 'BMI', unit: '', step: '0.1' },
      { key: 'body_fat_percentage', label: 'Body Fat', unit: '%', step: '0.1' },
      { key: 'muscle_mass', label: 'Muscle Mass', unit: 'kg', step: '0.1' },
      { key: 'bone_mass', label: 'Bone Mass', unit: 'kg', step: '0.1' },
      { key: 'water_percentage', label: 'Body Water', unit: '%', step: '0.1' },
      { key: 'visceral_fat', label: 'Visceral Fat', unit: 'level', step: '1' }
    ]
  },
  {
    label: 'Body Measurements',
    icon: Activity,
    color: 'text-emerald-500',
    fields: [
      { key: 'chest', label: 'Chest', unit: 'cm', step: '0.1' },
      { key: 'waist', label: 'Waist', unit: 'cm', step: '0.1' },
      { key: 'hips', label: 'Hips', unit: 'cm', step: '0.1' },
      { key: 'arms', label: 'Arms', unit: 'cm', step: '0.1' },
      { key: 'legs', label: 'Legs', unit: 'cm', step: '0.1' }
    ]
  },
  {
    label: 'Fitness',
    icon: TrendingUp,
    color: 'text-blue-500',
    fields: [
      { key: 'vo2_max', label: 'VO2 Max', unit: 'ml/kg/min', step: '0.1' },
      { key: 'steps', label: 'Daily Steps', unit: 'steps', step: '1' }
    ]
  },
  {
    label: 'Recovery & Wellness',
    icon: Brain,
    color: 'text-purple-500',
    fields: [
      { key: 'sleep_hours', label: 'Sleep', unit: 'hrs', step: '0.1' },
      { key: 'sleep_score', label: 'Sleep Score', unit: '/100', step: '1' },
      { key: 'stress_level', label: 'Stress Level', unit: '/100', step: '1' }
    ]
  }
]

const ALL_NUMERIC_FIELDS = METRIC_GROUPS.flatMap(g => g.fields.map(f => f.key))

function MetricBadge({ value, unit, label }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-900">
        {value} <span className="text-xs font-normal text-slate-500">{unit}</span>
      </p>
    </div>
  )
}

export default function BodyMeasurements() {
  const [showForm, setShowForm] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!headerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    )
    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  const { limit } = useSubscription()
  const measurementLimit = limit('fitness_measurements_limit')

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements'],
    queryFn: () => backend.entities.BodyMeasurement.list('-date')
  })

  const atLimit = measurementLimit !== Infinity && measurements.length >= measurementLimit
  const isOverLimit = idx => measurementLimit !== Infinity && idx >= measurementLimit

  const createMutation = useMutation({
    mutationFn: data => backend.entities.BodyMeasurement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] })
      setShowForm(false)
      setEditingMeasurement(null)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => backend.entities.BodyMeasurement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] })
      setShowForm(false)
      setEditingMeasurement(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: id => backend.entities.BodyMeasurement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] })
    }
  })

  const handleSubmit = data => {
    if (editingMeasurement) {
      updateMutation.mutate({ id: editingMeasurement.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isScrolled && (
          <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="py-3">
              <h1 className="text-sm font-normal text-slate-900 text-center">Measurements</h1>
            </div>
          </div>
        )}
        <div
          ref={headerRef}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-6 sm:py-8"
        >
          <div className="text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Measurements</h1>
            <p className="text-sm sm:text-base text-slate-600">
              Track body composition, vitals & wellness — all metrics your smartwatch captures
            </p>
          </div>
          {atLimit ? (
            <Link to="/Upgrade" className="w-full lg:w-auto">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">
                <Lock className="w-4 h-4 mr-2" />
                Limit reached ({measurements.length}/{measurementLimit})
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 w-full lg:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Measurement
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {measurements.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No measurements recorded yet</p>
                {!atLimit && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Measurement
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            measurements.map((m, idx) => {
              const overLimit = isOverLimit(idx)
              const card = (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(m.date), 'MMMM d, yyyy')}
                    </div>
                    {!overLimit && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingMeasurement(m)
                            setShowForm(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(m.id)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {METRIC_GROUPS.map(group => {
                      const hasValues = group.fields.some(f => m[f.key] != null && m[f.key] !== '')
                      if (!hasValues) return null
                      const Icon = group.icon
                      return (
                        <div key={group.label}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Icon className={cn('w-3.5 h-3.5', group.color)} />
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {group.label}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {group.fields.map(f => {
                              if (m[f.key] == null || m[f.key] === '') return null
                              // Special display for blood pressure
                              if (
                                f.key === 'blood_pressure_systolic' &&
                                m.blood_pressure_diastolic
                              ) {
                                return (
                                  <div key={f.key} className="flex flex-col">
                                    <p className="text-xs text-slate-500">Blood Pressure</p>
                                    <p className="text-base font-semibold text-slate-900">
                                      {m.blood_pressure_systolic}/{m.blood_pressure_diastolic}{' '}
                                      <span className="text-xs font-normal text-slate-500">
                                        mmHg
                                      </span>
                                    </p>
                                  </div>
                                )
                              }
                              if (f.key === 'blood_pressure_diastolic') return null // rendered above
                              return (
                                <MetricBadge
                                  key={f.key}
                                  value={m[f.key]}
                                  unit={f.unit}
                                  label={f.label}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    {m.notes && <p className="text-sm text-slate-600 border-t pt-3">{m.notes}</p>}
                  </CardContent>
                </Card>
              )
              return overLimit ? (
                <OverLimitItem key={m.id}>{card}</OverLimitItem>
              ) : (
                <React.Fragment key={m.id}>{card}</React.Fragment>
              )
            })
          )}
        </div>

        <MeasurementForm
          open={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingMeasurement(null)
          }}
          onSubmit={handleSubmit}
          measurement={editingMeasurement}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  )
}

function MeasurementForm({ open, onClose, onSubmit, measurement, isLoading }) {
  const emptyForm = () => ({
    date: new Date().toISOString().split('T')[0],
    ...Object.fromEntries(ALL_NUMERIC_FIELDS.map(k => [k, ''])),
    notes: ''
  })

  const [formData, setFormData] = useState(emptyForm())

  React.useEffect(() => {
    if (measurement) {
      setFormData({
        date: measurement.date || new Date().toISOString().split('T')[0],
        ...Object.fromEntries(ALL_NUMERIC_FIELDS.map(k => [k, measurement[k] ?? ''])),
        notes: measurement.notes || ''
      })
    } else {
      setFormData(emptyForm())
    }
  }, [measurement, open])

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))

  const handleFormSubmit = e => {
    e.preventDefault()
    const data = { ...formData }
    for (const key of ALL_NUMERIC_FIELDS) {
      data[key] = data[key] === '' ? null : parseFloat(data[key])
    }
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{measurement ? 'Edit Measurement' : 'Add Measurement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <Input
            type="date"
            value={formData.date}
            onChange={e => set('date', e.target.value)}
            required
          />

          {METRIC_GROUPS.map(group => {
            const Icon = group.icon
            return (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn('w-4 h-4', group.color)} />
                  <h3 className="text-sm font-semibold text-slate-700">{group.label}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {group.fields.map(f => (
                    <Input
                      key={f.key}
                      type="number"
                      step={f.step}
                      placeholder={`${f.label}${f.unit ? ` (${f.unit})` : ''}`}
                      value={formData[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          <Textarea
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={e => set('notes', e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {measurement ? 'Update' : 'Add Measurement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
