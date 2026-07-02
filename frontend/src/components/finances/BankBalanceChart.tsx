import { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  format,
  eachDayOfInterval,
  subDays,
  subMonths,
  getYear,
  startOfYear,
  startOfMonth,
  endOfMonth
} from 'date-fns'
import {
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select'
import { formatCurrency } from '@/components/utils/formatters'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOfflineAccountSnapshotsQuery } from '@/hooks/offlineaccountsnapshot/useOfflineAccountSnapshots'
import { useOfflineAccountsQuery } from '@/hooks/offlineaccounts/useOfflineAccountsQuery'

type ChartRow = {
  date: string
  connectedBank?: number
  offlineBalance?: number
  total?: number
  bankSpending?: number
}

function buildChartData({
  allSnapshots,
  offlineSnapshots,
  bankSnapshots,
  income,
  expenses,
  selectedAccount,
  rangeStart,
  rangeEnd
}: {
  allSnapshots: any[]
  offlineSnapshots: any[]
  bankSnapshots: any[]
  income: any[]
  expenses: any[]
  selectedAccount: string
  rangeStart: Date
  rangeEnd: Date
}) {
  const rangeStartStr = format(rangeStart, 'yyyy-MM-dd')

  // Separate bank vs offline account IDs
  const bankAccountIds = [...new Set(bankSnapshots.map(s => s.account_id))]
  const offlineAccountIds = [
    ...new Set(offlineSnapshots.map(s => s.account_id).map(id => `offline_${id}`))
  ]

  // Build snapshot date maps
  const bankSnapshotMap = {} // { date: { accountId: balance } }
  bankSnapshots.forEach(s => {
    if (!bankSnapshotMap[s.date]) bankSnapshotMap[s.date] = {}
    bankSnapshotMap[s.date][s.account_id] = s.balance
  })

  const offlineSnapshotMap = {} // { date: { 'offline_'+accountId: balance } }
  offlineSnapshots.forEach(s => {
    const key = `offline_${s.account_id}`
    if (!offlineSnapshotMap[s.date]) offlineSnapshotMap[s.date] = {}
    offlineSnapshotMap[s.date][key] = s.balance
  })

  // Bank spending by day (Plaid-imported expenses only)
  const bankExpensesByDay: Record<string, number> = {}
  expenses
    .filter(e => e.bank_account_name)
    .forEach(e => {
      const d = e.date?.slice(0, 10)
      if (!d) return
      bankExpensesByDay[d] = (bankExpensesByDay[d] || 0) + (e.amount || 0)
    })

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  const lastKnownBank = {}
  const lastKnownOffline = {}

  return days.map(day => {
    const key = format(day, 'yyyy-MM-dd')

    // Carry forward bank balances
    bankAccountIds.forEach(id => {
      if (bankSnapshotMap[key]?.[id] !== undefined) lastKnownBank[id] = bankSnapshotMap[key][id]
    })

    // Carry forward offline balances
    offlineAccountIds.forEach(id => {
      if (offlineSnapshotMap[key]?.[id] !== undefined)
        lastKnownOffline[id] = offlineSnapshotMap[key][id]
    })

    const row: ChartRow = { date: format(day, 'MMM dd') }

    // Add bank spending for this day
    if (bankExpensesByDay[key]) row.bankSpending = bankExpensesByDay[key]

    if (selectedAccount === 'all') {
      // All accounts combined
      const bankTotal = bankAccountIds.reduce((s, id) => s + (lastKnownBank[id] ?? 0), 0)
      const offlineTotal = offlineAccountIds.reduce((s, id) => s + (lastKnownOffline[id] ?? 0), 0)
      const hasBankData = bankAccountIds.some(id => lastKnownBank[id] !== undefined)
      const hasOfflineData = offlineAccountIds.some(id => lastKnownOffline[id] !== undefined)

      console.log(
        'bankTotal',
        bankTotal,
        'offlineTotal',
        offlineTotal,
        'hasBankData',
        hasBankData,
        'hasOfflineData',
        hasOfflineData
      )
      row.connectedBank = hasBankData ? parseFloat(bankTotal.toFixed(2)) : undefined
      row.offlineBalance = hasOfflineData ? parseFloat(offlineTotal.toFixed(2)) : undefined
      row.total = parseFloat(
        ((hasBankData ? bankTotal : 0) + (hasOfflineData ? offlineTotal : 0)).toFixed(2)
      )
    } else if (selectedAccount === 'all_bank') {
      const bankTotal = bankAccountIds.reduce((s, id) => s + (lastKnownBank[id] ?? 0), 0)
      const hasBankData = bankAccountIds.some(id => lastKnownBank[id] !== undefined)
      row.connectedBank = hasBankData ? parseFloat(bankTotal.toFixed(2)) : undefined
    } else if (selectedAccount === 'all_offline') {
      const offlineTotal = offlineAccountIds.reduce((s, id) => s + (lastKnownOffline[id] ?? 0), 0)
      const hasOfflineData = offlineAccountIds.some(id => lastKnownOffline[id] !== undefined)
      row.offlineBalance = hasOfflineData ? parseFloat(offlineTotal.toFixed(2)) : undefined
    } else if (selectedAccount.startsWith('offline_')) {
      const val = lastKnownOffline[selectedAccount]
      row.offlineBalance = val !== undefined ? parseFloat(val.toFixed(2)) : undefined
    } else {
      // Single connected bank account
      const val = lastKnownBank[selectedAccount]
      row.connectedBank = val !== undefined ? parseFloat(val.toFixed(2)) : undefined
    }

    return row
  })
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm space-y-1">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

const TIME_PERIOD_OPTIONS = (() => {
  const now = new Date()
  const currentYear = getYear(now)
  const opts = [
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'last_12', label: 'Last 12 Months' },
    { value: 'last_24', label: 'Last 2 Years' },
    { value: 'all_time', label: 'All Time' }
  ]
  for (let y = currentYear - 1; y >= currentYear - 5; y--) {
    opts.push({ value: String(y), label: String(y) })
  }
  return opts
})()

