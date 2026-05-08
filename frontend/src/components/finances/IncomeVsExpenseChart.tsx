import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'

export default function IncomeVsExpenseChart({
  income,
  expenses
}: {
  income: any[]
  expenses: any[]
}) {
  const months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  })

  const data = months.map(month => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)

    const monthIncome = income
      .filter(item => {
        const date = new Date(item.date)
        return date >= monthStart && date <= monthEnd
      })
      .reduce((sum, item) => sum + item.amount, 0)

    const monthExpenses = expenses
      .filter(item => {
        const date = new Date(item.date)
        return date >= monthStart && date <= monthEnd
      })
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      month: format(month, 'MMM yyyy'),
      income: monthIncome,
      expenses: monthExpenses,
      net: monthIncome - monthExpenses
    }
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
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
          <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
