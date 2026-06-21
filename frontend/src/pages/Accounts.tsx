import { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2,
  Plus,
  Trash2,
  Pencil,
  Landmark,
  ChevronDown,
  ChevronUp,
  Lock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import BankBalanceChart, { resolveRange } from '@/components/finances/BankBalanceChart'
import BankConnectionManager from '@/components/finances/BankConnectionManager'
import OfflineAccountMonthlyTable from '@/components/finances/OfflineAccountMonthlyTable'
import OnlineAccountMonthlyTable from '@/components/finances/OnlineAccountMonthlyTable'
import { formatCurrency } from '@/components/utils/formatters'
import { Helmet } from 'react-helmet-async'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useIncomesQuery } from '@/hooks/incomes/useIncomesQuery'
import { useExpensesQuery } from '@/hooks/expenses/useExpensesQuery'
import { useOfflineAccountsQuery } from '@/hooks/offlineaccounts/useOfflineAccountsQuery'
import { useOfflineAccountMutations } from '@/hooks/offlineaccounts/useOfflineAccountMutations'
import { CreateOfflineAccountInput } from '@/repositories/offline-account.repository'
import { OfflineAccountRecord } from '@/db'
import { useAuth } from '@/lib/AuthContext'
import { useOfflineAccountSnapshotsQuery } from '@/hooks/offlineaccountsnapshot/useOfflineAccountSnapshots'

const CHANGE_PERIOD_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'last_12', label: 'Last 12 Months' },
  { value: 'last_24', label: 'Last 2 Years' },
  { value: 'all_time', label: 'All Time' }
] as const

const CURRENCIES = [
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'CZK',
  'PLN',
  'HUF',
  'RON',
  'BGN',
  'DKK',
  'SEK',
  'NOK'
] as const

function OfflineAccountForm({
  account,
  onSubmit,
  onClose
}: {
  account?: OfflineAccount
  onSubmit: (data: CreateOfflineAccountInput) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: account?.name || '',
    balance: account?.balance ?? '',
    currency: account?.currency || 'EUR',
    notes: account?.notes || ''
  })

  const { user } = useAuth()

  const handleSubmit = (e: any) => {
    e.preventDefault()
    onSubmit({ ...form, balance: account?.balance ?? 0, created_by: user.id })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Account Name</label>
        <Input
          placeholder="e.g. Savings at SparkBank"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Currency</label>
        <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {CURRENCIES.map(c => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Notes (optional)</label>
        <Input
          placeholder="Notes..."
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          {account ? 'Update' : 'Add Account'}
        </Button>
      </div>
    </form>
  )
}

function OnlineBankAccountCard({ account }) {
  const storageKey = `account-expanded-online-${account.account_id}`
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved === null ? true : saved === 'true'
  })
  const toggle = () =>
    setExpanded(e => {
      const next = !e
      localStorage.setItem(storageKey, String(next))
      return next
    })

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={toggle}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{account.name}</p>
            {account.institution_name && (
              <p className="text-xs text-slate-400 truncate">{account.institution_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <div className="text-right mr-1">
            <p className="font-semibold text-slate-900 text-sm">
              {formatCurrency(account.balance, account.currency)}
            </p>
            <p className="text-xs text-slate-400">{account.currency || 'EUR'}</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100">
          <OnlineAccountMonthlyTable account={account} />
        </div>
      )}
    </div>
  )
}

function OfflineAccountCard({ account, latestBalance, onEdit, onDelete, isOverLimit }) {
  const storageKey = `account-expanded-offline-${account.id}`
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved === null ? true : saved === 'true'
  })
  const toggle = () =>
    setExpanded(e => {
      const next = !e
      localStorage.setItem(storageKey, String(next))
      return next
    })

  return (
    <div
      className={`bg-white rounded-xl border flex flex-col ${isOverLimit ? 'border-amber-300 opacity-75' : 'border-slate-200'}`}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={toggle}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isOverLimit ? (
            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : (
            <Landmark className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{account.name}</p>
            {isOverLimit ? (
              <p className="text-xs text-amber-600">
                Over plan limit - read only.{' '}
                <Link to="/upgrade" className="underline">
                  Upgrade
                </Link>
              </p>
            ) : (
              account.notes && <p className="text-xs text-slate-400 truncate">{account.notes}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <div className="text-right mr-1">
            <p className="font-semibold text-slate-900 text-sm">
              {latestBalance !== null ? formatCurrency(latestBalance, account.currency) : '—'}
            </p>
            <p className="text-xs text-slate-400">{account.currency}</p>
          </div>
          {!isOverLimit && (
            <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(account)}
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${account.name}"? This will also delete all its monthly entries.`
                    )
                  )
                    onDelete(account.id)
                }}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </Button>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Monthly table */}
      {expanded && (
        <div className="border-t border-slate-100">
          <OfflineAccountMonthlyTable account={account} readOnly={isOverLimit} />
        </div>
      )}
    </div>
  )
}

