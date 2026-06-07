import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
import IncomeVsExpenseChart from '@/components/finances/IncomeVsExpenseChart'
import ExpenseByCategoryChart from '@/components/finances/ExpenseByCategoryChart'
import RecurringTrendsChart from '@/components/finances/RecurringTrendsChart'
import CashFlowForecast from '@/components/finances/CashFlowForecast'
import { Helmet } from 'react-helmet-async'

type Income = {
  id: string
  amount: number
  date: string
}

type Expense = {
  id: string
  amount: number
  date: string
}

type RecurringExpense = {
  id: string
  amount: number
  created_date: string
}

type TangibleAsset = {
  id: string
  current_value?: number
  purchase_price?: number
  created_date: string
}

export default function Assets() {
  const { data: income = [] } = useQuery<Income[]>({
    queryKey: ['income'],
    queryFn: () => backend.entities.Income.list('-date') as Promise<Income[]>
  })

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => backend.entities.Expense.list('-date') as Promise<Expense[]>
  })

  const { data: recurringIncome = [] } = useQuery({
    queryKey: ['recurring-income'],
    queryFn: () => backend.entities.RecurringIncome.list('-created_date')
  })

  const { data: recurringExpenses = [] } = useQuery<RecurringExpense[]>({
    queryKey: ['recurring-expenses'],
    queryFn: () =>
      backend.entities.RecurringExpense.list('-created_date') as Promise<RecurringExpense[]>
  })

  const { data: tangibleAssets = [] } = useQuery<TangibleAsset[]>({
    queryKey: ['tangible-assets'],
    queryFn: () => backend.entities.TangibleAsset.list('-created_date') as Promise<TangibleAsset[]>
  })

  const totalIncome = income.reduce((sum, item) => sum + (item.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0)
  const netCashFlow = totalIncome - totalExpenses
  const totalAssetValue = tangibleAssets.reduce(
    (sum, asset) => sum + (asset.current_value || asset.purchase_price || 0),
    0
  )

  return (
    <>
      <Helmet>
        <title>Assets | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Assets Overview</h1>
            <p className="text-slate-600">Financial insights and wealth management</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm text-slate-600">Total Income</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">${totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-sm text-slate-600">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm text-slate-600">Net Cash Flow</span>
              </div>
              <p
                className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                ${netCashFlow.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-slate-600">Asset Value</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                ${totalAssetValue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Cash Flow Forecast */}
          <div className="mb-8">
            <CashFlowForecast
              recurringIncome={recurringIncome}
              recurringExpenses={recurringExpenses}
            />
          </div>

          {/* Financial Reports */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Financial Reports</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IncomeVsExpenseChart income={income} expenses={expenses} />
              <ExpenseByCategoryChart expenses={expenses} />
            </div>

            <RecurringTrendsChart
              recurringIncome={recurringIncome}
              recurringExpenses={recurringExpenses}
            />
          </div>
        </div>
      </div>
    </>
  )
}
