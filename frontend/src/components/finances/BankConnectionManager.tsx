import { useState, useMemo, useEffect, useCallback } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Building2,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  BarChart2,
  Lock
} from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './categories'
import { Link } from 'react-router-dom'
import { incomeRepository } from '@/repositories/income.repository'
import { expenseRepository } from '@/repositories/expense.repository'

function PlaidLinkButton({
  onSuccess,
  disabled
}: {
  onSuccess: (token: string, name: string) => void
  disabled: boolean
}) {
  const [linkToken, setLinkToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plaidLoaded, setPlaidLoaded] = useState(false)

  useEffect(() => {
    // Load Plaid Link script
    if ((window as any).Plaid) {
      setPlaidLoaded(true)
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
      script.onload = () => setPlaidLoaded(true)
      document.head.appendChild(script)
    }

    backend.functions
      .invoke('plaid', { action: 'create_link_token' })
      .then((res: { link_token: string }) => setLinkToken(res.link_token))
      .finally(() => setLoading(false))
  }, [])

  const openPlaid = useCallback(() => {
    if (!linkToken || !plaidLoaded) return
    const handler = (window as any).Plaid.create({
      token: linkToken,
      onSuccess: (public_token, metadata) => {
        onSuccess(public_token, metadata?.institution?.name)
      },
      onExit: () => {}
    })
    handler.open()
  }, [linkToken, plaidLoaded, onSuccess])

  return (
    <Button
      onClick={openPlaid}
      disabled={loading || !linkToken || !plaidLoaded || disabled}
      className="w-full bg-indigo-600 hover:bg-indigo-700"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Plus className="w-4 h-4 mr-2" />
      )}
      Connect Bank Account
    </Button>
  )
}

// Map Plaid categories to app categories
function mapPlaidCategory(plaidCategory, isIncome) {
  if (!plaidCategory) return isIncome ? 'Other Income' : 'Other'
  const cat = plaidCategory.toLowerCase()
  if (isIncome) {
    if (cat.includes('payroll') || cat.includes('income') || cat.includes('salary')) return 'Salary'
    if (cat.includes('transfer') || cat.includes('deposit')) return 'Other Income'
    return 'Other Income'
  } else {
    if (cat.includes('food') || cat.includes('restaurant') || cat.includes('dining'))
      return 'Food & Dining'
    if (
      cat.includes('transport') ||
      cat.includes('travel') ||
      cat.includes('taxi') ||
      cat.includes('airline')
    )
      return 'Transportation (Car)'
    if (cat.includes('rent') || cat.includes('mortgage') || cat.includes('housing'))
      return 'Rent & Housing costs'
    if (
      cat.includes('utilities') ||
      cat.includes('electric') ||
      cat.includes('water') ||
      cat.includes('gas')
    )
      return 'Utilities'
    if (cat.includes('health') || cat.includes('medical') || cat.includes('pharma'))
      return 'Healthcare'
    if (cat.includes('insurance')) return 'Insurance'
    if (cat.includes('entertainment') || cat.includes('recreation')) return 'Entertainment'
    if (cat.includes('education')) return 'Education'
    if (
      cat.includes('shop') ||
      cat.includes('retail') ||
      cat.includes('clothing') ||
      cat.includes('merchandise')
    )
      return 'Shopping'
    if (cat.includes('subscription') || cat.includes('streaming')) return 'Subscriptions'
    if (cat.includes('bank') || cat.includes('fee') || cat.includes('interest'))
      return 'Banking & Fees'
    return 'Other'
  }
}

