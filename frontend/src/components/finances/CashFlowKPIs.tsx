import React, { useMemo } from 'react'
import { formatCurrency } from '@/components/utils/formatters'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { startOfDay, endOfDay, subDays, subMonths, subYears } from 'date-fns'

export default function CashFlowKPIs({
  income = [],
  expenses = [],
  timePeriod,
  customStartDate,
  customEndDate
}: {
  income?: any[]
  expenses?: any[]
  timePeriod: string
  customStartDate?: Date
  customEndDate?: Date
}) {
  const { totalIncome, totalExpenses, net } = useMemo(() => {
    const now = new Date()
    let start = null,
      end = null

    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      start = startOfDay(customStartDate)
      end = endOfDay(customEndDate)
    } else if (timePeriod !== 'all') {
      const ranges = {
        '30days': subDays(now, 30),
        '90days': subDays(now, 90),
        '6months': subMonths(now, 6),
        '1year': subYears(now, 1)
      }
      start = startOfDay(ranges[timePeriod] || subDays(now, 30))
      end = endOfDay(now)
    }

    const inRange = (t: any) => {
      if (!t.date) return false
      const d = startOfDay(new Date(t.date))
      if (isNaN(d.getTime())) return false
      if (!start || !end) return true
      return d >= start && d <= end
    }

    const totalIncome = income.filter(inRange).reduce((s, t) => s + (t.amount || 0), 0)
    const totalExpenses = expenses.filter(inRange).reduce((s, t) => s + (t.amount || 0), 0)
    return { totalIncome, totalExpenses, net: totalIncome - totalExpenses }
  }, [income, expenses, timePeriod, customStartDate, customEndDate])

  const cards = [
    {
      label: 'Income',
      value: totalIncome,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
      prefix: '+'
    },
    {
      label: 'Expenses',
      value: totalExpenses,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      icon: <TrendingDown className="w-4 h-4 text-rose-600" />,
      prefix: '-'
    },
    {
      label: 'Net',
      value: Math.abs(net),
      color: net >= 0 ? 'text-indigo-600' : 'text-orange-600',
      bg: net >= 0 ? 'bg-indigo-50' : 'bg-orange-50',
      icon: <Activity className={`w-4 h-4 ${net >= 0 ? 'text-indigo-600' : 'text-orange-600'}`} />,
      prefix: net >= 0 ? '+' : '-'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map(card => (
        <div
          key={card.label}
          className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3"
        >
          <div
            className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center flex-shrink-0`}
          >
            {card.icon}
          </div>
          <div>
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>
              {card.prefix}
              {formatCurrency(card.value).replace(/^[€$£]/, '')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
