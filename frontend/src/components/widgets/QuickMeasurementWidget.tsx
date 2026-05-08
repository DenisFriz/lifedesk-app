import { useState } from 'react'
import { backend } from '@/api/backend'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrendingUp, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function QuickMeasurementWidget() {
  const [measurement, setMeasurement] = useState({
    weight: '',
    body_fat_percentage: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => backend.entities.BodyMeasurement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyMeasurements'] })
      setMeasurement({
        weight: '',
        body_fat_percentage: '',
        date: new Date().toISOString().split('T')[0]
      })
      setIsSubmitting(false)
      toast.success('Measurement saved!')
    },
    onError: () => {
      setIsSubmitting(false)
      toast.error('Error saving measurement')
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!measurement.weight) {
      toast.error('Please enter your weight')
      return
    }
    setIsSubmitting(true)
    const data: Record<string, unknown> = {
      date: measurement.date,
      weight: parseFloat(measurement.weight)
    }
    if (measurement.body_fat_percentage) {
      data.body_fat_percentage = parseFloat(measurement.body_fat_percentage)
    }
    createMutation.mutate(data)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-900">Quick Measurement</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            step="0.1"
            placeholder="Weight (kg)"
            value={measurement.weight}
            onChange={e => setMeasurement({ ...measurement, weight: e.target.value })}
            className="h-9"
          />
          <Input
            type="number"
            step="0.1"
            placeholder="Body fat %"
            value={measurement.body_fat_percentage}
            onChange={e => setMeasurement({ ...measurement, body_fat_percentage: e.target.value })}
            className="h-9"
          />
        </div>
        <Input
          type="date"
          value={measurement.date}
          onChange={e => setMeasurement({ ...measurement, date: e.target.value })}
          className="h-9"
        />
        <Button
          type="submit"
          size="sm"
          className="w-full bg-emerald-600 hover:bg-emerald-700"
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