export { TIME_PERIOD_OPTIONS }

function resolveRange(period) {
  const now = new Date()
  const currentYear = getYear(now)
  if (period === 'this_month') {
    return { rangeStart: startOfMonth(now), rangeEnd: now }
  }
  if (period === 'last_month') {
    const lastMonth = subMonths(now, 1)
    return { rangeStart: startOfMonth(lastMonth), rangeEnd: endOfMonth(lastMonth) }
  }
  if (period === 'this_year') return { rangeStart: startOfYear(now), rangeEnd: now }
  if (period === 'last_year') {
    const y = currentYear - 1
    return { rangeStart: new Date(y, 0, 1), rangeEnd: new Date(y, 11, 31) }
  }
  if (period === 'last_12') return { rangeStart: subMonths(now, 12), rangeEnd: now }
  if (period === 'last_24') return { rangeStart: subMonths(now, 24), rangeEnd: now }
  if (period === 'all_time') return { rangeStart: new Date(2010, 0, 1), rangeEnd: now }
  if (/^\d{4}$/.test(period)) {
    const y = parseInt(period)
    return { rangeStart: new Date(y, 0, 1), rangeEnd: new Date(y, 11, 31) }
  }
  return { rangeStart: subDays(now, 30), rangeEnd: now }
}

export { resolveRange }

type BankBalanceSnapshot = {
  id: string
  account_id: string
  account_name?: string
  balance: number
  date: string
}

