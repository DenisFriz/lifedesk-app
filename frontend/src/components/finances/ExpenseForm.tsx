import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { categorizeTransaction } from './transactionCategorizer'
import { PERSONAL_CATEGORIES, BUSINESS_CATEGORIES, EXPENSE_CATEGORIES } from './categories'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'

interface ExpenseFormData {
  title: string
  amount: string
  date: string
  category: string
  business_id: string
  bank_account_name: string
  notes: string
  frequency: string
  start_date: string
}

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ExpenseFormData) => void
  expense?: any
  isLoading?: boolean
  defaultBusinessId?: string | null
}

export default function ExpenseForm({
  open,
  onClose,
  onSubmit,
  expense,
  isLoading,
  defaultBusinessId
}: ExpenseFormProps) {
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    business_id: '',
    bank_account_name: '',
    notes: '',
    frequency: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd')
  })

  const { data: businesses = [] } = useQuery<any[]>({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order')
  })

  const { data: offlineAccounts = [] } = useQuery<any[]>({
    queryKey: ['offline-accounts'],
    queryFn: () => backend.entities.OfflineAccount.list('name')
  })

  const selectedBusiness = businesses.find(b => String(b.id) === String(formData.business_id))

  useEffect(() => {
    if (expense) {
      setIsRecurring(false)
      setFormData({
        title: expense.title || '',
        amount: expense.amount || '',
        date: expense.date || format(new Date(), 'yyyy-MM-dd'),
        category: expense.category || '',
        business_id: expense.business_id || '',
        bank_account_name: expense.bank_account_name || '',
        notes: expense.notes || '',
        frequency: 'monthly',
        start_date: format(new Date(), 'yyyy-MM-dd')
      })
    } else {
      setIsRecurring(false)
      setFormData({
        title: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        business_id: defaultBusinessId || '',
        bank_account_name: '',
        notes: '',
        frequency: 'monthly',
        start_date: format(new Date(), 'yyyy-MM-dd')
      })
    }
  }, [expense, open, defaultBusinessId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) as any,
      isRecurring
    } as any)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'New Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={async e => {
                const title = e.target.value

                setFormData(prev => ({
                  ...prev,
                  title
                }))

                if (title && !expense) {
                  const result = await categorizeTransaction(title)

                  if (result.category !== 'Uncategorized') {
                    setFormData(prev => ({
                      ...prev,
                      category: result.category
                    }))
                  }
                }
              }}
              placeholder="e.g., Rent, Groceries"
              maxLength={200}
              required
            />
          </div>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="recurring"
              name="recurring"
              checked={isRecurring}
              onCheckedChange={prev => setIsRecurring(!!prev)}
            />
            <label
              htmlFor="recurring"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Recurring expense
            </label>
          </div>

          <div className="grid grid-cols-2 max-[320px]:grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            {isRecurring ? (
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={value => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger id="frequency">
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
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            )}
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="business">Life Area (optional)</Label>
            <Select
              value={formData.business_id || '__private__'}
              onValueChange={value => {
                const newBusinessId = value === '__private__' ? '' : value
                setFormData({ ...formData, business_id: newBusinessId, category: '' })
              }}
            >
              <SelectTrigger id="business">
                <SelectValue placeholder="Personal expense" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__private__">Personal</SelectItem>
                {businesses.map(business => (
                  <SelectItem key={business.id} value={String(business.id)}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              Category (auto-suggested)
              {formData.category && <Sparkles className="w-3 h-3 text-amber-500" />}
            </Label>
            <Select
              value={formData.category}
              onValueChange={value => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {!formData.business_id ? (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Personal</div>
                    {PERSONAL_CATEGORIES.filter(cat => EXPENSE_CATEGORIES.includes(cat)).map(
                      cat => (
                        <SelectItem key={cat} value={cat} className="text-rose-600 font-medium">
                          {cat}
                        </SelectItem>
                      )
                    )}
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                      Business - {selectedBusiness?.name}
                    </div>
                    {BUSINESS_CATEGORIES.filter(cat => EXPENSE_CATEGORIES.includes(cat)).map(
                      cat => (
                        <SelectItem key={cat} value={cat} className="text-rose-600 font-medium">
                          {cat}
                        </SelectItem>
                      )
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          {!isRecurring && offlineAccounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bank_account_name">Bank Account (optional)</Label>
              <Select
                value={formData.bank_account_name || '__none__'}
                onValueChange={value =>
                  setFormData({ ...formData, bank_account_name: value === '__none__' ? '' : value })
                }
              >
                <SelectTrigger id="bank_account_name">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {offlineAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.name}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              maxLength={5000}
              className="min-h-[60px]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              {isLoading ? 'Saving...' : expense ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
