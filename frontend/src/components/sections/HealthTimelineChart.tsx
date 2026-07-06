import { useState, useMemo } from 'react'
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

const problemTypes = [
  { value: 'health_problem', label: 'Health Problems', color: '#ef4444', yPos: 0 },
  { value: 'medication', label: 'Medication', color: '#8b5cf6', yPos: 1 },
  { value: 'measurement', label: 'Measurements', color: '#3b82f6', yPos: 2 },
  { value: 'activity', label: 'Activity', color: '#10b981', yPos: 3 },
  { value: 'food', label: 'Food', color: '#f59e0b', yPos: 4 },
  { value: 'mental_state', label: 'Mental State', color: '#ec4899', yPos: 5 },
  { value: 'medical_event', label: 'Medical Event', color: '#6366f1', yPos: 6 }
]

const timePeriods = [
  { value: '30d', label: 'Last 30 Days', getDays: () => 30 },
  { value: '90d', label: 'Last 90 Days', getDays: () => 90 },
  { value: '6m', label: 'Last 6 Months', getDays: () => 180 },
  { value: '1y', label: 'Last Year', getDays: () => 365 },
  { value: 'all', label: 'All Time', getDays: () => null }
]

export default function HealthTimelineChart({ category }) {
  const [visibleTypes, setVisibleTypes] = useState(problemTypes.map(t => t.value))
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  const { data: problems = [] } = useQuery<any[]>({
    queryKey: ['problems', category],
    queryFn: () => backend.entities.Problem.filter({ category })
  })

  const toggleType = typeValue => {
    setVisibleTypes(prev =>
      prev.includes(typeValue) ? prev.filter(t => t !== typeValue) : [...prev, typeValue]
    )
  }

  const chartData = useMemo(() => {
    const period = timePeriods.find(p => p.value === selectedPeriod)
    const daysToShow = period?.getDays()
    const cutoffDate = daysToShow ? subDays(new Date(), daysToShow) : null

    // Calculate time range boundaries
    const now = new Date().getTime()
    const rangeStart = cutoffDate ? cutoffDate.getTime() : null
    const rangeEnd = now

    // Collect all unique dates where any problem starts or ends
    const allDates = new Set<number>()

    const filteredProblems = problems.filter(p => {
      if (!p.show_in_timeline || !p.date_occurred) return false
      if (!visibleTypes.includes(p.problem_type)) return false
      if (cutoffDate) {
        const endDate = p.date_ended ? parseISO(p.date_ended) : new Date()
        // Show entry if it's still active during the time period (ended after cutoff)
        if (endDate < cutoffDate) return false
      }
      return true
    })

    // Group problems by type and assign offsets
    const problemOffsets = new Map()
    const typeGroups = {}

    filteredProblems.forEach(p => {
      if (!typeGroups[p.problem_type]) {
        typeGroups[p.problem_type] = []
      }
      typeGroups[p.problem_type].push(p)
    })

    // Assign vertical offset to each problem based on its index within its type
    Object.keys(typeGroups).forEach(type => {
      const problemsOfType = typeGroups[type]
      problemsOfType.forEach((p, index) => {
        const typeInfo = problemTypes.find(t => t.value === type)
        const offset = index * 0.15 // 0.15 units apart
        problemOffsets.set(p.id, typeInfo.yPos + offset)
      })
    })

    // For each problem, add start and end dates within the time range
    filteredProblems.forEach(p => {
      const startDate = parseISO(p.date_occurred).getTime()
      const endDate = p.date_ended ? parseISO(p.date_ended).getTime() : now

      // Add dates clamped to the range
      if (rangeStart) {
        allDates.add(Math.max(startDate, rangeStart))
        allDates.add(Math.min(endDate, rangeEnd))
      } else {
        allDates.add(startDate)
        allDates.add(endDate)
      }
    })

    // If we have a time range, ensure we have boundary points
    if (rangeStart) {
      allDates.add(rangeStart)
      allDates.add(rangeEnd)
    }

    // Sort all dates
    const sortedDates = Array.from(allDates).sort((a, b) => a - b)

    // Build data array
    const data = sortedDates.map(timestamp => {
      const dataPoint = { date: timestamp }

      // For each problem, check if this date is within its range
      filteredProblems.forEach(p => {
        const startDate = parseISO(p.date_occurred).getTime()
        const endDate = p.date_ended ? parseISO(p.date_ended).getTime() : now

        // If this timestamp is within the problem's range, add the yPos value with offset
        if (timestamp >= startDate && timestamp <= endDate) {
          dataPoint[p.id] = problemOffsets.get(p.id)
        }
      })

      return dataPoint
    })

    return data
  }, [problems, selectedPeriod, visibleTypes])

  const timelineProblems = problems.filter(
    p => p.show_in_timeline && visibleTypes.includes(p.problem_type)
  )

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

  const chartMinWidth = useMemo(() => {
    const period = timePeriods.find(p => p.value === selectedPeriod)
    const daysToShow = period?.getDays()

    if (!daysToShow) {
      // For "all" periods, derive width from actual data span
      if (chartData.length < 2) return 700
      const firstDate = chartData[0].date
      const lastDate = chartData[chartData.length - 1].date
      const daySpan = (lastDate - firstDate) / (1000 * 60 * 60 * 24)
      return Math.max(700, Math.ceil(daySpan * 6))
    }

    return Math.max(700, daysToShow * 6)
  }, [selectedPeriod, chartData])

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const hoveredProblems = payload
        .filter(p => p.dataKey !== 'date')
        .map(p => {
          const problem = problems.find(prob => prob.id === p.dataKey)
          return problem
        })
        .filter(Boolean)

      if (hoveredProblems.length === 0) return null

      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg max-w-xs">
          {hoveredProblems.map(problem => {
            const typeInfo = problemTypes.find(t => t.value === problem.problem_type)
            return (
              <div key={problem.id} className="mb-2 last:mb-0">
                <p className="font-semibold" style={{ color: typeInfo?.color }}>
                  {problem.title}
                </p>
                <p className="text-xs" style={{ color: typeInfo?.color }}>
                  {typeInfo?.label}
                </p>
                <p className="text-xs text-slate-500">
                  {format(parseISO(problem.date_occurred), 'MMM d, yyyy')} -
                  {problem.date_ended
                    ? format(parseISO(problem.date_ended), 'MMM d, yyyy')
                    : 'Present'}
                </p>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <div className="flex flex-col min-[480px]:flex-row items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Health Timeline</h2>
        </div>
        <div className="flex flex-wrap gap-2">
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

      <div className="flex flex-wrap gap-2 mb-6">
        {problemTypes.map(type => {
          const count = problems.filter(
            p => p.problem_type === type.value && p.show_in_timeline
          ).length
          const isVisible = visibleTypes.includes(type.value)

          return (
            <button
              key={type.value}
              onClick={() => toggleType(type.value)}
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

      {timelineProblems.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No entries marked for timeline in selected period
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${chartMinWidth}px` }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  type="number"
                  domain={xAxisDomain}
                  tickFormatter={timestamp => format(new Date(timestamp), 'MMM d, yyyy')}
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  domain={[-0.5, 6]}
                  ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={value => problemTypes.find(t => t.yPos === value)?.label || ''}
                  stroke="#64748b"
                  style={{ fontSize: '11px' }}
                  width={110}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
                  isAnimationActive={false}
                />
                {timelineProblems.map(problem => {
                  const typeInfo = problemTypes.find(t => t.value === problem.problem_type)
                  return (
                    <Line
                      key={problem.id}
                      type="stepAfter"
                      dataKey={problem.id}
                      stroke={typeInfo?.color || '#64748b'}
                      strokeWidth={3}
                      dot={false}
                      connectNulls={true}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