export default function BankConnectionManager({
  open,
  onClose,
  onTransactionsImported,
  canConnectBank = true,
  realBankAccountsLimit = Infinity
}: {
  open: boolean
  onClose: () => void
  onTransactionsImported?: (count: number) => void
  canConnectBank?: boolean
  realBankAccountsLimit?: number
}) {
  const [reviewTransactions, setReviewTransactions] = useState<any[] | null>(null)
  const [importDays, setImportDays] = useState(90)
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const {
    data: connections = [],
    isLoading: loadingConnections,
    refetch: refetchConnections
  } = useQuery({
    queryKey: ['plaid-connections'],
    queryFn: async () => {
      const res = await backend.functions.invoke<{ data: { connections: any[] } }>('plaid', {
        action: 'get_connections'
      })

      return res.data?.connections || []
    },
    enabled: open
  })

  const connectMutation = useMutation({
    mutationFn: async ({
      public_token,
      institution_name
    }: {
      public_token: string
      institution_name: string
    }) => {
      const res = await backend.functions.invoke<any>('plaid', {
        action: 'exchange_public_token',
        public_token,
        institution_name
      })
      return res.data
    },
    onSuccess: async () => {
      refetchConnections()
      queryClient.invalidateQueries({ queryKey: ['plaid-balances'] })
      try {
        await backend.functions.invoke('plaid', { action: 'snapshot_balances' })
      } catch (e) {
        console.error(e)
      }
      queryClient.invalidateQueries({ queryKey: ['bankBalanceSnapshots'] })
    }
  })

  const fetchForReviewMutation = useMutation({
    mutationFn: async ({ days }: { days: number }) => {
      const res = await backend.functions.invoke<any>('plaid', { action: 'get_transactions', days })
      return res.data.transactions || []
    },
    onSuccess: transactions => {
      const withCategories = transactions
        .filter(tx => !tx.pending)
        .map(tx => ({
          ...tx,
          category: mapPlaidCategory(tx.category, tx.amount > 0),
          include: true
        }))
      setReviewTransactions(withCategories)
      setSearchQuery('')
      setFilterType('all')
    }
  })

  const importMutation = useMutation({
    mutationFn: async (txList: any[]) => {
      const toImport = txList.filter(tx => tx.include)
      for (const tx of toImport) {
        const amount = Math.abs(tx.amount)
        const bankAccountName = tx.institution_name || ''
        if (tx.amount > 0) {
          await incomeRepository.create({
            title: tx.title,
            amount,
            date: tx.date,
            notes: tx.subcategory || '',
            category: tx.category || '',
            bank_account_name: bankAccountName,
            is_recurring: false
          })
        } else {
          await expenseRepository.create({
            title: tx.title,
            amount,
            date: tx.date,
            notes: tx.subcategory || '',
            category: tx.category || '',
            bank_account_name: bankAccountName,
            is_recurring: false
          })
        }
      }
      return toImport.length
    },
    onSuccess: imported => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setReviewTransactions(null)
      if (onTransactionsImported) onTransactionsImported(imported)
      onClose()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async item_id => {
      await backend.functions.invoke('plaid', { action: 'remove_connection', item_id })
    },
    onSuccess: () => refetchConnections()
  })

  const updateTxCategory = (idx, category) => {
    setReviewTransactions(prev => prev.map((tx, i) => (i === idx ? { ...tx, category } : tx)))
  }

  const toggleTxInclude = idx => {
    setReviewTransactions(prev =>
      prev.map((tx, i) => (i === idx ? { ...tx, include: !tx.include } : tx))
    )
  }

  const selectAll = val => {
    setReviewTransactions(prev => (prev || []).map(tx => ({ ...tx, include: val })))
  }

  const filteredReview = useMemo(() => {
    if (!reviewTransactions) return []
    return reviewTransactions.filter(tx => {
      const typeMatch =
        filterType === 'all' || (filterType === 'income' ? tx.amount > 0 : tx.amount < 0)
      const searchMatch = !searchQuery || tx.title.toLowerCase().includes(searchQuery.toLowerCase())
      return typeMatch && searchMatch
    })
  }, [reviewTransactions, filterType, searchQuery])

  const categorySummary = useMemo(() => {
    if (!reviewTransactions) return []

    const expenses = reviewTransactions.filter(tx => tx.include && tx.amount < 0)

    const map: Record<string, number> = {}

    for (const tx of expenses) {
      const cat = tx.category || 'Other'
      map[cat] = (map[cat] || 0) + Math.abs(tx.amount)
    }

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [reviewTransactions])

  return (
    <>
      {/* Review & Categorize dialog */}
      <Dialog open={!!reviewTransactions} onOpenChange={() => setReviewTransactions(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Review & Categorize Transactions
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              Plaid suggested categories. Override any before importing.
            </p>
          </DialogHeader>

          {categorySummary.length > 0 && (
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5" /> Spending Preview
              </p>
              <div className="flex flex-wrap gap-2">
                {categorySummary.map(([cat, total]) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-xs"
                  >
                    <span className="text-slate-700 font-medium">{cat}</span>
                    <span className="text-rose-600 font-semibold">{total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 py-2 border-b border-slate-100 flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 min-w-40 h-8 border border-slate-200 rounded-md px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <div className="flex gap-1">
              {['all', 'income', 'expense'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${filterType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
              <button onClick={() => selectAll(true)} className="underline hover:text-slate-800">
                All
              </button>
              <span>/</span>
              <button onClick={() => selectAll(false)} className="underline hover:text-slate-800">
                None
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 py-3 px-6">
            {filteredReview.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">
                No transactions match your filter.
              </p>
            )}
            {filteredReview.map((tx, idx) => {
              const realIdx = reviewTransactions.indexOf(tx)
              return (
                <div
                  key={realIdx}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-opacity ${tx.include ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-40'}`}
                >
                  <input
                    type="checkbox"
                    checked={tx.include}
                    onChange={() => toggleTxInclude(realIdx)}
                    className="accent-indigo-600 w-4 h-4 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{tx.title}</p>
                    <p className="text-xs text-slate-400">
                      {tx.date}
                      {tx.institution_name ? ` · ${tx.institution_name}` : ''}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold flex-shrink-0 ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount.toFixed(2)}
                  </span>
                  <div className="w-48 flex-shrink-0">
                    <Select
                      value={tx.category}
                      onValueChange={val => updateTxCategory(realIdx, val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tx.amount > 0 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 px-6 py-4 border-t border-slate-100">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setReviewTransactions(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => importMutation.mutate(reviewTransactions)}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Import {(reviewTransactions || []).filter(t => t.include).length} Transactions
            </Button>
          </div>
          {importMutation.isError && (
            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 px-6 pb-3 rounded-b-lg">
              <AlertCircle className="w-4 h-4" /> {importMutation.error?.message || 'Import failed'}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Bank Connection Dialog */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Bank Connections
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!canConnectBank && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1 text-sm text-amber-800">
                  <span className="font-semibold">Plus / Pro feature.</span> Connecting real bank
                  accounts is available on Plus and Pro plans.{' '}
                  <Link
                    to="/upgrade"
                    onClick={onClose}
                    className="underline font-semibold hover:text-amber-900"
                  >
                    Upgrade now
                  </Link>
                </div>
              </div>
            )}

            {canConnectBank &&
              connections.length >= realBankAccountsLimit &&
              realBankAccountsLimit !== Infinity && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 text-sm text-amber-800">
                    <span className="font-semibold">Bank account limit reached.</span> Your Plus
                    plan allows {realBankAccountsLimit} connected bank account
                    {realBankAccountsLimit !== 1 ? 's' : ''}.{' '}
                    <Link
                      to="/upgrade"
                      onClick={onClose}
                      className="underline font-semibold hover:text-amber-900"
                    >
                      Upgrade to Pro
                    </Link>{' '}
                    for unlimited connections.
                  </div>
                </div>
              )}

            {loadingConnections ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No bank connected yet</p>
                <p className="text-sm mt-1">
                  Connect your bank to automatically import transactions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map(conn => (
                  <div
                    key={conn.item_id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="font-medium text-sm text-slate-900">
                          {conn.institution_name}
                        </p>
                        <p className="text-xs text-slate-500">Connected via Plaid</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-400 hover:text-rose-600"
                      onClick={() => deleteMutation.mutate(conn.item_id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <PlaidLinkButton
                disabled={
                  connectMutation.isPending ||
                  !canConnectBank ||
                  connections.length >= realBankAccountsLimit
                }
                onSuccess={async (public_token, institution_name) => {
                  await connectMutation.mutateAsync({ public_token, institution_name })
                }}
              />

              {connections.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={importDays}
                    onChange={e => setImportDays(Number(e.target.value))}
                    className="border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value={30}>Last 30 days</option>
                    <option value={60}>Last 60 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={180}>Last 6 months</option>
                    <option value={365}>Last 12 months</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => fetchForReviewMutation.mutate({ days: importDays })}
                    disabled={fetchForReviewMutation.isPending}
                    className="flex-1"
                  >
                    {fetchForReviewMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Import & Categorize
                  </Button>
                </div>
              )}
            </div>

            {(connectMutation.isError || fetchForReviewMutation.isError) && (
              <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {connectMutation.error?.message ||
                  fetchForReviewMutation.error?.message ||
                  'An error occurred'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
