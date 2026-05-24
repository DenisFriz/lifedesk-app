import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Pencil, Play, Calendar as CalendarIcon, Lock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { Helmet } from 'react-helmet-async'
import { useWorkoutPlansQuery } from '@/hooks/workoutplans/useWorkoutPlansQuery'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useWorkoutPlanMutations } from '@/hooks/workoutplans/useWorkoutPlanMutations'
import { CreateWorkoutPlanInput } from '@/repositories/workoutplan.repository'
import { WorkoutPlanRecord } from '@/db'

export default function WorkoutPlans() {
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const navigate = useNavigate()

  const { canCreate, data } = useUserLimit()

  const { data: plans = [] } = useWorkoutPlansQuery()

  const atLimit = canCreate('workoutPlans')

  const { createMutation, updateMutation, deleteMutation } = useWorkoutPlanMutations()

  const handleCreateWorkoutPlan = async (data: CreateWorkoutPlanInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingPlan(null)
    }
  }

  const handleUpdateWorkoutPlan = async ({
    id,
    data
  }: {
    id: string
    data: Partial<WorkoutPlanRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingPlan(null)
    }
  }

  const handleDeleteWorkoutPlan = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingPlan(null)
    }
  }

  const handleSubmit = data => {
    if (editingPlan) {
      handleUpdateWorkoutPlan({ id: editingPlan.id, data })
    } else {
      handleCreateWorkoutPlan(data)
    }
  }

  const startWorkout = plan => {
    const workoutData = {
      title: plan.name,
      type: plan.type,
      exercises: plan.exercises,
      planId: plan.id,
      date: new Date().toISOString().split('T')[0]
    }
    localStorage.setItem('startWorkoutFromPlan', JSON.stringify(workoutData))
    navigate(createPageUrl('Workouts'))
  }

  const workoutTypeColors = {
    strength: 'bg-blue-100 text-blue-700',
    cardio: 'bg-red-100 text-red-700',
    flexibility: 'bg-purple-100 text-purple-700',
    sports: 'bg-green-100 text-green-700',
    other: 'bg-slate-100 text-slate-700'
  }

  const workoutTypeLabels = {
    strength: 'Strength',
    cardio: 'Cardio',
    flexibility: 'Flexibility',
    sports: 'Sports',
    other: 'Other'
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayIndices = [1, 2, 3, 4, 5, 6, 0] // Map display order to JS Date day indices

  return (
    <>
      <Helmet>
        <title>Workout Plans</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-6 sm:py-8">
            <div className="text-center lg:text-left w-full lg:w-auto">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center lg:justify-start gap-3">
                <CalendarIcon className="w-8 h-8 sm:w-9 sm:h-9" />
                Workout Plans
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Create and schedule workout routines
              </p>
            </div>
            {atLimit ? (
              <Link to="/Upgrade" className="w-full lg:w-auto">
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Limit reached ({data?.usage?.workoutPlans}/{data?.limits?.workoutPlans})
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 w-full lg:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {plans.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No workout plans created yet</p>
                  {!atLimit && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              plans.map(plan => (
                <Card key={plan.id}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle>{plan.name}</CardTitle>
                        <Badge className={workoutTypeColors[plan.type]}>
                          {workoutTypeLabels[plan.type]}
                        </Badge>
                        {!plan.active && (
                          <Badge variant="outline" className="text-slate-500">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-sm text-slate-600 mb-2">{plan.description}</p>
                      )}
                      {plan.scheduled_days && plan.scheduled_days.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <CalendarIcon className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500">Scheduled:</span>
                          {plan.scheduled_days
                            .sort((a, b) => {
                              const indexA = dayIndices.indexOf(a)
                              const indexB = dayIndices.indexOf(b)
                              return indexA - indexB
                            })
                            .map(day => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {dayNames[dayIndices.indexOf(day)]}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => startWorkout(plan)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPlan(plan)
                          setShowForm(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteWorkoutPlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  {plan.exercises && plan.exercises.length > 0 && (
                    <CardContent>
                      <p className="text-xs font-semibold text-slate-600 mb-2">
                        {plan.exercises.length} Exercise{plan.exercises.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2">
                        {plan.exercises.map((exercise, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-lg p-2">
                            <p className="font-medium text-sm">{exercise.name}</p>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-600">
                              {exercise.sets && <span>{exercise.sets} sets</span>}
                              {exercise.reps && <span>{exercise.reps} reps</span>}
                              {exercise.weight && <span>{exercise.weight} kg</span>}
                              {exercise.distance && <span>{exercise.distance} km</span>}
                              {exercise.duration && <span>{exercise.duration} min</span>}
                              {exercise.rest_seconds && <span>Rest: {exercise.rest_seconds}s</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>

          <WorkoutPlanForm
            open={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingPlan(null)
            }}
            onSubmit={handleSubmit}
            plan={editingPlan}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      </div>
    </>
  )
}

function WorkoutPlanForm({ open, onClose, onSubmit, plan, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'strength',
    exercises: [],
    scheduled_days: [],
    active: true
  })

  React.useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        type: plan.type || 'strength',
        exercises: plan.exercises || [],
        scheduled_days: plan.scheduled_days || [],
        active: plan.active !== undefined ? plan.active : true
      })
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'strength',
        exercises: [],
        scheduled_days: [],
        active: true
      })
    }
  }, [plan, open])

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        {
          name: '',
          sets: '',
          reps: '',
          weight: '',
          distance: '',
          duration: '',
          rest_seconds: '',
          notes: ''
        }
      ]
    })
  }

  const removeExercise = index => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index)
    })
  }

  const updateExercise = (index, field, value) => {
    const newExercises = [...formData.exercises]
    newExercises[index][field] = value
    setFormData({ ...formData, exercises: newExercises })
  }

  const toggleDay = day => {
    const days = formData.scheduled_days.includes(day)
      ? formData.scheduled_days.filter(d => d !== day)
      : [...formData.scheduled_days, day]
    setFormData({ ...formData, scheduled_days: days })
  }

  const handleSubmit = e => {
    e.preventDefault()
    const data = { ...formData }

    data.exercises = data.exercises
      .filter(ex => ex.name.trim())
      .map(ex => ({
        name: ex.name,
        sets: ex.sets ? parseInt(ex.sets) : null,
        reps: ex.reps ? parseInt(ex.reps) : null,
        weight: ex.weight ? parseFloat(ex.weight) : null,
        distance: ex.distance ? parseFloat(ex.distance) : null,
        duration: ex.duration ? parseFloat(ex.duration) : null,
        rest_seconds: ex.rest_seconds ? parseInt(ex.rest_seconds) : null,
        notes: ex.notes || null
      }))

    onSubmit(data)
  }

  const isStrengthType = formData.type === 'strength'
  const isCardioType = formData.type === 'cardio'
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayIndices = [1, 2, 3, 4, 5, 6, 0] // Map display order to JS Date day indices

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Workout Plan' : 'Create Workout Plan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Plan name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            maxLength={200}
            required
          />
          <Textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            maxLength={1000}
          />
          <Select
            value={formData.type}
            onValueChange={value => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Strength Training</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <div>
            <label className="text-sm font-medium mb-2 block">Schedule Days</label>
            <div className="flex gap-2 flex-wrap">
              {dayNames.map((day, idx) => {
                const dayIndex = dayIndices[idx]
                return (
                  <Button
                    key={dayIndex}
                    type="button"
                    variant={formData.scheduled_days.includes(dayIndex) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(dayIndex)}
                  >
                    {day}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={checked =>
                setFormData({
                  ...formData,
                  active: checked === true
                })
              }
            />
            <label htmlFor="active" className="text-sm font-medium">
              Active plan
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Exercises</label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="w-3 h-3 mr-1" />
                Add Exercise
              </Button>
            </div>
            {formData.exercises.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Exercise name"
                        value={exercise.name}
                        onChange={e => updateExercise(idx, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(idx)}
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {isStrengthType && (
                        <>
                          <Input
                            type="number"
                            placeholder="Sets"
                            value={exercise.sets}
                            onChange={e => updateExercise(idx, 'sets', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Reps"
                            value={exercise.reps}
                            onChange={e => updateExercise(idx, 'reps', e.target.value)}
                          />
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="Weight (kg)"
                            value={exercise.weight}
                            onChange={e => updateExercise(idx, 'weight', e.target.value)}
                          />
                        </>
                      )}
                      {isCardioType && (
                        <>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Distance (km)"
                            value={exercise.distance}
                            onChange={e => updateExercise(idx, 'distance', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Duration (min)"
                            value={exercise.duration}
                            onChange={e => updateExercise(idx, 'duration', e.target.value)}
                            className="col-span-2"
                          />
                        </>
                      )}
                      {!isStrengthType && !isCardioType && (
                        <Input
                          type="number"
                          placeholder="Duration (min)"
                          value={exercise.duration}
                          onChange={e => updateExercise(idx, 'duration', e.target.value)}
                          className="col-span-3"
                        />
                      )}
                    </div>
                    <Input
                      type="number"
                      placeholder="Rest time (seconds)"
                      value={exercise.rest_seconds}
                      onChange={e => updateExercise(idx, 'rest_seconds', e.target.value)}
                    />
                    <Input
                      placeholder="Exercise notes (optional)"
                      value={exercise.notes}
                      onChange={e => updateExercise(idx, 'notes', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
