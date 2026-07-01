import { useState, useMemo, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Pencil, Trash2 } from 'lucide-react'
import { format, subMonths, getYear } from 'date-fns'
import { useOfflineAccountSnapshotMutations } from '@/hooks/offlineaccountsnapshot/useOfflineAccountSnapshotMutations'
import { CreateOfflineAccountSnapshotInput } from '@/repositories/offline-account-snapshot.repository'
import { OfflineAccountSnapshotRecord } from '@/db'
import { useOfflineAccountSnapshotsQuery } from '@/hooks/offlineaccountsnapshot/useOfflineAccountSnapshots'

function formatAmt(val, currency = 'EUR') {
  if (val == null || val === '') return ''
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(val)
}

function buildFilterOptions(allMonths) {
  const now = new Date()
  const currentYear = getYear(now)
  const options = [
    { value: 'this_year', label: 'This Year' },
    { value: 'last_12', label: 'Last 12 Months' },
    { value: 'last_24', label: 'Last 2 Years' }
  ]
  // Add individual years from current-1 down to 5 years back
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
    for (let mo = 1; mo <= 12; mo++) {
      months.push(`${currentYear}-${String(mo).padStart(2, '0')}`)
    }
    return months
  }
  if (filter === 'last_12') {
    const months = []
    for (let i = 11; i >= -2; i--) {
      months.push(format(subMonths(now, i), 'yyyy-MM'))
    }
    return months
  }
  if (filter === 'last_24') {
    const months = []
    for (let i = 23; i >= -2; i--) {
      months.push(format(subMonths(now, i), 'yyyy-MM'))
    }
    return months
  }
  // specific year like '2024'
  if (/^\d{4}$/.test(filter)) {
    const months = []
    for (let mo = 1; mo <= 12; mo++) {
      months.push(`${filter}-${String(mo).padStart(2, '0')}`)
    }
    return months
  }
  return []
}

