import { useState, useMemo, useEffect, useRef } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  Trash2,
  Coins,
  ChevronDown,
  ChevronUp,
  Activity,
  Lock
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PERSONAL_INCOME_CATEGORIES,
  BUSINESS_INCOME_CATEGORIES,
  PERSONAL_EXPENSE_CATEGORIES,
  BUSINESS_EXPENSE_CATEGORIES
} from '@/components/finances/categories'

import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { cn } from '@/lib/utils'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Link } from 'react-router-dom'
import RecurringIncomeForm from '@/components/finances/RecurringIncomeForm'
import RecurringExpenseForm from '@/components/finances/RecurringExpenseForm'
import { formatCurrency, formatDateMedium } from '@/components/utils/formatters'
import PlannedVsActual from '@/components/finances/PlannedVsActual'
import { Helmet } from 'react-helmet-async'
import { useRecurringIncomesQuery } from '@/hooks/recurringincomes/useRecurringIncomesQuery'
import { useRecurringExpensesQuery } from '@/hooks/recurringexpenses/useRecurringExpensesQuery'
import { CreateRecurringIncomeInput } from '@/repositories/recurring-income.repository'
import { useRecurringIncomesMutations } from '@/hooks/recurringincomes/useRecurringIncomeMutations'
import { useRecurringExpenseMutations } from '@/hooks/recurringexpenses/useRecurringExpenseMutations'
import { CreateRecurringExpenseInput } from '@/repositories/recurring-exprense.repository'
import { RecurringExpenseRecord, RecurringIncomeRecord } from '@/db'
import { useUserLimit } from '@/contexts/UserLimitContext'

type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

const COLORS = [
  '#6366f1',
  '#10b981',
  '#ec4899',
  '#f59e0b',
  '#f43f5e',
  '#14b8a6',
  '#f97316',
  '#3b82f6'
] as const

