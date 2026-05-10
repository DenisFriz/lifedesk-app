import { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { ChartNoAxesCombined, TrendingUp, TrendingDown } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/components/utils/formatters'
import { subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

const COLORS = [
  '#6366f1',
  '#10b981',
  '#ec4899',
  '#f59e0b',
  '#f43f5e',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#8b5cf6',
  '#84cc16'
]

function useDateRange(period) {
  const now = new Date()
  if (period === 'this_month')
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }
  if (period === 'last_month')
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0)
    }
  if (period === 'this_year')
    return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) }
  if (period === '3months') return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) }
  if (period === '6months') return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) }
  if (period === '1year') return { start: startOfDay(subYears(now, 1)), end: endOfDay(now) }
  return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) }
}

type Income = {
  id: string
  amount: number
  date: string
  category?: string
  business_id?: string | number
  title?: string
}

type Expense = {
  id: string
  amount: number
  date: string
  category?: string
  business_id?: string | number
  title?: string
}

type Business = {
  id: string | number
  name: string
}

export default function Analytics() {
  const [period, setPeriod] = useState('this_month')
  const [drillCategory, setDrillCategory] = useState(null)

  const { data: income = [] } = useQuery<Income[]>({
    queryKey: ['income'],
    queryFn: () => backend.entities.Income.list('-date') as Promise<Income[]>
  })

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => backend.entities.Expense.list('-date') as Promise<Expense[]>
  })

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order') as Promise<Business[]>
  })

  const { start, end } = useDateRange(period)

  const filteredIncome = useMemo(
    () =>
      income.filter(i => {
        const d = new Date(i.date)
        return d >= start && d <= end
      }),
    [income, start, end]
  )
  const filteredExpenses = useMemo(
    () =>
      expenses.filter(e => {
        const d = new Date(e.date)
        return d >= start && d <= end
      }),
    [expenses, start, end]
  )

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {}

    filteredExpenses.forEach(e => {
      const c = e.category || 'Uncategorized'

      map[c] = (map[c] || 0) + (e.amount || 0)
    })

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses])

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {}

    filteredIncome.forEach(i => {
      const c = i.category || 'Uncategorized'
      map[c] = (map[c] || 0) + (i.amount || 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredIncome])

  const expenseByLifeArea = useMemo(() => {
    const map: Record<string, number> = {}

    filteredExpenses.forEach(e => {
      const area = e.business_id
        ? businesses.find(b => String(b.id) === String(e.business_id))?.name || 'Business'
        : 'Personal'
      map[area] = (map[area] || 0) + (e.amount || 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses, businesses])

  const cashflowTrend = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const mEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const inc = income
        .filter(x => {
          const d = new Date(x.date)
          return d >= mStart && d <= mEnd
        })
        .reduce((s, x) => s + (x.amount || 0), 0)
      const exp = expenses
        .filter(x => {
          const d = new Date(x.date)
          return d >= mStart && d <= mEnd
        })
        .reduce((s, x) => s + (x.amount || 0), 0)
      months.push({
        month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        income: inc,
        expenses: exp,
        cashflow: inc - exp
      })
    }
    return months
  }, [income, expenses])

  // Drill-down: transactions for a clicked category
  const drillTransactions = useMemo(() => {
    if (!drillCategory) return []

    return [
      ...filteredIncome
        .filter(i => (i.category || 'Uncategorized') === drillCategory)
        .map(i => ({ ...i, type: 'income' as const })),

      ...filteredExpenses
        .filter(e => (e.category || 'Uncategorized') === drillCategory)
        .map(e => ({ ...e, type: 'expense' as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [drillCategory, filteredIncome, filteredExpenses])

  const [incomeGroupBy, setIncomeGroupBy] = useState('categories')
  const [expenseGroupBy, setExpenseGroupBy] = useState('categories')

  const incomeByLifeArea = useMemo(() => {
    const map: Record<string, number> = {}
    filteredIncome.forEach(i => {
      const area = i.business_id
        ? businesses.find(b => String(b.id) === String(i.business_id))?.name || 'Business'
        : 'Personal'
      map[area] = (map[area] || 0) + (i.amount || 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredIncome, businesses])

  const incomeData = incomeGroupBy === 'categories' ? incomeByCategory : incomeByLifeArea
  const expenseData = expenseGroupBy === 'categories' ? expenseByCategory : expenseByLifeArea

  const PiePanel = ({ data, title, icon, groupBy, setGroupBy }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <Tabs value={groupBy} onValueChange={setGroupBy} className="mb-4">
        <TabsList className="grid w-64 grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="life_areas">Life Areas</TabsTrigger>
        </TabsList>
      </Tabs>
      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-slate-500">
          No data for this period
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 overflow-y-auto max-h-[320px]">
            {data.map((item, index) => {
              const total = data.reduce((sum, d) => sum + d.value, 0)
              const percentage = ((item.value / total) * 100).toFixed(0)
              return (
                <button
                  key={item.name}
                  onClick={() => setDrillCategory(item.name === drillCategory ? null : item.name)}
                  className={cn(
                    'w-full flex items-start gap-3 text-left px-2 py-1.5 rounded-lg transition-colors hover:bg-slate-50',
                    item.name === drillCategory && 'bg-indigo-50'
                  )}
                >
                  <div
                    className="w-5 h-5 rounded flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">
                      {percentage}% - {item.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatCurrency(item.value)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  onClick={entry =>
                    setDrillCategory(entry.name === drillCategory ? null : entry.name)
                  }
                  style={{ cursor: 'pointer' }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke={entry.name === drillCategory ? '#1e293b' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={v => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left flex items-center justify-center lg:justify-start gap-3">
              <ChartNoAxesCombined className="w-8 h-8 sm:w-9 sm:h-9" />
              Analytics
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 text-center lg:text-left">
              Calculated automatically from your transactions. Spending and income breakdowns by
              category and life area.
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="1year">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Drill-down panel */}
        {drillCategory && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-indigo-900">Transactions: {drillCategory}</h3>
              <button
                onClick={() => setDrillCategory(null)}
                className="text-xs text-indigo-600 underline"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {drillTransactions.length === 0 ? (
                <p className="text-sm text-indigo-400">No transactions found.</p>
              ) : (
                drillTransactions.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-indigo-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-400">{t.date?.slice(0, 10)}</p>
                    </div>
                    <span
                      className={cn(
                        'font-semibold text-sm',
                        t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PiePanel
              data={incomeData}
              title="Income by"
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              groupBy={incomeGroupBy}
              setGroupBy={setIncomeGroupBy}
            />
            <PiePanel
              data={expenseData}
              title="Expenses by"
              icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
              groupBy={expenseGroupBy}
              setGroupBy={setExpenseGroupBy}
            />
          </div>

          {/* Cashflow Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Cashflow Trend (12 Months)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cashflowTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={v => formatCurrency(v).replace(/[€$£]/g, '')} />
                <Tooltip formatter={v => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  name="Income"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  name="Expenses"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cashflow"
                  stroke="#6366f1"
                  name="Net"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