function MonthCell({
  account,
  monthKey,
  snapshot,
  prevSnapshot,
  onSave,
  onDelete,
  readOnly
}: {
  account: any
  monthKey: string
  snapshot: any
  prevSnapshot: any
  onSave: (args: { monthKey: string; balance: number; existingId?: string }) => void
  onDelete: (id: string) => void
  readOnly: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    if (readOnly) return
    setValue(snapshot ? String(snapshot.balance) : '')
    setEditing(true)
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const cancel = () => setEditing(false)

  const save = () => {
    const num = parseFloat(String(value).replace(',', '.'))
    if (isNaN(num)) {
      cancel()
      return
    }
    onSave({ monthKey, balance: num, existingId: snapshot?.id })
    setEditing(false)
  }

  const handleKey = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') cancel()
  }

  const change = snapshot && prevSnapshot ? snapshot.balance - prevSnapshot.balance : null

  const monthLabel = (() => {
    const [y, m] = monthKey.split('-')
    const d = new Date(parseInt(y), parseInt(m) - 1, 1)
    return format(d, 'MMM yy')
  })()

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 group">
      <td
        className={`py-2 px-3 text-sm text-right w-24 ${!snapshot ? 'text-slate-400' : 'text-slate-600 font-medium'}`}
      >
        {monthLabel}
      </td>
      <td className="py-2 px-3 text-right w-40">
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            step="0.01"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            onBlur={save}
            className="w-full text-sm text-right font-medium text-slate-900 bg-indigo-50 border border-indigo-300 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-400"
          />
        ) : (
          <div
            className={`flex items-center justify-end gap-1 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={startEdit}
          >
            <span
              className={`text-sm ${snapshot ? 'text-slate-900 font-medium' : 'text-slate-300 italic text-xs'}`}
            >
              {snapshot
                ? formatAmt(snapshot.balance, account.currency)
                : readOnly
                  ? ''
                  : 'click to add'}
            </span>
            {snapshot && !readOnly && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-3 h-3 text-slate-400" />
              </span>
            )}
          </div>
        )}
      </td>
      <td className="py-2 px-3 text-right w-36">
        {change !== null && (
          <span
            className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${
              change >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {change >= 0 ? '+' : ''}
            {formatAmt(change, account.currency)}
          </span>
        )}
      </td>
      <td className="py-2 px-2 w-8 text-center">
        {snapshot && !readOnly && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(snapshot.id)}
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
          </Button>
        )}
      </td>
    </tr>
  )
}

export default function OfflineAccountMonthlyTable({
  account,
  readOnly = false
}: {
  account: any
  readOnly?: boolean
}) {
  const [filter, setFilter] = useState('this_year')

  const { data: allSnapshots = [] } = useOfflineAccountSnapshotsQuery()

  const { createMutation, updateMutation, deleteMutation } = useOfflineAccountSnapshotMutations()

  const handleCreateAccountSnapshot = async (data: CreateOfflineAccountSnapshotInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateAccountSnapshot = async ({
    id,
    data
  }: {
    id: string
    data: Partial<OfflineAccountSnapshotRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteAccountSnapshot = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    }
  }

  const snapshots = useMemo(
    () => allSnapshots.filter(s => s.account_id === account.id),
    [allSnapshots, account.id]
  )

  const filterOptions = useMemo(() => buildFilterOptions([]), [])
  const months = useMemo(() => applyFilter(filter), [filter])

  // Map monthKey -> snapshot
  const snapshotMap = useMemo(() => {
    const map = {}
    snapshots.forEach(s => {
      const key = s.date.slice(0, 7)
      if (!map[key] || s.date > map[key].date) map[key] = s
    })
    return map
  }, [snapshots])

  // Returns the last known snapshot at or before a given monthKey (scanning backwards through all snapshots)
  const getLastKnownSnapshot = useMemo(() => {
    const sortedKeys = Object.keys(snapshotMap).sort()
    return beforeMonthKey => {
      // Find the latest key that is strictly less than beforeMonthKey
      const candidates = sortedKeys.filter(k => k < beforeMonthKey)
      if (candidates.length === 0) return null
      return snapshotMap[candidates[candidates.length - 1]]
    }
  }, [snapshotMap])

  // Calculate sum of changes in the visible range, using last known snapshot when there are gaps
  const changeSum = useMemo(() => {
    let total = 0
    let hasAny = false
    months.forEach(monthKey => {
      const snap = snapshotMap[monthKey]
      if (!snap) return
      const prevSnap = getLastKnownSnapshot(monthKey)
      if (prevSnap) {
        total += snap.balance - prevSnap.balance
        hasAny = true
      }
    })
    return hasAny ? total : null
  }, [months, snapshotMap, getLastKnownSnapshot])

  const saveMutation = useMutation({
    mutationFn: async ({
      monthKey,
      balance,
      existingId
    }: {
      monthKey: string
      balance: number
      existingId?: string
    }) => {
      const date = `${monthKey}-01`
      if (existingId) {
        return handleUpdateAccountSnapshot({ id: existingId, data: { balance, date } })
      }
      return handleCreateAccountSnapshot({
        account_id: account.id,
        currency: account.currency || 'EUR',
        date,
        balance
      })
    }
  })

  return (
    <div className="overflow-x-auto">
      {/* Filter bar */}
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
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {months.map(monthKey => {
            const snap = snapshotMap[monthKey] || null
            // Use last known snapshot before this month (handles gaps)
            const prevSnap = snap ? getLastKnownSnapshot(monthKey) : null
            return (
              <MonthCell
                key={monthKey}
                account={account}
                monthKey={monthKey}
                snapshot={snap}
                prevSnapshot={prevSnap}
                onSave={args => saveMutation.mutate(args)}
                onDelete={id => handleDeleteAccountSnapshot(id)}
                readOnly={readOnly}
              />
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
                  {formatAmt(changeSum, account.currency)}
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