export default function BankBalanceChart({
  income = [],
  expenses = []
}: {
  income?: any[]
  expenses?: any[]
}) {
  const queryClient = useQueryClient()
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [timePeriod, setTimePeriod] = useState('this_year')

  const { data: bankSnapshots = [], isLoading: isBankLoading } = useQuery<BankBalanceSnapshot[]>({
    queryKey: ['bankBalanceSnapshots', 2000],
    queryFn: () =>
      backend.entities.BankBalanceSnapshot.list('-date', 2000) as Promise<BankBalanceSnapshot[]>
  })

  const { data: offlineSnapshotsRaw = [], isLoading: isOfflineSnapshotsLoading } =
    useOfflineAccountSnapshotsQuery()

  const { data: offlineAccounts = [], isLoading: isOfflineAccountsLoading } =
    useOfflineAccountsQuery()

  const snapshotMutation = useMutation({
    mutationFn: () => backend.functions.invoke('plaid', { action: 'snapshot_balances' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bankBalanceSnapshots'] })
  })

  // Build lists for the dropdown
  const connectedBankAccounts = useMemo(() => {
    const seen = new Map()
    bankSnapshots.forEach(s => {
      if (!seen.has(s.account_id)) seen.set(s.account_id, s.account_name || s.account_id)
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [bankSnapshots])

  const offlineAccountOptions = useMemo(() => {
    return offlineAccounts.map(a => ({ id: `offline_${a.id}`, name: a.name }))
  }, [offlineAccounts])

  const { rangeStart, rangeEnd } = useMemo(() => resolveRange(timePeriod), [timePeriod])

  const chartData = useMemo(
    () =>
      buildChartData({
        allSnapshots: [
          ...bankSnapshots,
          ...offlineSnapshotsRaw.map(s => ({ ...s, account_id: `offline_${s.account_id}` }))
        ],
        offlineSnapshots: offlineSnapshotsRaw,
        bankSnapshots,
        income,
        expenses,
        selectedAccount,
        rangeStart,
        rangeEnd
      }),
    [bankSnapshots, offlineSnapshotsRaw, income, expenses, selectedAccount, rangeStart, rangeEnd]
  )

  const hasData =
    bankSnapshots.length > 0 ||
    offlineSnapshotsRaw.length > 0 ||
    income.length > 0 ||
    expenses.length > 0
  const showBank = chartData.some(d => d.connectedBank !== undefined)
  const showOffline = chartData.some(d => d.offlineBalance !== undefined)
  const showTotal = chartData.some(d => d.total !== undefined)
  const showBankSpending = expenses.some(e => e.bank_account_name)

  const maxLabelCount = 12
  const interval =
    chartData.length > maxLabelCount ? Math.floor(chartData.length / maxLabelCount) : 0

  const hasDropdownOptions = connectedBankAccounts.length > 0 || offlineAccountOptions.length > 0

  const isLoading = isBankLoading || isOfflineSnapshotsLoading || isOfflineAccountsLoading
  return (
    <div>
      <div className="flex flex-col min-[580px]:flex-row items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Balance Over Time</h2>
        <div className="flex flex-col min-[580px]:flex-row items-center gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIOD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasDropdownOptions && (
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {connectedBankAccounts.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Connected Bank</SelectLabel>
                    <SelectItem value="all_bank">All Connected Accounts</SelectItem>
                    {connectedBankAccounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {offlineAccountOptions.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Offline Accounts</SelectLabel>
                    <SelectItem value="all_offline">All Offline Accounts</SelectItem>
                    {offlineAccountOptions.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => snapshotMutation.mutate()}
            disabled={snapshotMutation.isPending}
            title="Refresh bank balances"
          >
            <RefreshCw className={`w-4 h-4 ${snapshotMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {!hasData && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-1 text-center">
          <p>No data yet.</p>
          <p className="text-xs">
            Connect a bank account or add offline accounts to see your balance over time.
          </p>
        </div>
      ) : isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          Loading...
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
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
            {showBankSpending && (
              <YAxis
                yAxisId="spending"
                orientation="right"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={v => formatCurrency(v)}
                width={80}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={28} />

            {showTotal && (
              <Line
                type="monotone"
                dataKey="total"
                name="Total Balance"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls
              />
            )}
            {showBank && (
              <Line
                type="monotone"
                dataKey="connectedBank"
                name="Connected Bank Balance"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            )}
            {showOffline && (
              <Line
                type="monotone"
                dataKey="offlineBalance"
                name="Offline Balance"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            )}
            {showBankSpending && (
              <Bar
                yAxisId="spending"
                dataKey="bankSpending"
                name="Bank Spending"
                fill="#f87171"
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