export default function Budget() {
  const urlParams = new URLSearchParams(window.location.search)
  const businessId = urlParams.get('businessId')
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

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

  const { data: business } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () =>
      businessId ? backend.entities.Business.filter({ id: businessId }).then(b => b[0]) : null,
    enabled: !!businessId
  })
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [incomeSearch, setIncomeSearch] = useState('')
  const [expenseSearch, setExpenseSearch] = useState('')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [incomeSortBy, setIncomeSortBy] = useState('start_date')
  const [incomeSortOrder, setIncomeSortOrder] = useState('desc')
  const [expenseSortBy, setExpenseSortBy] = useState('start_date')
  const [expenseSortOrder, setExpenseSortOrder] = useState('desc')
  const [expenseGroupBy, setExpenseGroupBy] = useState('categories')
  const [incomeGroupBy, setIncomeGroupBy] = useState('categories')
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('budgetActiveTab') || 'income'
  })

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('budgetCollapsed')
    return saved
      ? JSON.parse(saved)
      : { plannedVsActual: false, incomeBy: false, expensesBy: false, recurringIncome: false }
  })

  const toggleCollapsed = (key: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('budgetCollapsed', JSON.stringify(next))
      return next
    })
  }
  const [incomePage, setIncomePage] = useState(1)
  const [incomePerPage, setIncomePerPage] = useState(20)
  const [expensePage, setExpensePage] = useState(1)
  const [expensePerPage, setExpensePerPage] = useState(20)

  const { canCreate, data: userLimits } = useUserLimit()

  const isOverLimit = !canCreate('budgetEntries')

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem('budgetActiveTab', value)
  }

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order')
  })

  const { data: recurringIncome = [] } = useRecurringIncomesQuery({ businessId })

  const { data: recurringExpenses = [] } = useRecurringExpensesQuery({ businessId })

  const {
    createMutation: createRecurringIncome,
    updateMutation: updateRecurringIncome,
    deleteMutation: deleteRecurringIncome
  } = useRecurringIncomesMutations()

  const {
    createMutation: createRecurringExpense,
    updateMutation: updateRecurringExpense,
    deleteMutation: deleteRecurringExpense
  } = useRecurringExpenseMutations()

  const handleCreateRecurringIncome = async (data: CreateRecurringIncomeInput) => {
    try {
      await createRecurringIncome.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowIncomeForm(false)
      setEditingItem(null)
    }
  }

  const handleCreateRecurringExpense = async (data: CreateRecurringExpenseInput) => {
    try {
      await createRecurringExpense.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowExpenseForm(false)
      setEditingItem(null)
    }
  }

  const handleUpdateRecurringIncome = async ({
    id,
    data
  }: {
    id: string
    data: Partial<RecurringIncomeRecord>
  }) => {
    try {
      await updateRecurringIncome.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setEditingField(null)
      setShowIncomeForm(false)
      setEditingItem(null)
    }
  }

  const handleUpdateRecurringExpense = async ({
    id,
    data
  }: {
    id: string
    data: Partial<RecurringExpenseRecord>
  }) => {
    try {
      await updateRecurringExpense.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setEditingField(null)
      setShowExpenseForm(false)
      setEditingItem(null)
    }
  }

  const handleDeleteRecurringIncome = async (id: string) => {
    try {
      await deleteRecurringIncome.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setShowIncomeForm(false)
      setEditingItem(null)
    }
  }

  const handleDeleteRecurringExpense = async (id: string) => {
    try {
      await deleteRecurringExpense.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setShowExpenseForm(false)
      setEditingItem(null)
    }
  }

  /*   const deleteAllRecurringIncomeMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        recurringIncome.map(item => backend.entities.RecurringIncome.delete(item.id))
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-income'] })
  }) */

  /*   const deleteAllRecurringExpensesMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        recurringExpenses.map(item => backend.entities.RecurringExpense.delete(item.id))
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
  }) */

  const handleIncomeSubmit = (data: any) => {
    if (editingItem) {
      handleUpdateRecurringIncome({ id: editingItem.id, data })
    } else {
      handleCreateRecurringIncome(data)
    }
  }

  const handleExpenseSubmit = data => {
    if (editingItem) {
      handleUpdateRecurringExpense({ id: editingItem.id, data })
    } else {
      handleCreateRecurringExpense(data)
    }
  }

  const frequencyMultiplier = {
    weekly: 52 / 12,
    biweekly: 26 / 12,
    monthly: 1,
    quarterly: 12 / 4,
    yearly: 1 / 12
  }

  const monthlyBudget = useMemo(() => {
    const activeIncome = recurringIncome.filter(i => i.active !== false)
    const activeExpenses = recurringExpenses.filter(e => e.active !== false)

    const totalIncome = activeIncome.reduce((sum, i) => {
      return sum + i.amount * (frequencyMultiplier[i.frequency] || 1)
    }, 0)

    const totalExpenses = activeExpenses.reduce((sum, e) => {
      return sum + e.amount * (frequencyMultiplier[e.frequency] || 1)
    }, 0)

    return {
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses
    }
  }, [recurringIncome, recurringExpenses])

  const expensesByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    recurringExpenses
      .filter(e => e.active !== false)
      .forEach(expense => {
        const category = expense.category || 'Other'

        const monthlyAmount = Number(expense.amount) * (frequencyMultiplier[expense.frequency] || 1)

        categoryTotals[category] = (categoryTotals[category] || 0) + monthlyAmount
      })

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [recurringExpenses])

  const expensesByLifeArea = useMemo(() => {
    const lifeTotals: Record<string, number> = {}

    recurringExpenses
      .filter(e => e.active !== false)
      .forEach(expense => {
        const lifeArea = expense.business_id
          ? businesses.find(b => String(b.id) === String(expense.business_id))?.name || 'Unknown'
          : 'Personal'
        const monthlyAmount = expense.amount * (frequencyMultiplier[expense.frequency] || 1)
        lifeTotals[lifeArea] = (lifeTotals[lifeArea] || 0) + monthlyAmount
      })

    return Object.entries(lifeTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [recurringExpenses, businesses])

  const expensesData = expenseGroupBy === 'categories' ? expensesByCategory : expensesByLifeArea

  const incomeByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    recurringIncome
      .filter(i => i.active !== false)
      .forEach(income => {
        const category = income.category || 'Other'
        const monthlyAmount = income.amount * (frequencyMultiplier[income.frequency] || 1)
        categoryTotals[category] = (categoryTotals[category] || 0) + monthlyAmount
      })

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [recurringIncome])

  const incomeByLifeArea = useMemo(() => {
    const lifeTotals: Record<string, number> = {}

    recurringIncome
      .filter(i => i.active !== false)
      .forEach(income => {
        const lifeArea = income.business_id
          ? businesses.find(b => String(b.id) === String(income.business_id))?.name || 'Unknown'
          : 'Personal'
        const monthlyAmount = income.amount * (frequencyMultiplier[income.frequency] || 1)
        lifeTotals[lifeArea] = (lifeTotals[lifeArea] || 0) + monthlyAmount
      })

    return Object.entries(lifeTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [recurringIncome, businesses])

  const incomeData = incomeGroupBy === 'categories' ? incomeByCategory : incomeByLifeArea

  /*   const yearlyForecast = useMemo(() => {
    const months = []
    for (let i = 0; i < 12; i++) {
      months.push({
        month: new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        income: monthlyBudget.income,
        expenses: monthlyBudget.expenses,
        net: monthlyBudget.net
      })
    }
    return months
  }, [monthlyBudget]) */

  const filteredRecurringIncome = useMemo(() => {
    let filtered = [...recurringIncome]
    if (incomeSearch) {
      const query = incomeSearch.toLowerCase()
      filtered = filtered.filter(
        income =>
          income.title?.toLowerCase().includes(query) ||
          income.category?.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => {
      let aVal = a[incomeSortBy]
      let bVal = b[incomeSortBy]

      if (incomeSortBy === 'start_date') {
        aVal = new Date(a.start_date).getTime()
        bVal = new Date(b.start_date).getTime()
        if (aVal === bVal) return 0
        const comparison = aVal > bVal ? 1 : -1
        return incomeSortOrder === 'asc' ? comparison : -comparison
      } else if (incomeSortBy === 'business_id') {
        aVal = a.business_id
          ? businesses.find(bus => String(bus.id) === String(a.business_id))?.name || 'Private'
          : 'Private'
        bVal = b.business_id
          ? businesses.find(bus => String(bus.id) === String(b.business_id))?.name || 'Private'
          : 'Private'
        const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase())
        return incomeSortOrder === 'asc' ? comparison : -comparison
      }

      if (aVal === bVal) return 0
      const comparison = aVal > bVal ? 1 : -1
      return incomeSortOrder === 'asc' ? comparison : -comparison
    })
  }, [recurringIncome, incomeSearch, incomeSortBy, incomeSortOrder, businesses])

  const paginatedIncome = useMemo(() => {
    const startIndex = (incomePage - 1) * incomePerPage
    return filteredRecurringIncome.slice(startIndex, startIndex + incomePerPage)
  }, [filteredRecurringIncome, incomePage, incomePerPage])

  const incomeTotalPages = Math.ceil(filteredRecurringIncome.length / incomePerPage)

  const filteredRecurringExpenses = useMemo(() => {
    let filtered = [...recurringExpenses]
    if (expenseSearch) {
      const query = expenseSearch.toLowerCase()
      filtered = filtered.filter(
        expense =>
          expense.title?.toLowerCase().includes(query) ||
          expense.category?.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => {
      let aVal = a[expenseSortBy]
      let bVal = b[expenseSortBy]

      if (expenseSortBy === 'start_date') {
        aVal = new Date(a.start_date).getTime()
        bVal = new Date(b.start_date).getTime()
        if (aVal === bVal) return 0
        const comparison = aVal > bVal ? 1 : -1
        return expenseSortOrder === 'asc' ? comparison : -comparison
      } else if (expenseSortBy === 'business_id') {
        aVal = a.business_id
          ? businesses.find(bus => String(bus.id) === String(a.business_id))?.name || 'Private'
          : 'Private'
        bVal = b.business_id
          ? businesses.find(bus => String(bus.id) === String(b.business_id))?.name || 'Private'
          : 'Private'
        const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase())
        return expenseSortOrder === 'asc' ? comparison : -comparison
      }

      if (aVal === bVal) return 0
      const comparison = aVal > bVal ? 1 : -1
      return expenseSortOrder === 'asc' ? comparison : -comparison
    })
  }, [recurringExpenses, expenseSearch, expenseSortBy, expenseSortOrder, businesses])

  const paginatedExpenses = useMemo(() => {
    const startIndex = (expensePage - 1) * expensePerPage
    return filteredRecurringExpenses.slice(startIndex, startIndex + expensePerPage)
  }, [filteredRecurringExpenses, expensePage, expensePerPage])

  const expenseTotalPages = Math.ceil(filteredRecurringExpenses.length / expensePerPage)

  const handleIncomeSort = field => {
    if (incomeSortBy === field) {
      setIncomeSortOrder(incomeSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setIncomeSortBy(field)
      setIncomeSortOrder('asc')
    }
    setIncomePage(1)
  }

  const handleExpenseSort = field => {
    if (expenseSortBy === field) {
      setExpenseSortOrder(expenseSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setExpenseSortBy(field)
      setExpenseSortOrder('asc')
    }
    setExpensePage(1)
  }

  const startEdit = (itemId, field, currentValue) => {
    setEditingField(`${itemId}-${field}`)
    if (field === 'business_id' && !currentValue) {
      setEditValue('__private__')
    } else {
      setEditValue(currentValue || '')
    }
  }

  const saveEdit = (item, field, isIncome) => {
    let value: string | number | null = editValue

    if (field === 'amount') {
      const normalized = editValue.replace(',', '.')
      value = parseFloat(normalized)

      if (isNaN(value) || value < 0) {
        value = 0
      }
    }

    // Handle business_id special case
    if (field === 'business_id') {
      value = editValue === '__private__' ? null : editValue

      const updateData = {
        [field]: value,
        category: ''
      }

      if (isIncome) {
        handleUpdateRecurringIncome({
          id: item.id,
          data: updateData
        })
      } else {
        handleUpdateRecurringExpense({
          id: item.id,
          data: updateData
        })
      }

      return
    }

    if (isIncome) {
      handleUpdateRecurringIncome({
        id: item.id,
        data: { [field]: value }
      })
    } else {
      handleUpdateRecurringExpense({
        id: item.id,
        data: { [field]: value }
      })
    }
  }

  const handleKeyDown = (e, item, field, isIncome) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(item, field, isIncome)
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  const getIncomeId = (income: any): string => income._id ?? income.serverId ?? income.id

  return (
    <>
      <Helmet>
        <title>Budget | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="budget-sticky-title text-sm font-normal text-slate-900 text-center">
                  {business ? `${business.name} - Budget` : 'Budget'}
                </h1>
              </div>
            </div>
          )}
          <div ref={headerRef} className="py-6 sm:py-8">
            <h1 className="flex-col min-[480px]:flex-row text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <Coins className="w-8 h-8 sm:w-9 sm:h-9" />
              {business ? `${business.name} - Budget` : 'Budget & Recurring Items'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left">
              {business
                ? 'Plan business monthly income and expenses'
                : 'Plan manually your monthly income and expenses.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Monthly Income</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(monthlyBudget.income)}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Monthly Expenses</span>
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(monthlyBudget.expenses)}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Net Cashflow</span>
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <p
                className={cn(
                  'text-3xl font-bold',
                  monthlyBudget.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {formatCurrency(monthlyBudget.net)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-slate-200">
              <button
                onClick={() => toggleCollapsed('incomeBy')}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h2 className="budget-income-chart-title text-lg font-semibold text-slate-900">
                    Income by
                  </h2>
                </div>
                {collapsed.incomeBy ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {!collapsed.incomeBy && (
                <div className="px-6 pb-6">
                  <Tabs value={incomeGroupBy} onValueChange={setIncomeGroupBy} className="mb-4">
                    <TabsList className="grid w-64 grid-cols-2">
                      <TabsTrigger value="categories">Categories</TabsTrigger>
                      <TabsTrigger value="life_areas">Life Areas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {incomeData.length > 0 ? (
                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        {incomeData.map((item, index) => {
                          const total = incomeData.reduce((sum, cat) => sum + cat.value, 0)
                          const percentage = ((item.value / total) * 100).toFixed(0)
                          return (
                            <div key={item.name} className="flex items-start gap-3">
                              <div
                                className="w-5 h-5 rounded flex-shrink-0"
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
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={incomeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {incomeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={value => formatCurrency(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-500">
                      No recurring income yet
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200">
              <button
                onClick={() => toggleCollapsed('expensesBy')}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  <h2 className="budget-expenses-chart-title text-lg font-semibold text-slate-900">
                    Expenses by
                  </h2>
                </div>
                {collapsed.expensesBy ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {!collapsed.expensesBy && (
                <div className="px-6 pb-6">
                  <Tabs value={expenseGroupBy} onValueChange={setExpenseGroupBy} className="mb-4">
                    <TabsList className="grid w-64 grid-cols-2">
                      <TabsTrigger value="categories">Categories</TabsTrigger>
                      <TabsTrigger value="life_areas">Life Areas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {expensesData.length > 0 ? (
                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        {expensesData.map((item, index) => {
                          const total = expensesData.reduce((sum, cat) => sum + cat.value, 0)
                          const percentage = ((item.value / total) * 100).toFixed(0)
                          return (
                            <div key={item.name} className="flex items-start gap-3">
                              <div
                                className="w-5 h-5 rounded flex-shrink-0"
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
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={expensesData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {expensesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={value => formatCurrency(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-500">
                      No recurring expenses yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 mb-6">
            <button
              onClick={() => toggleCollapsed('recurringIncome')}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recurring Income & Expenses
                </h2>
              </div>
              {collapsed.recurringIncome ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {!collapsed.recurringIncome && (
              <div className="px-6 pb-6">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="income" className="gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Recurring Income
                    </TabsTrigger>
                    <TabsTrigger value="expenses" className="gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Recurring Expenses
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="income">
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                      <div className="flex items-center flex-col min-[640px]:flex-row justify-between mb-4">
                        <h2 className="budget-income-table-title text-lg font-semibold text-slate-900">
                          Recurring Income
                        </h2>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              id="income-search"
                              name="incomeSearch"
                              placeholder="Search income..."
                              value={incomeSearch}
                              onChange={e => setIncomeSearch(e.target.value)}
                              className="pl-9 w-48"
                            />
                          </div>
                          {(() => {
                            return (
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        onClick={() => {
                                          if (!isOverLimit) {
                                            setEditingItem(null)
                                            setShowIncomeForm(true)
                                          }
                                        }}
                                        disabled={isOverLimit}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add
                                        {isOverLimit && (
                                          <Lock className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                                        )}
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {isOverLimit && (
                                    <TooltipContent>
                                      <p>
                                        Limit reached ({userLimits?.limits?.budgetEntries} total
                                        entries on your plan).{' '}
                                        <Link to="/upgrade" className="underline">
                                          Upgrade
                                        </Link>{' '}
                                        for more.
                                      </p>
                                    </TooltipContent>
                                  )}
                                </UITooltip>
                              </TooltipProvider>
                            )
                          })()}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 text-left w-56">
                                <button
                                  onClick={() => handleIncomeSort('title')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Title
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left w-32">
                                <button
                                  onClick={() => handleIncomeSort('amount')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Amount
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left w-32">
                                <button
                                  onClick={() => handleIncomeSort('frequency')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Frequency
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left w-40">
                                <button
                                  onClick={() => handleIncomeSort('start_date')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Start Date
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              {!businessId && (
                                <th className="px-4 py-3 text-left w-32">
                                  <button
                                    onClick={() => handleIncomeSort('business_id')}
                                    className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                  >
                                    Life Area
                                    <ArrowUpDown className="w-3 h-3" />
                                  </button>
                                </th>
                              )}
                              <th className="px-4 py-3 text-left w-40">
                                <button
                                  onClick={() => handleIncomeSort('category')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Category
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 w-16"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedIncome.map(income => (
                              <tr
                                key={getIncomeId(income)}
                                className="border-b border-slate-100 hover:bg-slate-50"
                              >
                                <td className="px-4 py-3 align-top w-56">
                                  {editingField === `${getIncomeId(income)}-title` ? (
                                    <Input
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      onBlur={() => saveEdit(income, 'title', true)}
                                      onKeyDown={e => handleKeyDown(e, income, 'title', true)}
                                      maxLength={200}
                                      autoFocus
                                      className="h-8"
                                    />
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(getIncomeId(income), 'title', income.title)
                                      }
                                      className="cursor-text font-medium text-slate-900 hover:bg-slate-100 px-2 py-1 rounded line-clamp-2"
                                    >
                                      {income.title}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top w-32">
                                  {editingField === `${getIncomeId(income)}-amount` ? (
                                    <Input
                                      type="text"
                                      value={editValue}
                                      onChange={e => {
                                        const value = e.target.value
                                        if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                                          setEditValue(value)
                                        }
                                      }}
                                      onBlur={() => saveEdit(income, 'amount', true)}
                                      onKeyDown={e => handleKeyDown(e, income, 'amount', true)}
                                      autoFocus
                                      className="h-8"
                                    />
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(getIncomeId(income), 'amount', income.amount)
                                      }
                                      className="cursor-text font-semibold text-emerald-600 hover:bg-slate-100 px-2 py-1 rounded"
                                    >
                                      +{formatCurrency(income.amount)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top w-32">
                                  {editingField === `${getIncomeId(income)}-frequency` ? (
                                    <Select
                                      value={editValue}
                                      onValueChange={value => {
                                        setEditValue(value)
                                        handleUpdateRecurringIncome({
                                          id: getIncomeId(income),
                                          data: { frequency: value as Frequency }
                                        })
                                        setEditingField(null)
                                      }}
                                      onOpenChange={open => {
                                        if (!open) setEditingField(null)
                                      }}
                                      defaultOpen={true}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(
                                          getIncomeId(income),
                                          'frequency',
                                          income.frequency
                                        )
                                      }
                                      className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                    >
                                      {income.frequency === 'weekly' && 'Weekly'}
                                      {income.frequency === 'biweekly' && 'Bi-weekly'}
                                      {income.frequency === 'monthly' && 'Monthly'}
                                      {income.frequency === 'quarterly' && 'Quarterly'}
                                      {income.frequency === 'yearly' && 'Yearly'}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top w-40">
                                  {editingField === `${getIncomeId(income)}-start_date` ? (
                                    <div className="text-sm">
                                      <Input
                                        type="date"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onBlur={() => {
                                          handleUpdateRecurringIncome({
                                            id: getIncomeId(income),
                                            data: { start_date: editValue }
                                          })
                                          setEditingField(null)
                                        }}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') {
                                            handleUpdateRecurringIncome({
                                              id: getIncomeId(income),
                                              data: { start_date: editValue }
                                            })
                                            setEditingField(null)
                                          } else if (e.key === 'Escape') {
                                            setEditingField(null)
                                          }
                                        }}
                                        autoFocus
                                        className="h-8"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(
                                          getIncomeId(income),
                                          'start_date',
                                          income.start_date
                                        )
                                      }
                                      className="text-sm text-slate-600 px-2 py-1 rounded cursor-pointer hover:bg-slate-100"
                                    >
                                      {formatDateMedium(income.start_date)}
                                    </div>
                                  )}
                                </td>
                                {!businessId && (
                                  <td className="px-4 py-3 align-top w-32">
                                    {editingField === `${getIncomeId(income)}-business_id` ? (
                                      <Select
                                        value={editValue || '__private__'}
                                        onValueChange={value => {
                                          setEditValue(value)
                                          handleUpdateRecurringIncome({
                                            id: getIncomeId(income),
                                            data: {
                                              business_id: value === '__private__' ? null : value,
                                              category: ''
                                            }
                                          })
                                        }}
                                        onOpenChange={open => {
                                          if (!open) setEditingField(null)
                                        }}
                                        defaultOpen={true}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="__private__">Private</SelectItem>
                                          {businesses.map(business => (
                                            <SelectItem
                                              key={business.id}
                                              value={String(business.id)}
                                            >
                                              {business.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <div
                                        onClick={() =>
                                          startEdit(
                                            getIncomeId(income),
                                            'business_id',
                                            income.business_id ? String(income.business_id) : ''
                                          )
                                        }
                                        className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                      >
                                        {income.business_id
                                          ? businesses.find(
                                              b => String(b.id) === String(income.business_id)
                                            )?.name
                                          : 'Private'}
                                      </div>
                                    )}
                                  </td>
                                )}
                                <td className="px-4 py-3 align-top w-40">
                                  {editingField === `${getIncomeId(income)}-category` ? (
                                    <Select
                                      value={editValue}
                                      onValueChange={value => {
                                        setEditValue(value)
                                        handleUpdateRecurringIncome({
                                          id: getIncomeId(income),
                                          data: { category: value }
                                        })
                                      }}
                                      onOpenChange={open => {
                                        if (!open) setEditingField(null)
                                      }}
                                      defaultOpen={true}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {!income.business_id ? (
                                          <>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                                              Personal
                                            </div>
                                            {PERSONAL_INCOME_CATEGORIES.map(cat => (
                                              <SelectItem
                                                key={cat}
                                                value={cat}
                                                className="text-emerald-600 font-medium"
                                              >
                                                {cat}
                                              </SelectItem>
                                            ))}
                                          </>
                                        ) : (
                                          <>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                                              Business
                                            </div>
                                            {BUSINESS_INCOME_CATEGORIES.map(cat => (
                                              <SelectItem
                                                key={cat}
                                                value={cat}
                                                className="text-emerald-600 font-medium"
                                              >
                                                {cat}
                                              </SelectItem>
                                            ))}
                                          </>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(
                                          getIncomeId(income),
                                          'category',
                                          income.category || ''
                                        )
                                      }
                                      className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                    >
                                      {income.category || 'Uncategorized'}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top w-16">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteRecurringIncome(getIncomeId(income))}
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {filteredRecurringIncome.length === 0 && recurringIncome.length > 0 && (
                          <div className="text-center py-8 text-slate-500">
                            No income matches your search
                          </div>
                        )}

                        {recurringIncome.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            No recurring income yet
                          </div>
                        )}
                      </div>

                      {filteredRecurringIncome.length > 0 && (
                        <div className="flex flex-col min-[480px]:flex-row items-center justify-between mt-4 px-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-700">Show</span>
                            <Select
                              value={String(incomePerPage)}
                              onValueChange={value => {
                                setIncomePerPage(Number(value))
                                setIncomePage(1)
                              }}
                            >
                              <SelectTrigger className="w-20 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-slate-700">
                              of {filteredRecurringIncome.length} entries
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIncomePage(p => Math.max(1, p - 1))}
                              disabled={incomePage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-slate-600">
                              Page {incomePage} of {incomeTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIncomePage(p => Math.min(incomeTotalPages, p + 1))}
                              disabled={incomePage === incomeTotalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="expenses">
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                      <div className="flex flex-col min-[480px]:flex-row items-center justify-between mb-4">
                        <h2 className="budget-expenses-table-title text-lg font-semibold text-slate-900">
                          Recurring Expenses
                        </h2>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              placeholder="Search expenses..."
                              value={expenseSearch}
                              onChange={e => setExpenseSearch(e.target.value)}
                              className="pl-9 w-48"
                            />
                          </div>
                          {(() => {
                            return (
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        onClick={() => {
                                          if (!isOverLimit) {
                                            setEditingItem(null)
                                            setShowExpenseForm(true)
                                          }
                                        }}
                                        disabled={isOverLimit}
                                        className="bg-rose-600 hover:bg-rose-700"
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add
                                        {isOverLimit && (
                                          <Lock className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                                        )}
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {isOverLimit && (
                                    <TooltipContent>
                                      <p>
                                        Limit reached ({userLimits?.limits?.budgetEntries} total
                                        entries on your plan).{' '}
                                        <Link to="/upgrade" className="underline">
                                          Upgrade
                                        </Link>{' '}
                                        for more.
                                      </p>
                                    </TooltipContent>
                                  )}
                                </UITooltip>
                              </TooltipProvider>
                            )
                          })()}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 text-left w-56">
                                <button
                                  onClick={() => handleExpenseSort('title')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Title
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left w-32">
                                <button
                                  onClick={() => handleExpenseSort('amount')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Amount
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left w-32">
                                <button
                                  onClick={() => handleExpenseSort('frequency')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Frequency
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left w-40">
                                <button
                                  onClick={() => handleExpenseSort('start_date')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Start Date
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              {!businessId && (
                                <th className="px-4 py-3 text-left w-32">
                                  <button
                                    onClick={() => handleExpenseSort('business_id')}
                                    className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                  >
                                    Life Area
                                    <ArrowUpDown className="w-3 h-3" />
                                  </button>
                                </th>
                              )}
                              <th className="px-4 py-3 text-left w-40">
                                <button
                                  onClick={() => handleExpenseSort('category')}
                                  className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                                >
                                  Category
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 w-16"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedExpenses.map(expense => (
                              <tr
                                key={expense.id}
                                className="border-b border-slate-100 hover:bg-slate-50"
                              >
                                <td className="px-4 py-3 align-top w-56">
                                  {editingField === `${expense.id}-title` ? (
                                    <Input
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      onBlur={() => saveEdit(expense, 'title', false)}
                                      onKeyDown={e => handleKeyDown(e, expense, 'title', false)}
                                      maxLength={200}
                                      autoFocus
                                      className="h-8"
                                    />
                                  ) : (
                                    <div
                                      onClick={() => startEdit(expense.id, 'title', expense.title)}
                                      className="cursor-text font-medium text-slate-900 hover:bg-slate-100 px-2 py-1 rounded line-clamp-2"
                                    >
                                      {expense.title}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top w-32">
                                  {editingField === `${expense.id}-amount` ? (
                                    <Input
                                      type="text"
                                      value={editValue}
                                      onChange={e => {
                                        const value = e.target.value
                                        if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                                          setEditValue(value)
                                        }
                                      }}
                                      onBlur={() => saveEdit(expense, 'amount', false)}
                                      onKeyDown={e => handleKeyDown(e, expense, 'amount', false)}
                                      autoFocus
                                      className="h-8"
                                    />
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(expense.id, 'amount', expense.amount)
                                      }
                                      className="cursor-text font-semibold text-rose-600 hover:bg-slate-100 px-2 py-1 rounded"
                                    >
                                      -{formatCurrency(expense.amount)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top w-32">
                                  {editingField === `${expense.id}-frequency` ? (
                                    <Select
                                      value={editValue}
                                      onValueChange={value => {
                                        const frequency = value as Frequency

                                        setEditValue(value)

                                        handleUpdateRecurringExpense({
                                          id: expense.id,
                                          data: { frequency }
                                        })
                                        setEditingField(null)
                                      }}
                                      onOpenChange={open => {
                                        if (!open) setEditingField(null)
                                      }}
                                      defaultOpen={true}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(expense.id, 'frequency', expense.frequency)
                                      }
                                      className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                    >
                                      {expense.frequency === 'weekly' && 'Weekly'}
                                      {expense.frequency === 'biweekly' && 'Bi-weekly'}
                                      {expense.frequency === 'monthly' && 'Monthly'}
                                      {expense.frequency === 'quarterly' && 'Quarterly'}
                                      {expense.frequency === 'yearly' && 'Yearly'}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top w-40">
                                  {editingField === `${expense.id}-start_date` ? (
                                    <div className="text-sm">
                                      <Input
                                        type="date"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onBlur={() => {
                                          handleUpdateRecurringExpense({
                                            id: expense.id,
                                            data: { start_date: editValue }
                                          })
                                          setEditingField(null)
                                        }}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') {
                                            handleUpdateRecurringExpense({
                                              id: expense.id,
                                              data: { start_date: editValue }
                                            })
                                            setEditingField(null)
                                          } else if (e.key === 'Escape') {
                                            setEditingField(null)
                                          }
                                        }}
                                        autoFocus
                                        className="h-8"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(expense.id, 'start_date', expense.start_date)
                                      }
                                      className="text-sm text-slate-600 px-2 py-1 rounded cursor-pointer hover:bg-slate-100"
                                    >
                                      {formatDateMedium(expense.start_date)}
                                    </div>
                                  )}
                                </td>
                                {!businessId && (
                                  <td className="px-4 py-3 align-top w-32">
                                    {editingField === `${expense.id}-business_id` ? (
                                      <Select
                                        value={editValue || '__private__'}
                                        onValueChange={value => {
                                          setEditValue(value)
                                          handleUpdateRecurringExpense({
                                            id: expense.id,
                                            data: {
                                              business_id: value === '__private__' ? null : value,
                                              category: ''
                                            }
                                          })
                                        }}
                                        onOpenChange={open => {
                                          if (!open) setEditingField(null)
                                        }}
                                        defaultOpen={true}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="__private__">Private</SelectItem>
                                          {businesses.map(business => (
                                            <SelectItem
                                              key={business.id}
                                              value={String(business.id)}
                                            >
                                              {business.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <div
                                        onClick={() =>
                                          startEdit(
                                            expense.id,
                                            'business_id',
                                            expense.business_id ? String(expense.business_id) : ''
                                          )
                                        }
                                        className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                      >
                                        {expense.business_id
                                          ? businesses.find(
                                              b => String(b.id) === String(expense.business_id)
                                            )?.name
                                          : 'Private'}
                                      </div>
                                    )}
                                  </td>
                                )}
                                <td className="px-4 py-3 align-top w-40">
                                  {editingField === `${expense.id}-category` ? (
                                    <Select
                                      value={editValue}
                                      onValueChange={value => {
                                        setEditValue(value)
                                        handleUpdateRecurringExpense({
                                          id: expense.id,
                                          data: { category: value }
                                        })
                                      }}
                                      onOpenChange={open => {
                                        if (!open) setEditingField(null)
                                      }}
                                      defaultOpen={true}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {!expense.business_id ? (
                                          <>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                                              Personal
                                            </div>
                                            {PERSONAL_EXPENSE_CATEGORIES.map(cat => (
                                              <SelectItem
                                                key={cat}
                                                value={cat}
                                                className="text-rose-600 font-medium"
                                              >
                                                {cat}
                                              </SelectItem>
                                            ))}
                                          </>
                                        ) : (
                                          <>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                                              Business
                                            </div>
                                            {BUSINESS_EXPENSE_CATEGORIES.map(cat => (
                                              <SelectItem
                                                key={cat}
                                                value={cat}
                                                className="text-rose-600 font-medium"
                                              >
                                                {cat}
                                              </SelectItem>
                                            ))}
                                          </>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        startEdit(expense.id, 'category', expense.category || '')
                                      }
                                      className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                    >
                                      {expense.category || 'Uncategorized'}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top w-16">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteRecurringExpense(expense.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {filteredRecurringExpenses.length === 0 && recurringExpenses.length > 0 && (
                          <div className="text-center py-8 text-slate-500">
                            No expenses match your search
                          </div>
                        )}

                        {recurringExpenses.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            No recurring expenses yet
                          </div>
                        )}
                      </div>

                      {filteredRecurringExpenses.length > 0 && (
                        <div className="flex flex-col min-[480px]:flex-row items-center justify-between mt-4 px-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-700">Show</span>
                            <Select
                              value={String(expensePerPage)}
                              onValueChange={value => {
                                setExpensePerPage(Number(value))
                                setExpensePage(1)
                              }}
                            >
                              <SelectTrigger className="w-20 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-slate-700">
                              of {filteredRecurringExpenses.length} entries
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpensePage(p => Math.max(1, p - 1))}
                              disabled={expensePage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-slate-600">
                              Page {expensePage} of {expenseTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setExpensePage(p => Math.min(expenseTotalPages, p + 1))
                              }
                              disabled={expensePage === expenseTotalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 mb-6">
            <button
              onClick={() => toggleCollapsed('plannedVsActual')}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Planned vs. Actual</h2>
              </div>
              {collapsed.plannedVsActual ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {!collapsed.plannedVsActual && (
              <div className="px-6 pb-6">
                <PlannedVsActual
                  recurringIncome={recurringIncome}
                  recurringExpenses={recurringExpenses}
                  businesses={businesses}
                  businessId={businessId}
                />
              </div>
            )}
          </div>

          <RecurringIncomeForm
            open={showIncomeForm}
            onClose={() => {
              setShowIncomeForm(false)
              setEditingItem(null)
            }}
            onSubmit={handleIncomeSubmit}
            income={editingItem}
            isLoading={createRecurringIncome.isPending || updateRecurringIncome.isPending}
          />

          <RecurringExpenseForm
            open={showExpenseForm}
            onClose={() => {
              setShowExpenseForm(false)
              setEditingItem(null)
            }}
            onSubmit={handleExpenseSubmit}
            expense={editingItem}
            isLoading={createRecurringExpense.isPending || updateRecurringExpense.isPending}
          />
        </div>
      </div>
    </>
  )
}
