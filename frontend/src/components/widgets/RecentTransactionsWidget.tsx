import React from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatDateMedium } from '@/components/utils/formatters'
import type { Income, Expense } from '@/types/entities'

export default function RecentTransactionsWidget() {
  const { data: income = [] } = useQuery({
    queryKey: ['income-recent'],
    queryFn: () => backend.entities.Income.list('-date', 5) as Promise<Income[]>
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-recent'],
    queryFn: () => backend.entities.Expense.list('-date', 5) as Promise<Expense[]>
  })

  type Transaction = (Income & { type: 'income' }) | (Expense & { type: 'expense' })

  const transactions: Transaction[] = [
    ...income.map(i => ({ ...i, type: 'income' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
      </div>
      {transactions.length === 0 ? (
        <p className="text-sm text-slate-500">No recent transactions</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                {t.type === 'income' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.description}</p>
                  <p className="text-xs text-slate-500">
                    {formatDateMedium(t.date).replace(/,?\s*\d{4}$/, '')}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {t.type === 'income' ? '+' : '-'}
                {formatCurrency(t.amount).replace(/^[€$£]/, '')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
