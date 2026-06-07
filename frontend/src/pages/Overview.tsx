import { useMemo, useState, useEffect, useRef } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Wallet as WalletIcon } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercent } from '@/components/utils/formatters'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  PiggyBank,
  Percent,
  Package
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'

type Income = {
  id: string
  date: string
  amount: number
  is_deleted?: boolean
  category?: string
}

export default function Overview() {
  const [period, setPeriod] = useState('this_month')
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef(null)

  useEffect(() => {
    if (!headerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    )
    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  const { data: income = [] } = useQuery<Income[]>({
    queryKey: ['income'],
    queryFn: async () => {
      return backend.entities.Income.list('-date') as Promise<Income[]>
    }
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => backend.entities.Expense.list('-date')
  })

  const { data: recurringIncome = [] } = useQuery({
    queryKey: ['recurringIncome'],
    queryFn: () => backend.entities.RecurringIncome.list()
  })

  const { data: recurringExpenses = [] } = useQuery({
    queryKey: ['recurringExpenses'],
    queryFn: () => backend.entities.RecurringExpense.list()
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['tangibleAssets'],
    queryFn: () => backend.entities.TangibleAsset.list()
  })

  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    let start, end

    if (period === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (period === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (period === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31)
    } else if (period === 'last_year') {
      start = new Date(now.getFullYear() - 1, 0, 1)
      end = new Date(now.getFullYear() - 1, 11, 31)
    }

    return { startDate: start, endDate: end }
  }, [period])

  const filteredIncome = income.filter(i => {
    const date = new Date(i.date)
    return date >= startDate && date <= endDate
  })

  const filteredExpenses = expenses.filter(e => {
    const date = new Date(e.date)
    return date >= startDate && date <= endDate
  })

  const actualIncome = filteredIncome.reduce((sum, i) => sum + (i.amount || 0), 0)
  const actualExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const actualCashflow = actualIncome - actualExpenses

  const activeRecurringIncome = recurringIncome.filter(r => r.active !== false)
  const activeRecurringExpenses = recurringExpenses.filter(r => r.active !== false)

  const calculateMonthlyRecurring = (amount, frequency) => {
    const multipliers = { weekly: 4.33, biweekly: 2.17, monthly: 1, quarterly: 0.33, yearly: 0.083 }
    return amount * (multipliers[frequency] || 1)
  }

  const plannedIncome = activeRecurringIncome.reduce(
    (sum, r) => sum + calculateMonthlyRecurring(r.amount, r.frequency),
    0
  )
  const plannedExpenses = activeRecurringExpenses.reduce(
    (sum, r) => sum + calculateMonthlyRecurring(r.amount, r.frequency),
    0
  )
  const plannedCashflow = plannedIncome - plannedExpenses
  const budgetRemaining = plannedCashflow - actualCashflow

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0)
  const totalAssetCost = assets.reduce((sum, a) => sum + (a.purchase_price || 0), 0)
  const unrealizedGain = totalAssetValue - totalAssetCost
  const netWorth = totalAssetValue + actualCashflow

  const savingsRate = actualIncome > 0 ? (actualCashflow / actualIncome) * 100 : 0

  const netWorthBreakdown = [
    { name: 'Liquid Cash', value: actualCashflow > 0 ? actualCashflow : 0 },
    { name: 'Physical Assets', value: totalAssetValue }
  ].filter(item => item.value > 0)

  const categoryComparison = useMemo(() => {
    const categories = new Set([
      ...filteredExpenses.map(e => e.category || 'Uncategorized'),
      ...activeRecurringExpenses.map(r => r.category || 'Uncategorized')
    ])

    return Array.from(categories)
      .map(cat => {
        const actual = filteredExpenses
          .filter(e => (e.category || 'Uncategorized') === cat)
          .reduce((sum, e) => sum + (e.amount || 0), 0)

        const planned = activeRecurringExpenses
          .filter(r => (r.category || 'Uncategorized') === cat)
          .reduce((sum, r) => sum + calculateMonthlyRecurring(r.amount, r.frequency), 0)

        return { category: cat, actual, planned }
      })
      .filter(item => item.actual > 0 || item.planned > 0)
      .sort((a, b) => b.actual + b.planned - (a.actual + a.planned))
      .slice(0, 8)
  }, [filteredExpenses, activeRecurringExpenses])

  const cashflowTrend = useMemo(() => {
    const months = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthIncome = income
        .filter(inc => {
          const d = new Date(inc.date)
          return d >= monthStart && d <= monthEnd
        })
        .reduce((sum, inc) => sum + (inc.amount || 0), 0)

      const monthExpenses = expenses
        .filter(exp => {
          const d = new Date(exp.date)
          return d >= monthStart && d <= monthEnd
        })
        .reduce((sum, exp) => sum + (exp.amount || 0), 0)

      months.push({
        month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        income: monthIncome,
        expenses: monthExpenses,
        cashflow: monthIncome - monthExpenses
      })
    }

    return months
  }, [income, expenses])

  const topAssets = [...assets]
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .slice(0, 5)

  const COLORS = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#14b8a6',
    '#f97316'
  ]

  return (
    <>
      <Helmet>
        <title>Overview | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="overview-sticky-title text-sm font-normal text-slate-900 text-center">
                  Financial Overview
                </h1>
              </div>
            </div>
          )}
          <div
            ref={headerRef}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6 sm:py-8"
          >
            <div>
              <h1 className="overview-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left flex items-center justify-center lg:justify-start gap-3">
                <WalletIcon className="w-8 h-8 sm:w-9 sm:h-9" />
                Financial Overview
              </h1>
              <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left mt-1">
                Budget, transactions, and assets dashboard
              </p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Net Worth</span>
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
              <p
                className={cn(
                  'text-2xl font-bold',
                  netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {formatCurrency(netWorth)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Assets + Liquid Cash</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Actual Cashflow</span>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p
                className={cn(
                  'text-2xl font-bold',
                  actualCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {formatCurrency(actualCashflow)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Income - Expenses (Actual)</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Budget Remaining</span>
                <PiggyBank className="w-5 h-5 text-amber-600" />
              </div>
              <p
                className={cn(
                  'text-2xl font-bold',
                  budgetRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {formatCurrency(Math.abs(budgetRemaining))}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {budgetRemaining >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Savings Rate</span>
                <Percent className="w-5 h-5 text-emerald-600" />
              </div>
              <p
                className={cn(
                  'text-2xl font-bold',
                  savingsRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {formatPercent(savingsRate)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Cashflow / Income</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="overview-networth-title text-lg font-semibold text-slate-900 mb-4">
                Net Worth Breakdown
              </h3>
              {netWorthBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={netWorthBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {netWorthBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) =>
                          formatCurrency(typeof value === 'number' ? value : 0)
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {netWorthBreakdown.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-slate-700">{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-center py-8">No data available</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="overview-budget-comparison-title text-lg font-semibold text-slate-900 mb-4">
                Budget vs Actual by Category
              </h3>
              {categoryComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                    />
                    <YAxis
                      fontSize={11}
                      tickFormatter={value => `${formatCurrency(value).replace(/[€$£]/g, '')}`}
                    />
                    <Tooltip
                      formatter={(value: any) =>
                        formatCurrency(typeof value === 'number' ? value : 0)
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="planned" fill="#94a3b8" name="Planned" />
                    <Bar dataKey="actual" fill="#6366f1" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-8">No category data</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="overview-cashflow-trend-title text-lg font-semibold text-slate-900 mb-4">
              Cashflow Trend (12 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashflowTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis
                  fontSize={11}
                  tickFormatter={value => `${formatCurrency(value).replace(/[€$£]/g, '')}`}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  name="Income (Actual)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  name="Expenses (Actual)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="cashflow"
                  stroke="#6366f1"
                  name="Cashflow"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="overview-assets-title text-lg font-semibold text-slate-900">
                Physical Assets Summary
              </h3>
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Total Value</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(totalAssetValue)}
                </p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Purchase Cost</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAssetCost)}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Unrealized Gain/Loss</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    unrealizedGain >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {unrealizedGain >= 0 ? '+' : ''}
                  {formatCurrency(unrealizedGain)}
                </p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Total Assets</p>
                <p className="text-xl font-bold text-slate-900">{formatNumber(assets.length)}</p>
              </div>
            </div>

            {topAssets.length > 0 && (
              <div>
                <h4 className="overview-topassets-title text-sm font-semibold text-slate-700 mb-3">
                  Top Assets
                </h4>
                <div className="space-y-2">
                  {topAssets.map(asset => {
                    const gain = (asset.current_value || 0) - (asset.purchase_price || 0)
                    return (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{asset.title}</p>
                          <p className="text-xs text-slate-500">
                            {asset.category?.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(asset.current_value || 0)}
                          </p>
                          <p
                            className={cn(
                              'text-xs flex items-center gap-1 justify-end',
                              gain >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            )}
                          >
                            {gain >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {gain >= 0 ? '+' : ''}
                            {formatCurrency(gain)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
