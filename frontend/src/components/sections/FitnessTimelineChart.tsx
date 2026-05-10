import React, { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Calendar, Eye, EyeOff } from 'lucide-react'
import { format, subDays, parseISO } from 'date-fns'

const measurementTypes = [
  { value: 'weight', label: 'Weight', color: '#10b981', field: 'weight', unit: 'kg' },
  {
    value: 'body_fat',
    label: 'Body Fat %',
    color: '#f59e0b',
    field: 'body_fat_percentage',
    unit: '%'
  },
  {
    value: 'muscle_mass',
    label: 'Muscle Mass',
    color: '#8b5cf6',
    field: 'muscle_mass',
    unit: 'kg'
  },
  { value: 'chest', label: 'Chest', color: '#06b6d4', field: 'chest', unit: 'cm' },
  { value: 'waist', label: 'Waist', color: '#ec4899', field: 'waist', unit: 'cm' },
  { value: 'hips', label: 'Hips', color: '#f97316', field: 'hips', unit: 'cm' },
  { value: 'arms', label: 'Arms', color: '#14b8a6', field: 'arms', unit: 'cm' },
  { value: 'legs', label: 'Legs', color: '#a855f7', field: 'legs', unit: 'cm' }
]

const timePeriods = [
  { value: '30d', label: 'Last 30 Days', getDays: () => 30 },
  { value: '90d', label: 'Last 90 Days', getDays: () => 90 },
  { value: '6m', label: 'Last 6 Months', getDays: () => 180 },
  { value: '1y', label: 'Last Year', getDays: () => 365 },
  { value: 'all', label: 'All Time', getDays: () => null }
]

