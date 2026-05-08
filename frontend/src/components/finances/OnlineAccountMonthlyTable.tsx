import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { format, subMonths, getYear } from 'date-fns'

function formatAmt(val, currency = 'EUR') {
  if (val == null || val === '') return ''
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(val)
}

function buildFilterOptions() {
  const now = new Date()
  const currentYear = getYear(now)
  const options = [
    { value: 'this_year', label: 'This Year' },
    { value: 'last_12', label: 'Last 12 Months' },
    { value: 'last_24', label: 'Last 2 Years' }
  ]
  for (let y = currentYear - 1; y >= currentYear - 5; y--) {
    options.push({ value: String(y), label: String(y) })
  }
  return options
}

function applyFilter(filter) {
  const now = new Date()
  const currentYear = getYear(now)
  if (filter === 'this_year') {
    const months = []
    for (let mo = 1; mo <= 12; mo++) months.push(`${currentYear}-${String(mo).padStart(2, '0')}`)
    return months
  }
  if (filter === 'last_12') {
    const months = []
    for (let i = 11; i >= -1; i--) months.push(format(subMonths(now, i), 'yyyy-MM'))
    return months
  }
  if (filter === 'last_24') {
    const months = []
    for (let i = 23; i >= -1; i--) months.push(format(subMonths(now, i), 'yyyy-MM'))
    return months
  }
  if (/^\d{4}$/.test(filter)) {
    const months = []
    for (let mo = 1; mo <= 12; mo++) months.push(`${filter}-${String(mo).padStart(2, '0')}`)
    return months
  }
  return []
}

const filterOptions = buildFilterOptions()

export default function OnlineAccountMonthlyTable({ account }: { account: any }) {
  const [filter, setFilter] = useState('this_year')

  const { data: allSnapshots = [] } = useQuery({
    queryKey: ['bankBalanceSnapshots'],
    queryFn: () => backend.entities.BankBalanceSnapshot.list('-date', 2000)
  })

  const snapshots = useMemo(
    () => allSnapshots.filter(s => s.account_id === account.account_id),
    [allSnapshots, account.account_id]
  )

  const months = useMemo(() => applyFilter(filter), [filter])

  // Map monthKey -> latest snapshot in that month
  const snapshotMap = useMemo(() => {
    const map = {}
    snapshots.forEach(s => {
      const key = s.date.slice(0, 7)
      if (!map[key] || s.date > map[key].date) map[key] = s
    })
    return map
  }, [snapshots])

  const prevMonthOfFirst =
    months.length > 0 ? format(subMonths(new Date(months[0] + '-01'), 1), 'yyyy-MM') : null

  const changeSum = useMemo(() => {
    let total = 0
    let hasAny = false
    months.forEach((monthKey, i) => {
      const snap = snapshotMap[monthKey]
      const prevKey = i === 0 ? prevMonthOfFirst : months[i - 1]
      const prevSnap = prevKey ? snapshotMap[prevKey] : null
      if (snap && prevSnap) {
        total += snap.balance - prevSnap.balance
        hasAny = true
      }
    })
    return hasAny ? total : null
  }, [months, snapshotMap, prevMonthOfFirst])

  const currency = account.currency || 'EUR'

  return (
    <div className="overflow-x-auto">
      <div className="px-3 py-2 border-b border-slate-100">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-7 text-xs w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Date
            </th>
            <th className="py-2 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Balance
            </th>
            <th className="py-2 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {months.map((monthKey, i) => {
            const snap = snapshotMap[monthKey] || null
            const prevKey = i === 0 ? prevMonthOfFirst : months[i - 1]
            const prevSnap = prevKey ? snapshotMap[prevKey] || null : null
            const change = snap && prevSnap ? snap.balance - prevSnap.balance : null
            const isNextMonth = monthKey > format(new Date(), 'yyyy-MM')

            const [y, m] = monthKey.split('-')
            const monthLabel = format(new Date(parseInt(y), parseInt(m) - 1, 1), 'MMM yy')

            return (
              <tr key={monthKey} className="border-b border-slate-100">
                <td
                  className={`py-2 px-3 text-sm text-right w-24 ${!snap ? 'text-slate-400' : 'text-slate-600 font-medium'}`}
                >
                  {monthLabel}
                </td>
                <td className="py-2 px-3 text-right w-40">
                  <span
                    className={`text-sm ${snap ? 'text-slate-900 font-medium' : 'text-slate-300 italic text-xs'}`}
                  >
                    {snap ? formatAmt(snap.balance, currency) : isNextMonth ? '' : '—'}
                  </span>
                </td>
                <td className="py-2 px-3 text-right w-36">
                  {change !== null && (
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${
                        change >= 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {change >= 0 ? '+' : ''}
                      {formatAmt(change, currency)}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        {changeSum !== null && (
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td className="py-2 px-3 text-xs text-slate-500 text-right font-semibold uppercase">
                Total
              </td>
              <td />
              <td className="py-2 px-3 text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-sm font-semibold ${
                    changeSum >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {changeSum >= 0 ? '+' : ''}
                  {formatAmt(changeSum, currency)}
                </span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
