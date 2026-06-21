import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import { useLocation } from 'react-router-dom'
import { backend } from '@/api/backend'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  ArrowUpDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Upload,
  Calendar as CalendarIcon,
  Plus,
  Repeat,
  Search,
  ArrowLeftRight,
  Building2
} from 'lucide-react'
import AddToBudgetModal from '@/components/finances/AddToBudgetModal'
import { Input } from '@/components/ui/input'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import CashFlowKPIs from '@/components/finances/CashFlowKPIs'

import { cn } from '@/lib/utils'
import IncomeForm from '@/components/finances/IncomeForm'
import ExpenseForm from '@/components/finances/ExpenseForm'
import ImportTransactions from '@/components/finances/ImportTransactions'
import BankConnectionManager from '@/components/finances/BankConnectionManager'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  PERSONAL_CATEGORIES,
  BUSINESS_CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES
} from '@/components/finances/categories'
import { formatCurrency, formatDateMedium } from '@/components/utils/formatters'
import { Helmet } from 'react-helmet-async'
import { useIncomeMutations } from '@/hooks/incomes/useIncomeMutations'
import { CreateIncomeInput } from '@/repositories/income.repository'
import { ExpenseRecord, IncomeRecord } from '@/db'
import { useIncomesQuery } from '@/hooks/incomes/useIncomesQuery'
import { useBusinessesQuery } from '@/hooks/businesses/useBusinessesQuery'
import { useExpensesQuery } from '@/hooks/expenses/useExpensesQuery'
import { useExpenseMutations } from '@/hooks/expenses/useExpenseMutations'
import { CreateExpenseInput } from '@/repositories/expense.repository'

type Business = {
  id: string
  name: string
  categories?: string[]
}

