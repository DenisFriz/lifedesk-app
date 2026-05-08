import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format, addMonths, startOfMonth } from 'date-fns'

export default function RecurringTrendsChart({ recurringIncome, recurringExpenses }: { recurringIncome: any[]; recurringExpenses: any[] }) {
  const months = Array.from({ length: 6 }, (_, i) => addMonths(startOfMonth(new Date()), i))

  const frequencyMultipliers = {
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
    quarterly: 0.33,
    yearly: 0.083
  }

  const data = months.map(month => {
    const monthlyIncome = recurringIncome
      .filter(r => r.active)
      .reduce((sum, item) => {
        return sum + item.amount * (frequencyMultipliers[item.frequency] || 1)
      }, 0)

    const monthlyExpenses = recurringExpenses
      .filter(r => r.active)
      .reduce((sum, item) => {
        return sum + item.amount * (frequencyMultipliers[item.frequency] || 1)
      }, 0)

    return {
      month: format(month, 'MMM yyyy'),
      income: Math.round(monthlyIncome),
      expenses: Math.round(monthlyExpenses),
      net: Math.round(monthlyIncome - monthlyExpenses)
    }
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recurring Cash Flow Projection</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fill: '#64748b' }} />
          <YAxis tick={{ fill: '#64748b' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            formatter={value => `$${value.toLocaleString()}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            name="Recurring Income"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            strokeWidth={2}
            name="Recurring Expenses"
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Net Cash Flow"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
