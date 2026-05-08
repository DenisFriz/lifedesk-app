import React from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, format } from 'date-fns'
import { formatCurrency } from '@/components/utils/formatters'
import type { Income, Expense } from '@/types/entities'

export default function MonthlyFinanceWidget() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const { data: income = [] } = useQuery({
    queryKey: ['income-monthly-widget'],
    queryFn: () => backend.entities.Income.list('-date', 200) as Promise<Income[]>
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-monthly-widget'],
    queryFn: () => backend.entities.Expense.list('-date', 200) as Promise<Expense[]>
  })

  const monthIncome = income
    .filter(i => i.date && isWithinInterval(parseISO(i.date), { start: monthStart, end: monthEnd }))
    .reduce((s, i) => s + (i.amount || 0), 0)

  const monthExpenses = expenses
    .filter(e => e.date && isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }))
    .reduce((s, e) => s + (e.amount || 0), 0)

  const net = monthIncome - monthExpenses
  const savingsRate = monthIncome > 0 ? Math.round((net / monthIncome) * 100) : 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-900">This Month</h3>
        <span className="text-xs text-slate-400 ml-auto">{format(now, 'MMMM yyyy')}</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-slate-600">Income</span>
          </div>
          <span className="text-sm font-semibold text-emerald-600">
            +{formatCurrency(monthIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span className="text-sm text-slate-600">Expenses</span>
          </div>
          <span className="text-sm font-semibold text-rose-500">
            -{formatCurrency(monthExpenses)}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold text-slate-700">Net</span>
          <span className={`text-sm font-bold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {net >= 0 ? '+' : ''}
            {formatCurrency(net)}
          </span>
        </div>
        {monthIncome > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Savings rate</span>
              <span>{savingsRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${savingsRate >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(Math.abs(savingsRate), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