export default function FitnessTimelineChart() {
  const [showWorkouts, setShowWorkouts] = useState(true)
  const [visibleMeasurements, setVisibleMeasurements] = useState(['weight'])
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  const { data: workouts = [] } = useQuery<any[]>({
    queryKey: ['workouts'],
    queryFn: () => backend.entities.Workout.list('-date')
  })

  const { data: measurements = [] } = useQuery<any[]>({
    queryKey: ['measurements'],
    queryFn: () => backend.entities.BodyMeasurement.list('-date')
  })

  const toggleMeasurement = measurementValue => {
    setVisibleMeasurements(prev =>
      prev.includes(measurementValue)
        ? prev.filter(t => t !== measurementValue)
        : [...prev, measurementValue]
    )
  }

  const chartData = useMemo(() => {
    const period = timePeriods.find(p => p.value === selectedPeriod)
    const daysToShow = period?.getDays()
    const cutoffDate = daysToShow ? subDays(new Date(), daysToShow) : null

    const allDates = new Set<number>()
    const dataMap = new Map()

    // Process workouts
    if (showWorkouts) {
      workouts.forEach(workout => {
        if (!workout.date) return
        const workoutDate = parseISO(workout.date)
        if (cutoffDate && workoutDate < cutoffDate) return

        const timestamp = workoutDate.getTime()
        allDates.add(timestamp)

        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, { date: timestamp })
        }
        dataMap.get(timestamp).workout = 1
        dataMap.get(timestamp).workoutData = workout
      })
    }

    // Process measurements
    visibleMeasurements.forEach(measurementType => {
      const typeInfo = measurementTypes.find(t => t.value === measurementType)
      if (!typeInfo) return

      measurements.forEach(measurement => {
        if (!measurement.date) return
        const measurementDate = parseISO(measurement.date)
        if (cutoffDate && measurementDate < cutoffDate) return

        const value = measurement[typeInfo.field]
        if (value === null || value === undefined) return

        const timestamp = measurementDate.getTime()
        allDates.add(timestamp)

        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, { date: timestamp })
        }
        dataMap.get(timestamp)[measurementType] = value
        dataMap.get(timestamp)[`${measurementType}Data`] = measurement
      })
    })

    const sortedDates = Array.from(allDates).sort((a, b) => a - b)
    const data = sortedDates.map(timestamp => dataMap.get(timestamp))

    return data
  }, [workouts, measurements, selectedPeriod, showWorkouts, visibleMeasurements])

  const hasData = useMemo(() => {
    return (
      (showWorkouts && workouts.length > 0) ||
      visibleMeasurements.some(type => {
        const typeInfo = measurementTypes.find(t => t.value === type)
        return measurements.some(m => m[typeInfo?.field] != null)
      })
    )
  }, [showWorkouts, workouts, visibleMeasurements, measurements])

  const xAxisDomain = useMemo(() => {
    const period = timePeriods.find(p => p.value === selectedPeriod)
    const daysToShow = period?.getDays()

    if (!daysToShow) {
      return ['dataMin', 'dataMax']
    }

    const endDate = new Date().getTime()
    const startDate = subDays(new Date(), daysToShow).getTime()
    return [startDate, endDate]
  }, [selectedPeriod])

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0]?.payload
    if (!data) return null

    const date = format(new Date(data.date), 'MMM d, yyyy')

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-700 mb-2">{date}</p>

        {data.workout && data.workoutData && (
          <div className="mb-2">
            <p className="font-semibold text-blue-600">{data.workoutData.title}</p>
            <p className="text-xs text-slate-500">
              Workout
              {data.workoutData.duration_minutes && ` • ${data.workoutData.duration_minutes} min`}
            </p>
          </div>
        )}

        {visibleMeasurements.map(type => {
          const typeInfo = measurementTypes.find(t => t.value === type)
          const value = data[type]
          if (value == null) return null

          return (
            <div key={type} className="mb-1 last:mb-0">
              <p className="text-xs">
                <span className="font-medium" style={{ color: typeInfo.color }}>
                  {typeInfo.label}:
                </span>
                <span className="text-slate-700 ml-1">
                  {value} {typeInfo.unit}
                </span>
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Fitness Timeline</h2>
        </div>
        <div className="flex gap-2">
          {timePeriods.map(period => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.value)}
              className="text-xs"
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <button
            onClick={() => setShowWorkouts(!showWorkouts)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm"
            style={{
              borderColor: showWorkouts ? '#3b82f6' : '#e2e8f0',
              backgroundColor: showWorkouts ? '#3b82f615' : 'white'
            }}
          >
            {showWorkouts ? (
              <Eye className="w-4 h-4 text-blue-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400" />
            )}
            <span
              className="text-sm font-medium"
              style={{ color: showWorkouts ? '#3b82f6' : '#64748b' }}
            >
              Workouts
            </span>
            <Badge variant="secondary" className="text-xs">
              {workouts.length}
            </Badge>
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Measurements</p>
          <div className="flex flex-wrap gap-2">
            {measurementTypes.map(type => {
              const count = measurements.filter(m => m[type.field] != null).length
              const isVisible = visibleMeasurements.includes(type.value)

              return (
                <button
                  key={type.value}
                  onClick={() => toggleMeasurement(type.value)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm"
                  style={{
                    borderColor: isVisible ? type.color : '#e2e8f0',
                    backgroundColor: isVisible ? `${type.color}15` : 'white'
                  }}
                >
                  {isVisible ? (
                    <Eye className="w-4 h-4" style={{ color: type.color }} />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: isVisible ? type.color : '#64748b' }}
                  >
                    {type.label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No fitness entries in selected period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              type="number"
              domain={xAxisDomain}
              tickFormatter={timestamp => format(new Date(timestamp), 'MMM d, yyyy')}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
              isAnimationActive={false}
            />

            {showWorkouts && (
              <Line
                type="monotone"
                dataKey="workout"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 5, fill: '#3b82f6' }}
                connectNulls={false}
                yAxisId="workout"
              />
            )}

            {visibleMeasurements.map(type => {
              const typeInfo = measurementTypes.find(t => t.value === type)
              return (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={typeInfo.color}
                  strokeWidth={2}
                  dot={{ r: 4, fill: typeInfo.color }}
                  connectNulls
                  yAxisId={type}
                />
              )
            })}

            {showWorkouts && <YAxis yAxisId="workout" domain={[0, 2]} hide />}

            {visibleMeasurements.map(type => (
              <YAxis
                key={type}
                yAxisId={type}
                orientation="left"
                stroke="#64748b"
                style={{ fontSize: '11px' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
