import { useMemo, useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/components/utils/formatters'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { TrendingUp, TrendingDown } from 'lucide-react'

const frequencyMultiplier = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 12 / 4,
  yearly: 1 / 12
}

export default function PlannedVsActual({
  recurringIncome,
  recurringExpenses,
  businesses,
  businessId
}: {
  recurringIncome: any[]
  recurringExpenses: any[]
  businesses: any[]
  businessId?: string | null
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const { data: allIncome = [] } = useQuery({
    queryKey: ['income'],
    queryFn: () => backend.entities.Income.list('-date')
  })
  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => backend.entities.Expense.list('-date')
  })

  const monthOptions = useMemo(() => {
    const opts = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
      opts.push({ val, label })
    }
    return opts
  }, [])

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  const actualIncome = useMemo(() => {
    let txs = allIncome.filter(i => {
      const d = new Date(i.date)
      return d >= monthStart && d <= monthEnd
    })

    if (businessId) {
      txs = txs.filter(i => String(i.business_id) === String(businessId))
    }

    const map: Record<string, number> = {}

    txs.forEach(i => {
      const c = i.category || 'Uncategorized'
      map[c] = (map[c] || 0) + (i.amount || 0)
    })

    return map
  }, [allIncome, selectedMonth, businessId])

  const actualExpenses = useMemo(() => {
    let txs = allExpenses.filter(e => {
      const d = new Date(e.date)
      return d >= monthStart && d <= monthEnd
    })

    if (businessId) txs = txs.filter(e => String(e.business_id) === String(businessId))

    const map: Record<string, number> = {}

    txs.forEach(e => {
      const c = e.category || 'Uncategorized'
      map[c] = (map[c] || 0) + (e.amount || 0)
    })
    return map
  }, [allExpenses, selectedMonth, businessId])

  const plannedIncome = useMemo(() => {
    const map: Record<string, number> = {}

    recurringIncome
      .filter(i => i.active !== false)
      .forEach(i => {
        const c = i.category || 'Uncategorized'
        map[c] = (map[c] || 0) + i.amount * (frequencyMultiplier[i.frequency] || 1)
      })

    return map
  }, [recurringIncome])

  const plannedExpenses = useMemo(() => {
    const map: Record<string, number> = {}

    recurringExpenses
      .filter(e => e.active !== false)
      .forEach(e => {
        const c = e.category || 'Uncategorized'
        map[c] = (map[c] || 0) + e.amount * (frequencyMultiplier[e.frequency] || 1)
      })

    return map
  }, [recurringExpenses])

  const allIncomeCategories = [
    ...new Set([...Object.keys(plannedIncome), ...Object.keys(actualIncome)])
  ]
  const allExpenseCategories = [
    ...new Set([...Object.keys(plannedExpenses), ...Object.keys(actualExpenses)])
  ]

  const totalPlannedIncome = Object.values(plannedIncome).reduce((s, v) => s + v, 0)
  const totalActualIncome = Object.values(actualIncome).reduce((s, v) => s + v, 0)
  const totalPlannedExpenses = Object.values(plannedExpenses).reduce((s, v) => s + v, 0)
  const totalActualExpenses = Object.values(actualExpenses).reduce((s, v) => s + v, 0)

  const ComparisonRow = ({ category, planned, actual }) => {
    const diff = actual - planned
    const pct = planned > 0 ? (actual / planned) * 100 : null
    return (
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <td className="px-2 sm:px-4 py-2 text-sm text-slate-700">{category}</td>
        <td className="px-2 sm:px-4 py-2 text-sm text-slate-500 text-right">
          {planned > 0 ? formatCurrency(planned) : '—'}
        </td>
        <td className="px-2 sm:px-4 py-2 text-sm text-slate-900 font-medium text-right">
          {actual > 0 ? formatCurrency(actual) : '—'}
        </td>
        <td className="px-2 sm:px-4 py-2 text-right">
          {planned > 0 && actual > 0 ? (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                diff >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
              )}
            >
              {diff >= 0 ? '+' : ''}
              {formatCurrency(diff)}
            </span>
          ) : (
            <span className="text-slate-300 text-xs">—</span>
          )}
        </td>
        <td className="px-2 sm:px-4 py-2 w-24">
          {pct !== null && (
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
            </div>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(o => (
              <SelectItem key={o.val} value={o.val}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Planned Income',
            value: totalPlannedIncome,
            color: 'text-emerald-600',
            icon: TrendingUp
          },
          {
            label: 'Actual Income',
            value: totalActualIncome,
            color: 'text-emerald-700',
            icon: TrendingUp
          },
          {
            label: 'Planned Expenses',
            value: totalPlannedExpenses,
            color: 'text-rose-500',
            icon: TrendingDown
          },
          {
            label: 'Actual Expenses',
            value: totalActualExpenses,
            color: 'text-rose-700',
            icon: TrendingDown
          }
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('w-4 h-4', color)} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className={cn('text-xl font-bold', color)}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Income
          </h3>
          {allIncomeCategories.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No income data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[400px]">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100">
                    <th className="px-2 sm:px-4 pb-2">Category</th>
                    <th className="px-2 sm:px-4 pb-2 text-right">Planned</th>
                    <th className="px-2 sm:px-4 pb-2 text-right">Actual</th>
                    <th className="px-2 sm:px-4 pb-2 text-right">Diff</th>
                    <th className="px-2 sm:px-4 pb-2 w-24">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {allIncomeCategories.map(cat => (
                    <ComparisonRow
                      key={cat}
                      category={cat}
                      planned={plannedIncome[cat] || 0}
                      actual={actualIncome[cat] || 0}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expenses */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Expenses
          </h3>
          {allExpenseCategories.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No expense data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[400px]">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100">
                    <th className="px-2 sm:px-4 pb-2">Category</th>
                    <th className="px-2 sm:px-4 pb-2 text-right">Planned</th>
                    <th className="px-2 sm:px-4 pb-2 text-right">Actual</th>
                    <th className="px-2 sm:px-4 pb-2 text-right">Diff</th>
                    <th className="px-2 sm:px-4 pb-2 w-24">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {allExpenseCategories.map(cat => (
                    <ComparisonRow
                      key={cat}
                      category={cat}
                      planned={plannedExpenses[cat] || 0}
                      actual={actualExpenses[cat] || 0}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