type BankAccount = {
  account_id: string
  name: string
  balance: number
  currency?: string
  institution_name?: string
}

type PlaidBalancesResponse = {
  data: {
    accounts: BankAccount[]
  }
}

type OfflineAccount = {
  id: string
  name: string
  balance: number
  currency: string
  notes?: string
  is_deleted: boolean
  created_date: string
}

export default function Accounts() {
  const queryClient = useQueryClient()
  const [showBankConnect, setShowBankConnect] = useState(false)
  const [showOfflineForm, setShowOfflineForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [changePeriod, setChangePeriod] = useState('this_month')

  const { canCreate, data: UserLimitData } = useUserLimit()

  const atLimit = !canCreate('offlineBankAccount')

  const { data: offlineAccounts = [] } = useOfflineAccountsQuery()

  const { data: allSnapshots = [] } = useOfflineAccountSnapshotsQuery()

  // Compute latest snapshot balance per account
  const latestBalanceByAccount = useMemo(() => {
    const map = {}
    allSnapshots.forEach(s => {
      if (!map[s.account_id] || s.date > map[s.account_id].date) {
        map[s.account_id] = s
      }
    })
    return map
  }, [allSnapshots])

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ['plaid-balances'],
    queryFn: async () => {
      const res = (await backend.functions.invoke('plaid', {
        action: 'get_balances'
      })) as PlaidBalancesResponse

      return res.data.accounts || []
    }
  })

  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + (a.balance || 0), 0)

  const { data: income = [] } = useIncomesQuery()

  const { data: expenses = [] } = useExpensesQuery()

  const { createMutation, updateMutation, deleteMutation } = useOfflineAccountMutations()

  const handleCreateOfflineAccount = async (data: CreateOfflineAccountInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowOfflineForm(false)
    }
  }

  const handleUpdateOfflineAccount = async ({
    id,
    data
  }: {
    id: string
    data: Partial<OfflineAccountRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setEditingAccount(false)
    }
  }

  const handleDeleteOfflineAccount = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    }
  }

  const totalOfflineBalance = offlineAccounts.reduce((sum, a) => {
    const snap = latestBalanceByAccount[a.id]
    return sum + (snap ? snap.balance : 0)
  }, 0)

  // Total Change: for each account, find the last snapshot <= rangeEnd and the last snapshot < rangeStart,
  // then sum the difference (end balance - start balance).
  const totalChange = useMemo(() => {
    const { rangeStart, rangeEnd } = resolveRange(changePeriod)
    const startStr = format(rangeStart, 'yyyy-MM-dd')
    const endStr = format(rangeEnd, 'yyyy-MM-dd')

    // Group all snapshots by account
    const byAccount: Record<string, any> = {}
    allSnapshots.forEach(s => {
      if (!byAccount[s.account_id]) byAccount[s.account_id] = []
      byAccount[s.account_id].push(s)
    })

    let delta = 0
    let hasAny = false

    Object.values(byAccount).forEach(snaps => {
      // Last snapshot on or before rangeEnd
      const endSnap = snaps
        .filter(s => s.date <= endStr)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      // Last snapshot strictly before rangeStart
      const startSnap = snaps
        .filter(s => s.date < startStr)
        .sort((a, b) => b.date.localeCompare(a.date))[0]

      if (endSnap) {
        hasAny = true
        delta += endSnap.balance - (startSnap ? startSnap.balance : 0)
      }
    })

    if (!hasAny) return null
    return parseFloat(delta.toFixed(2))
  }, [allSnapshots, changePeriod])

  return (
    <>
      <Helmet>
        <title>Accounts | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left flex items-center justify-center lg:justify-start gap-3">
                <Landmark className="w-8 h-8 sm:w-9 sm:h-9" />
                Accounts
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 text-center lg:text-left">
                Manage your bank connections and offline accounts in one place.
              </p>
            </div>
            <div className="flex flex-row items-center max-[320px]:flex-col gap-2">
              <Button
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                onClick={() => setShowBankConnect(true)}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Connect Bank
              </Button>
              {(() => {
                const offlineLimit = UserLimitData?.limits?.offlineBankAccount || 0
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => !atLimit && setShowOfflineForm(true)}
                            disabled={atLimit}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Offline Account
                            {atLimit && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-70" />}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {atLimit && (
                        <TooltipContent>
                          <p>
                            Limit reached ({offlineLimit} offline account
                            {offlineLimit !== 1 ? 's' : ''} on your plan).{' '}
                            <Link to="/upgrade" className="underline">
                              Upgrade
                            </Link>{' '}
                            for more.
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })()}
            </div>
          </div>

          {/* Balance Summary */}
          {offlineAccounts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-indigo-200 p-5">
                <p className="text-sm text-slate-600 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalOfflineBalance)}
                </p>
                <p className="text-xs text-slate-400 mt-1">All accounts combined</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-600 mb-1">Connected Bank Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalBankBalance)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {bankAccounts.length} bank account{bankAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-600 mb-1">Total Offline Balance</p>
                <p className="text-2xl font-bold text-orange-500">
                  {formatCurrency(totalOfflineBalance)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {offlineAccounts.length} offline account{offlineAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-600">Total Change</p>
                  <Select value={changePeriod} onValueChange={setChangePeriod}>
                    <SelectTrigger className="h-8 text-sm w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANGE_PERIOD_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p
                  className={`text-2xl font-bold ${totalChange === null ? 'text-slate-400' : totalChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {totalChange === null
                    ? '—'
                    : (totalChange >= 0 ? '+' : '') + formatCurrency(totalChange)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {CHANGE_PERIOD_OPTIONS.find(o => o.value === changePeriod)?.label}
                </p>
              </div>
            </div>
          )}

          {/* Balance Over Time Chart */}
          {(bankAccounts.length > 0 ||
            offlineAccounts.length > 0 ||
            income.length > 0 ||
            expenses.length > 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <BankBalanceChart income={income} expenses={expenses} />
            </div>
          )}

          {/* Connected Bank Accounts with Monthly Tables */}
          {bankAccounts.length > 0 && (
            <div className="space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Connected Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {bankAccounts.map(account => (
                  <OnlineBankAccountCard key={account.account_id} account={account} />
                ))}
              </div>
            </div>
          )}

          {/* Offline Accounts with Monthly Tables */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Offline Accounts</h2>
            </div>

            {offlineAccounts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 text-center py-10 text-slate-400">
                <Landmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No offline accounts yet.</p>
                <p className="text-xs mt-1">
                  Add accounts like savings, cash, or accounts that can't be connected
                  automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {offlineAccounts.map(account => (
                  <OfflineAccountCard
                    key={account.id}
                    account={account}
                    latestBalance={latestBalanceByAccount[account.id]?.balance ?? null}
                    onEdit={setEditingAccount}
                    onDelete={id => handleDeleteOfflineAccount(id)}
                    isOverLimit={atLimit}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Offline Account Dialog */}
        <Dialog open={showOfflineForm} onOpenChange={setShowOfflineForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Offline Account</DialogTitle>
            </DialogHeader>
            <OfflineAccountForm
              onSubmit={data => handleCreateOfflineAccount(data)}
              onClose={() => setShowOfflineForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Offline Account Dialog */}
        <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
            </DialogHeader>
            {editingAccount && (
              <OfflineAccountForm
                account={editingAccount}
                onSubmit={data => handleUpdateOfflineAccount({ id: editingAccount.id, data })}
                onClose={() => setEditingAccount(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Bank Connection Manager */}
        <BankConnectionManager
          open={showBankConnect}
          onClose={() => setShowBankConnect(false)}
          canConnectBank={atLimit}
          realBankAccountsLimit={UserLimitData?.limits?.offlineBankAccount}
          onTransactionsImported={() => {
            queryClient.invalidateQueries({ queryKey: ['income'] })
            queryClient.invalidateQueries({ queryKey: ['expenses'] })
          }}
        />
      </div>
    </>
  )
}
