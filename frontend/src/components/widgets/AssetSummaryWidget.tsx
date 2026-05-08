import React from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Wallet, DollarSign, TrendingUp, Package } from 'lucide-react'
import { formatCurrency } from '@/components/utils/formatters'
import type { Income, Expense, TangibleAsset } from '@/types/entities'

export default function AssetSummaryWidget() {
  const { data: income = [] } = useQuery({
    queryKey: ['income'],
    queryFn: () => backend.entities.Income.list('-date') as Promise<Income[]>
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => backend.entities.Expense.list('-date') as Promise<Expense[]>
  })

  const { data: tangibleAssets = [] } = useQuery({
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

  const stats = [
    {
      label: 'Net Cash Flow',
      value: formatCurrency(netCashFlow),
      icon: DollarSign,
      color: netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
    },
    {
      label: 'Total Income',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      label: 'Asset Value',
      value: formatCurrency(totalAssetValue),
      icon: Package,
      color: 'text-amber-600'
    }
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Asset Summary</h3>
      </div>
      <div className="space-y-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-sm text-slate-600">{stat.label}</span>
              </div>
              <span className={`text-sm font-semibold ${stat.color}`}>{stat.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
