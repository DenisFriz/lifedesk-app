import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Dumbbell, Clock } from 'lucide-react'
import { subDays, parseISO, isAfter } from 'date-fns'
import type { Workout, BodyMeasurement } from '@/types/entities'

const TYPE_COLORS = {
  strength: 'bg-blue-100 text-blue-700',
  cardio: 'bg-red-100 text-red-700',
  flexibility: 'bg-purple-100 text-purple-700',
  sports: 'bg-green-100 text-green-700',
  other: 'bg-slate-100 text-slate-700'
}

export default function FitnessSummaryWidget() {
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts-widget'],
    queryFn: () => backend.entities.Workout.list('-date', 50) as Promise<Workout[]>
  })

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements-widget'],
    queryFn: () => backend.entities.BodyMeasurement.list('-date', 5) as Promise<BodyMeasurement[]>
  })

  const sevenDaysAgo = subDays(new Date(), 7)
  const recentWorkouts = workouts.filter(w => w.date && isAfter(parseISO(w.date), sevenDaysAgo))
  const totalMinutes = recentWorkouts.reduce((s, w) => s + (w.duration_minutes || 0), 0)
  const totalCalories = recentWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0)
  const latestWeight = measurements.find(m => m.weight != null)?.weight

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">Fitness — Last 7 Days</h3>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{recentWorkouts.length}</p>
          <p className="text-xs text-slate-500">Workouts</p>
        </div>
        {totalMinutes > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-700">
              {Math.round(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
            <p className="text-xs text-slate-500">Active Time</p>
          </div>
        )}
        {totalCalories > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{totalCalories}</p>
            <p className="text-xs text-slate-500">Calories</p>
          </div>
        )}
        {latestWeight && (
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{latestWeight}kg</p>
            <p className="text-xs text-slate-500">Weight</p>
          </div>
        )}
      </div>
      {recentWorkouts.length === 0 ? (
        <p className="text-sm text-slate-500">No workouts in the last 7 days</p>
      ) : (
        <div className="space-y-1.5">
          {recentWorkouts.slice(0, 3).map(w => (
            <div
              key={w.id}
              className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-0"
            >
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[w.type as keyof typeof TYPE_COLORS] || TYPE_COLORS.other}`}
              >
                {w.type}
              </span>
              <span className="text-sm text-slate-700 flex-1 truncate">{w.title}</span>
              {w.duration_minutes && (
                <span className="text-xs text-slate-400 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {w.duration_minutes}m
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