export default function Transactions() {
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const businessId = urlParams.get('businessId')
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

  const { data: business } = useQuery<Business | null>({
    queryKey: ['business', businessId],
    queryFn: async (): Promise<Business | null> => {
      if (!businessId) return null

      const res = (await backend.entities.Business.filter({
        id: businessId
      })) as Business[]

      return res?.[0] ?? null
    },
    enabled: !!businessId
  })

  const [showImport, setShowImport] = useState(false)
  const [showBankConnect, setShowBankConnect] = useState(false)
  const [addToBudgetTransaction, setAddToBudgetTransaction] = useState(null)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [timePeriod, setTimePeriod] = useState(
    () => localStorage.getItem('transactions_timePeriod') || '30days'
  )
  const [customStartDate, setCustomStartDate] = useState(null)
  const [customEndDate, setCustomEndDate] = useState(null)

  useEffect(() => {
    localStorage.setItem('transactions_timePeriod', timePeriod)
  }, [timePeriod])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const queryClient = useQueryClient()

  const { data: incomes = [] } = useIncomesQuery()

  const { data: expenses = [] } = useExpensesQuery()

  const {
    deleteMutation: deleteIncomeMutation,
    updateMutation: updateIncomeMutation,
    createMutation: createIncomeMutation
  } = useIncomeMutations()

  const {
    deleteMutation: deleteExpenseMutation,
    updateMutation: updateExpenseMutation,
    createMutation: createExpenseMutation
  } = useExpenseMutations()

  const handleDeleteIncome = async (id: string) => {
    try {
      await deleteIncomeMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpenseMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateIncome = async ({ id, data }: { id: string; data: Partial<IncomeRecord> }) => {
    try {
      await updateIncomeMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowIncomeForm(false)
      setEditingItem(null)
      setEditingField(null)
    }
  }

  const handleUpdateExpense = async ({
    id,
    data
  }: {
    id: string
    data: Partial<ExpenseRecord>
  }) => {
    try {
      await updateExpenseMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowIncomeForm(false)
      setEditingItem(null)
      setEditingField(null)
    }
  }

  const handleCreateIncome = async (data: CreateIncomeInput) => {
    try {
      await createIncomeMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowIncomeForm(false)
    }
  }

  const handleCreateExpense = async (data: CreateExpenseInput) => {
    try {
      await createExpenseMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowExpenseForm(false)
    }
  }

  const { data: businesses = [] } = useBusinessesQuery()

  const getDateRange = () => {
    const now = new Date()
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      return { start: startOfDay(customStartDate), end: endOfDay(customEndDate) }
    }
    switch (timePeriod) {
      case '30days':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) }
      case '90days':
        return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) }
      case '6months':
        return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) }
      case '1year':
        return { start: startOfDay(subYears(now, 1)), end: endOfDay(now) }
      case 'all':
      default:
        return null
    }
  }

  const filteredTransactions = useMemo(() => {
    const dateRange = getDateRange()
    let transactions = [
      ...incomes.map(i => ({ ...i, type: 'income', isRecurring: false })),
      ...expenses.map(e => ({ ...e, type: 'expense', isRecurring: false }))
    ]

    // Filter by business ID if present
    if (businessId) {
      transactions = transactions.filter(t => String(t.business_id) === String(businessId))
    }

    // Filter by date range
    if (dateRange) {
      transactions = transactions.filter(t => {
        if (!t.date) return false // Skip transactions without a date
        const transactionDate = startOfDay(new Date(t.date))
        // Check if date is valid
        if (isNaN(transactionDate.getTime())) return false
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end
      })
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      transactions = transactions.filter(
        t =>
          t.title?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query) ||
          (!t.category && 'uncategorized'.includes(query))
      )
    }

    return transactions.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      if (sortBy === 'date') {
        aVal = new Date(a.date).getTime()
        bVal = new Date(b.date).getTime()
      }

      if (aVal === bVal) return 0
      const comparison = aVal > bVal ? 1 : -1
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [
    incomes,
    expenses,
    sortBy,
    sortOrder,
    searchQuery,
    timePeriod,
    customStartDate,
    customEndDate,
    businessId
  ])

  const allTransactions = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return filteredTransactions.slice(startIndex, startIndex + perPage)
  }, [filteredTransactions, page, perPage])

  const totalPages = Math.ceil(filteredTransactions.length / perPage)

  const handleSort = field => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const startEdit = (transactionId, field, currentValue) => {
    setEditingField(`${transactionId}-${field}`)
    setEditValue(currentValue || '')
  }

  const saveEdit = (transaction, field) => {
    let value: string | number = editValue

    if (field === 'amount') {
      const numValue = parseFloat(editValue)
      const isNegative = numValue < 0
      const absValue = Math.abs(numValue)

      // Convert between income and expense based on sign
      if (isNegative && transaction.type === 'income') {
        handleCreateExpense({
          title: transaction.title,
          amount: absValue,
          date: transaction.date,
          category: transaction.category,
          notes: transaction.notes
        } as any)

        handleDeleteIncome(transaction.id)
        setEditingField(null)
        return
      } else if (!isNegative && transaction.type === 'expense') {
        handleCreateIncome({
          title: transaction.title,
          amount: absValue,
          date: transaction.date,
          category: transaction.category,
          notes: transaction.notes
        } as any)

        handleDeleteExpense(transaction.id)
        setEditingField(null)
        return
      }

      value = absValue.toString()
    }

    if (transaction.type === 'income') {
      handleUpdateIncome({
        id: transaction.id,
        data: { [field]: field === 'amount' ? parseFloat(value as string) : value }
      })
    } else {
      handleUpdateExpense({
        id: transaction.id,
        data: { [field]: field === 'amount' ? parseFloat(value as string) : value }
      })
    }

    // Only close editing for non-select fields
    if (field !== 'category') {
      setEditingField(null)
    }
  }

  const handleKeyDown = (e, transaction, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(transaction, field)
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  const handleDelete = transaction => {
    if (transaction.type === 'income') {
      handleDeleteIncome(transaction.id)
    } else {
      handleDeleteExpense(transaction.id)
    }
  }

  const handleIncomeSubmit = data => {
    if (editingItem) {
      handleUpdateIncome({ id: editingItem.id, data })
    } else {
      handleCreateIncome(data)
    }
  }

  const handleExpenseSubmit = data => {
    if (editingItem) {
      handleUpdateExpense({ id: editingItem.id, data })
    } else {
      handleCreateExpense(data)
    }
  }

  return (
    <>
      <Helmet>
        <title>Transactions | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="transactions-sticky-title text-sm font-normal text-slate-900 text-center">
                  {business ? `${business.name} - Transactions` : 'Transactions'}
                </h1>
              </div>
            </div>
          )}
          <div ref={headerRef} className="py-6 sm:py-8">
            <h1 className="transactions-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <ArrowLeftRight className="w-8 h-8 sm:w-9 sm:h-9" />
              {business ? `${business.name} - Transactions` : 'Transactions'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left max-w-3xl">
              {business
                ? 'Track business income and expenses — import via CSV, add manually, or connect your bank account.'
                : 'All your transactions in one place — from connected bank accounts, CSV imports, and manual entries.'}
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="transactions-cashflow-title text-lg font-semibold text-slate-900 hidden">
              Cash Flow
            </h2>
            <div className="flex items-center gap-2">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {timePeriod === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-auto">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate && customEndDate
                        ? `${format(customStartDate, 'dd.MM.yyyy')} - ${format(customEndDate, 'dd.MM.yyyy')}`
                        : 'Select dates'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex flex-col gap-2 p-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">
                          Start Date
                        </label>
                        <CalendarComponent
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">
                          End Date
                        </label>
                        <CalendarComponent
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <CashFlowKPIs
            income={incomes}
            expenses={expenses}
            timePeriod={timePeriod}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
              <div className="flex flex-col min-[640px]:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => setShowIncomeForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Income
                </Button>
                <Button
                  onClick={() => setShowExpenseForm(true)}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Expense
                </Button>
                <Button onClick={() => setShowImport(true)} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left w-16">
                        <span className="text-xs font-medium text-slate-700">Type</span>
                      </th>
                      <th className="px-4 py-3 text-left w-56">
                        <button
                          onClick={() => handleSort('title')}
                          className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                        >
                          Title
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left w-40">
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                        >
                          Category
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left w-32">
                        <button
                          onClick={() => handleSort('amount')}
                          className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                        >
                          Amount
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left w-48">
                        <button
                          onClick={() => handleSort('date')}
                          className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                        >
                          Date
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left w-28">
                        <span className="text-xs font-medium text-slate-700">Source</span>
                      </th>
                      <th className="px-4 py-3 text-left w-36">
                        <span className="text-xs font-medium text-slate-700">Bank Account</span>
                      </th>
                      <th className="px-4 py-3 text-left w-96">
                        <span className="text-xs font-medium text-slate-700">Notes</span>
                      </th>
                      <th className="px-4 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.map(transaction => (
                      <tr
                        key={`${transaction.type}-${transaction.id}`}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 align-top w-16">
                          {transaction.type === 'income' ? (
                            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
                              <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center">
                              <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top w-56">
                          {editingField === `${transaction.id}-title` ? (
                            <Input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(transaction, 'title')}
                              onKeyDown={e => handleKeyDown(e, transaction, 'title')}
                              maxLength={200}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <div
                              onClick={() => startEdit(transaction.id, 'title', transaction.title)}
                              className="cursor-text font-medium text-slate-900 hover:bg-slate-100 px-2 py-1 rounded line-clamp-2"
                            >
                              {transaction.title}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top w-40">
                          {editingField === `${transaction.id}-category` ? (
                            <Select
                              value={editValue}
                              onValueChange={value => {
                                setEditValue(value)
                                const field = 'category'
                                const updateValue = value

                                if (transaction.type === 'income') {
                                  handleUpdateIncome({
                                    id: transaction.id,
                                    data: { [field]: updateValue }
                                  })
                                } else {
                                  handleUpdateExpense({
                                    id: transaction.id,
                                    data: { [field]: updateValue }
                                  })
                                }
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
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                                  Personal
                                </div>
                                {PERSONAL_CATEGORIES.map(cat => (
                                  <SelectItem
                                    key={cat}
                                    value={cat}
                                    className={
                                      INCOME_CATEGORIES.includes(cat)
                                        ? 'text-emerald-600 font-medium'
                                        : EXPENSE_CATEGORIES.includes(cat)
                                          ? 'text-rose-600 font-medium'
                                          : ''
                                    }
                                  >
                                    {cat}
                                  </SelectItem>
                                ))}
                                {businesses.length > 0 ? (
                                  businesses.map(business => (
                                    <Fragment key={business.id}>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 mt-2">
                                        Business - {business.name}
                                      </div>
                                      {(business.categories || BUSINESS_CATEGORIES).map(cat => (
                                        <SelectItem
                                          key={`${business.id}-${cat}`}
                                          value={cat}
                                          className={
                                            INCOME_CATEGORIES.includes(cat)
                                              ? 'text-emerald-600 font-medium'
                                              : EXPENSE_CATEGORIES.includes(cat)
                                                ? 'text-rose-600 font-medium'
                                                : ''
                                          }
                                        >
                                          {cat}
                                        </SelectItem>
                                      ))}
                                    </Fragment>
                                  ))
                                ) : (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 mt-2">
                                      Business
                                    </div>
                                    {BUSINESS_CATEGORIES.map(cat => (
                                      <SelectItem
                                        key={cat}
                                        value={cat}
                                        className={
                                          INCOME_CATEGORIES.includes(cat)
                                            ? 'text-emerald-600 font-medium'
                                            : EXPENSE_CATEGORIES.includes(cat)
                                              ? 'text-rose-600 font-medium'
                                              : ''
                                        }
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
                                startEdit(transaction.id, 'category', transaction.category || '')
                              }
                              className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                            >
                              {transaction.category || 'Uncategorized'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top w-32">
                          {editingField === `${transaction.id}-amount` ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(transaction, 'amount')}
                              onKeyDown={e => handleKeyDown(e, transaction, 'amount')}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <div
                              onClick={() =>
                                startEdit(transaction.id, 'amount', transaction.amount)
                              }
                              className={cn(
                                'cursor-text font-semibold hover:bg-slate-100 px-2 py-1 rounded',
                                transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                              )}
                            >
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount).replace(/^[€$£]/, '')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top w-48">
                          {editingField === `${transaction.id}-date` ? (
                            <div className="text-sm">
                              <Input
                                type="date"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={() => {
                                  if (transaction.type === 'income') {
                                    handleUpdateIncome({
                                      id: transaction.id,
                                      data: { date: editValue }
                                    })
                                  } else {
                                    handleUpdateExpense({
                                      id: transaction.id,
                                      data: { date: editValue }
                                    })
                                  }
                                  setEditingField(null)
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    if (transaction.type === 'income') {
                                      handleUpdateIncome({
                                        id: transaction.id,
                                        data: { date: editValue }
                                      })
                                    } else {
                                      handleUpdateExpense({
                                        id: transaction.id,
                                        data: { date: editValue }
                                      })
                                    }
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
                              onClick={() => startEdit(transaction.id, 'date', transaction.date)}
                              className="text-sm text-slate-600 px-2 py-1 rounded flex items-center gap-2 w-48 cursor-text hover:bg-slate-100"
                            >
                              {formatDateMedium(transaction.date)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top w-28">
                          {transaction.bank_account_name ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5 font-medium">
                              🏦 Bank
                            </span>
                          ) : transaction.notes?.startsWith('Imported') ? (
                            <span className="text-xs bg-amber-50 text-amber-700 rounded px-2 py-0.5 font-medium">
                              CSV
                            </span>
                          ) : (
                            <span className="text-xs bg-slate-100 text-slate-500 rounded px-2 py-0.5 font-medium">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top w-36">
                          {transaction.bank_account_name ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 rounded px-2 py-0.5 font-medium">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">
                                {transaction.bank_account_name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top w-96">
                          {editingField === `${transaction.id}-notes` ? (
                            <Input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(transaction, 'notes')}
                              onKeyDown={e => handleKeyDown(e, transaction, 'notes')}
                              maxLength={5000}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <div
                              onClick={() => startEdit(transaction.id, 'notes', transaction.notes)}
                              className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded min-h-[24px] line-clamp-2"
                            >
                              {transaction.notes || 'Click to add...'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top w-24">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                              title="Add to Budget"
                              onClick={() => setAddToBudgetTransaction(transaction)}
                            >
                              <Repeat className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(transaction)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-slate-500 mb-4">No transactions yet</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setShowIncomeForm(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Income
                    </Button>
                    <Button onClick={() => setShowExpenseForm(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {filteredTransactions.length > 0 && (
              <div className="flex flex-col items-center justify-between min-[480px]:flex-row gap-3 mt-4 px-4 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-700">Show</span>
                  <Select
                    value={String(perPage)}
                    onValueChange={value => {
                      setPerPage(Number(value))
                      setPage(1)
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
                    of {filteredTransactions.length} entries
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <IncomeForm
          open={showIncomeForm}
          onClose={() => {
            setShowIncomeForm(false)
            setEditingItem(null)
          }}
          onSubmit={handleIncomeSubmit}
          income={editingItem}
          isLoading={createIncomeMutation.isPending || updateIncomeMutation.isPending}
          defaultBusinessId={businessId}
        />

        <ExpenseForm
          open={showExpenseForm}
          onClose={() => {
            setShowExpenseForm(false)
            setEditingItem(null)
          }}
          onSubmit={handleExpenseSubmit}
          expense={editingItem}
          isLoading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
          defaultBusinessId={businessId}
        />

        <AddToBudgetModal
          open={!!addToBudgetTransaction}
          onClose={() => setAddToBudgetTransaction(null)}
          transaction={addToBudgetTransaction}
        />

        <ImportTransactions open={showImport} onClose={() => setShowImport(false)} />
        <BankConnectionManager
          open={showBankConnect}
          onClose={() => setShowBankConnect(false)}
          onTransactionsImported={() => {
            queryClient.invalidateQueries({ queryKey: ['income'] })
            queryClient.invalidateQueries({ queryKey: ['expenses'] })
          }}
        />
      </div>
    </>
  )
}
