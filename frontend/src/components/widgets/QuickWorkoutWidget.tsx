import { useState } from 'react'
import { backend } from '@/api/backend'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Dumbbell, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function QuickWorkoutWidget() {
  const [workout, setWorkout] = useState({
    title: '',
    type: 'strength',
    duration_minutes: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => backend.entities.Workout.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      setWorkout({
        title: '',
        type: 'strength',
        duration_minutes: '',
        date: new Date().toISOString().split('T')[0]
      })
      setIsSubmitting(false)
      toast.success('Workout saved!')
    },
    onError: () => {
      setIsSubmitting(false)
      toast.error('Error saving workout')
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!workout.title || !workout.duration_minutes) {
      toast.error('Please enter a title and duration')
      return
    }
    setIsSubmitting(true)
    createMutation.mutate({
      ...workout,
      duration_minutes: parseInt(workout.duration_minutes)
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Quick Workout</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="e.g. Strength training"
          value={workout.title}
          onChange={e => setWorkout({ ...workout, title: e.target.value })}
          className="h-9"
        />
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={workout.type}
            onValueChange={value => setWorkout({ ...workout, type: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Min."
            value={workout.duration_minutes}
            onChange={e => setWorkout({ ...workout, duration_minutes: e.target.value })}
            className="h-9"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            'Saving...'
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
