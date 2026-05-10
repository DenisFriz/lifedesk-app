import React, { useMemo } from 'react'
import {
  format,
  parseISO,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays
} from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps
} from 'recharts'
import { formatCurrency } from '@/components/utils/formatters'

function buildChartData(income, expenses, dateRange) {
  // Determine full date range
  const allDates = [
    ...income.map(i => i.date).filter(Boolean),
    ...expenses.map(e => e.date).filter(Boolean)
  ]
    .map(d => new Date(d).getTime())
    .filter(d => !isNaN(d))

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  let rangeStart, rangeEnd
  if (dateRange) {
    rangeStart = dateRange.start
    rangeEnd = dateRange.end > today ? today : dateRange.end
  } else if (allDates.length > 0) {
    rangeStart = new Date(Math.min(...allDates))
    rangeEnd = today
  } else {
    return []
  }

  // Clamp rangeStart to not be after rangeEnd
  if (rangeStart > rangeEnd) return []

  const totalDays = differenceInDays(rangeEnd, rangeStart)

  // Choose grouping based on range
  let groupBy = 'day'
  if (totalDays > 180) groupBy = 'month'
  else if (totalDays > 60) groupBy = 'week'

  // Build daily net map
  const dailyNet = {}
  income.forEach(t => {
    if (!t.date) return
    const key = t.date.slice(0, 10)
    dailyNet[key] = (dailyNet[key] || 0) + (t.amount || 0)
  })
  expenses.forEach(t => {
    if (!t.date) return
    const key = t.date.slice(0, 10)
    dailyNet[key] = (dailyNet[key] || 0) - (t.amount || 0)
  })

  // Generate all days in range
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })

  // Calculate running balance starting from 0 at rangeStart
  const dailyBalances = []
  let runningBalance = 0
  days.forEach(day => {
    const key = format(day, 'yyyy-MM-dd')
    runningBalance += dailyNet[key] || 0
    dailyBalances.push({ date: day, key, net: dailyNet[key] || 0, balance: runningBalance })
  })

  // Group into buckets
  if (groupBy === 'day') {
    return dailyBalances.map(d => ({
      label: format(d.date, 'MMM dd'),
      balance: parseFloat(d.balance.toFixed(2)),
      net: parseFloat(d.net.toFixed(2))
    }))
  }

  if (groupBy === 'week') {
    const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 })
    return weeks
      .map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        // Take the last balance of the week
        const weekDays = dailyBalances.filter(d => d.date >= weekStart && d.date <= weekEnd)
        if (weekDays.length === 0) return null
        const lastDay = weekDays[weekDays.length - 1]
        const weekNet = weekDays.reduce((sum, d) => sum + d.net, 0)
        return {
          label: format(weekStart, 'MMM dd'),
          balance: parseFloat(lastDay.balance.toFixed(2)),
          net: parseFloat(weekNet.toFixed(2))
        }
      })
      .filter(Boolean)
  }

  if (groupBy === 'month') {
    const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd })
    return months
      .map(monthStart => {
        const monthEnd = endOfMonth(monthStart)
        const monthDays = dailyBalances.filter(d => d.date >= monthStart && d.date <= monthEnd)
        if (monthDays.length === 0) return null
        const lastDay = monthDays[monthDays.length - 1]
        const monthNet = monthDays.reduce((sum, d) => sum + d.net, 0)
        return {
          label: format(monthStart, 'MMM yyyy'),
          balance: parseFloat(lastDay.balance.toFixed(2)),
          net: parseFloat(monthNet.toFixed(2))
        }
      })
      .filter(Boolean)
  }

  return []
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function CashFlowChart({
  income,
  expenses,
  dateRange
}: {
  income: any[]
  expenses: any[]
  dateRange?: any
}) {
  const data = useMemo(
    () => buildChartData(income, expenses, dateRange),
    [income, expenses, dateRange]
  )

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No transaction data available for this period
      </div>
    )
  }

  const maxLabelCount = 12
  const interval = data.length > maxLabelCount ? Math.floor(data.length / maxLabelCount) : 0

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748b' }}
          angle={-35}
          textAnchor="end"
          height={60}
          interval={interval}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickFormatter={v => formatCurrency(v)}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} />
        <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1} />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          name="Running Balance"
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="net"
          stroke="#10b981"
          strokeWidth={1.5}
          dot={false}
          name="Net Cash Flow"
          strokeDasharray="4 2"
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
