import { useState, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { Dumbbell, Lock } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import OverLimitItem from '@/components/subscription/OverLimitItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Pencil, Calendar, Clock, Flame, CalendarDays } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { format } from 'date-fns'

type Workout = {
  id: string
  title: string
  date: string
  type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
  duration_minutes?: number | null
  calories_burned?: number | null
  exercises: WorkoutExercise[]
  notes?: string | null
}

type WorkoutCreateInput = Omit<Workout, 'id'>

export default function Workouts() {
  const [showForm, setShowForm] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const headerRef = useRef(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const planData = localStorage.getItem('startWorkoutFromPlan')
    if (planData) {
      const workout = JSON.parse(planData)
      // Don't set editingWorkout - we want to create, not edit
      // Just open the form and let WorkoutForm handle the pre-fill
      setEditingWorkout(workout) // Pass the plan data but it will create new
      setShowForm(true)
      localStorage.removeItem('startWorkoutFromPlan')
    }
  }, [])

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
  const workoutLimit = limit('fitness_workouts_limit')

  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: async (): Promise<Workout[]> => {
      return (await backend.entities.Workout.list('-date')) as Workout[]
    }
  })

  const atLimit = workoutLimit !== Infinity && workouts.length >= workoutLimit
  const isOverLimit = idx => workoutLimit !== Infinity && idx >= workoutLimit

  const createMutation = useMutation<Workout, Error, WorkoutCreateInput>({
    mutationFn: async (data: WorkoutCreateInput): Promise<Workout> => {
      return (await backend.entities.Workout.create(data)) as Workout
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      setShowForm(false)
      setEditingWorkout(null)
    }
  })

  const updateMutation = useMutation<Workout, Error, { id: string; data: Partial<Workout> }>({
    mutationFn: async ({ id, data }) => {
      return (await backend.entities.Workout.update(id, data)) as Workout
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      setShowForm(false)
      setEditingWorkout(null)
    }
  })

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      return await backend.entities.Workout.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
    }
  })

  const handleSubmit = data => {
    // Check if this is an actual DB record (has an id from the DB) vs. a plan-loaded workout
    if (editingWorkout && editingWorkout.id && !editingWorkout.planId) {
      updateMutation.mutate({ id: editingWorkout.id, data })
    } else {
      // Always create new if: no editingWorkout, no id, or it came from a plan
      createMutation.mutate(data)
    }
  }

  const filteredWorkouts =
    filterType === 'all' ? workouts : workouts.filter(w => w.type === filterType)

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isScrolled && (
          <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="py-3">
              <h1 className="workouts-sticky-title text-sm font-normal text-slate-900 text-center">
                Workouts
              </h1>
            </div>
          </div>
        )}
        <div
          ref={headerRef}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-6 sm:py-8"
        >
          <div className="text-center lg:text-left w-full lg:w-auto">
            <h1 className="workouts-page-title text-3xl sm:text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center lg:justify-start gap-3">
              <Dumbbell className="w-8 h-8 sm:w-9 sm:h-9" />
              Workouts
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Log and track your training sessions
            </p>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <Link to={createPageUrl('WorkoutPlans')} className="flex-1 lg:flex-initial">
              <Button variant="outline" className="w-full">
                <CalendarDays className="w-4 h-4 mr-2" />
                Plans
              </Button>
            </Link>
            {atLimit ? (
              <Link to="/Upgrade" className="flex-1 lg:flex-initial">
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Limit reached ({workouts.length}/{workoutLimit})
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 flex-1 lg:flex-initial"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Workout
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All ({workouts.length})
            </Button>
            {['strength', 'cardio', 'flexibility', 'sports', 'other'].map(type => {
              const count = workouts.filter(w => w.type === type).length
              return (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {workoutTypeLabels[type]} ({count})
                </Button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4">
          {filteredWorkouts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Dumbbell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">
                  {workouts.length === 0
                    ? 'No workouts logged yet'
                    : 'No workouts found for this filter'}
                </p>
                {!atLimit && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Log Your First Workout
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredWorkouts.map(workout => {
              const workoutIdx = workouts.indexOf(workout)
              const overLimit = isOverLimit(workoutIdx)
              const card = (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="workouts-card-title">{workout.title}</CardTitle>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${workoutTypeColors[workout.type]}`}
                        >
                          {workoutTypeLabels[workout.type]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(workout.date), 'MMM d, yyyy')}
                        </span>
                        {workout.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {workout.duration_minutes} min
                          </span>
                        )}
                        {workout.calories_burned && (
                          <span className="flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            {workout.calories_burned} cal
                          </span>
                        )}
                      </div>
                    </div>
                    {!overLimit && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingWorkout(workout)
                            setShowForm(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(workout.id)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {workout.exercises && workout.exercises.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Exercises</p>
                        <div className="space-y-2">
                          {workout.exercises.map((exercise, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-lg p-3">
                              <p className="font-medium text-sm">{exercise.name}</p>
                              <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-600">
                                {exercise.sets && <span>{exercise.sets} sets</span>}
                                {exercise.reps && <span>{exercise.reps} reps</span>}
                                {exercise.weight && <span>{exercise.weight} kg</span>}
                                {exercise.distance && <span>{exercise.distance} km</span>}
                                {exercise.duration && <span>{exercise.duration} min</span>}
                              </div>
                              {exercise.notes && (
                                <p className="text-xs text-slate-500 mt-1">{exercise.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {workout.notes && <p className="text-sm text-slate-600">{workout.notes}</p>}
                  </CardContent>
                </Card>
              )
              return overLimit ? (
                <OverLimitItem key={workout.id}>{card}</OverLimitItem>
              ) : (
                <Fragment key={workout.id}>{card}</Fragment>
              )
            })
          )}
        </div>

        <WorkoutForm
          open={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingWorkout(null)
          }}
          onSubmit={handleSubmit}
          workout={editingWorkout}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  )
}

type WorkoutExerciseForm = {
  name: string
  sets: string
  reps: string
  weight: string
  distance: string
  duration: string
  notes: string
}

type WorkoutExercise = {
  name: string
  sets: number | null
  reps: number | null
  weight: number | null
  distance: number | null
  duration: number | null
  notes: string | null
}

function WorkoutForm({ open, onClose, onSubmit, workout, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'strength',
    duration_minutes: '',
    calories_burned: '',
    exercises: [],
    notes: ''
  })

  useEffect(() => {
    if (workout) {
      setFormData({
        title: workout.title || '',
        date: workout.date || new Date().toISOString().split('T')[0],
        type: workout.type || 'strength',
        duration_minutes: workout.duration_minutes || '',
        calories_burned: workout.calories_burned || '',
        exercises: workout.exercises || [],
        notes: workout.notes || ''
      })
    } else {
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: 'strength',
        duration_minutes: '',
        calories_burned: '',
        exercises: [],
        notes: ''
      })
    }
  }, [workout, open])

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        { name: '', sets: '', reps: '', weight: '', distance: '', duration: '', notes: '' }
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const data = {
      ...formData,
      duration_minutes: formData.duration_minutes ? parseFloat(formData.duration_minutes) : null,
      calories_burned: formData.calories_burned ? parseFloat(formData.calories_burned) : null,

      exercises: formData.exercises
        .filter((ex: WorkoutExerciseForm) => ex.name.trim())
        .map(
          (ex: WorkoutExerciseForm): WorkoutExercise => ({
            name: ex.name,
            sets: ex.sets ? parseInt(ex.sets) : null,
            reps: ex.reps ? parseInt(ex.reps) : null,
            weight: ex.weight ? parseFloat(ex.weight) : null,
            distance: ex.distance ? parseFloat(ex.distance) : null,
            duration: ex.duration ? parseFloat(ex.duration) : null,
            notes: ex.notes || null
          })
        )
    }

    onSubmit(data)
  }

  const isStrengthType = formData.type === 'strength'
  const isCardioType = formData.type === 'cardio'
  const isEditingExistingWorkout = workout && workout.id

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditingExistingWorkout ? 'Edit Workout' : 'Log Workout'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Workout name"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            maxLength={200}
            required
          />
          <Input
            type="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            required
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
          <Input
            type="number"
            placeholder="Duration (minutes)"
            value={formData.duration_minutes}
            onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Calories burned"
            value={formData.calories_burned}
            onChange={e => setFormData({ ...formData, calories_burned: e.target.value })}
          />

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
                      placeholder="Exercise notes (optional)"
                      value={exercise.notes}
                      onChange={e => updateExercise(idx, 'notes', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Textarea
            placeholder="Workout notes (optional)"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            maxLength={5000}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isEditingExistingWorkout ? 'Update' : 'Log Workout'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
