import React from 'react'
import { format, addMonths, startOfMonth, isSameMonth } from 'date-fns'
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
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

export default function CashFlowForecast({ recurringIncome, recurringExpenses }: { recurringIncome: any[]; recurringExpenses: any[] }) {
  const frequencyMultipliers = {
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
    quarterly: 0.33,
    yearly: 0.083
  }

  const generateForecast = () => {
    const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(new Date()), i))

    return months.map(month => {
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
        month: format(month, 'MMM yy'),
        income: Math.round(monthlyIncome),
        expenses: Math.round(monthlyExpenses),
        net: Math.round(monthlyIncome - monthlyExpenses)
      }
    })
  }

  const forecast = generateForecast()
  const totalProjectedIncome = forecast.reduce((sum, m) => sum + m.income, 0)
  const totalProjectedExpenses = forecast.reduce((sum, m) => sum + m.expenses, 0)
  const totalNet = totalProjectedIncome - totalProjectedExpenses

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">12-Month Cash Flow Forecast</h3>
          <p className="text-sm text-slate-500">Based on recurring transactions</p>
        </div>
        <Calendar className="w-5 h-5 text-slate-400" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700">Projected Income</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">
            ${totalProjectedIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-rose-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span className="text-sm text-rose-700">Projected Expenses</span>
          </div>
          <p className="text-2xl font-bold text-rose-900">
            ${totalProjectedExpenses.toLocaleString()}
          </p>
        </div>
        <div className={`rounded-lg p-4 ${totalNet >= 0 ? 'bg-indigo-50' : 'bg-amber-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm ${totalNet >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
              Net Flow
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${totalNet >= 0 ? 'text-indigo-900' : 'text-amber-900'}`}
          >
            ${totalNet.toLocaleString()}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={forecast}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
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
