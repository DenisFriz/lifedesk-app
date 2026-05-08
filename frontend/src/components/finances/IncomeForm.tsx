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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { PERSONAL_CATEGORIES, BUSINESS_CATEGORIES, INCOME_CATEGORIES } from './categories'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'

interface IncomeFormData {
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

interface IncomeFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: IncomeFormData) => void
  income?: any
  isLoading?: boolean
}

export default function IncomeForm({
  open,
  onClose,
  onSubmit,
  income,
  isLoading
}: IncomeFormProps) {
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [formData, setFormData] = useState<IncomeFormData>({
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
    if (income) {
      setIsRecurring(false)
      setFormData({
        title: income.title || '',
        amount: income.amount || '',
        date: income.date || format(new Date(), 'yyyy-MM-dd'),
        category: income.category || '',
        business_id: income.business_id || '',
        bank_account_name: income.bank_account_name || '',
        notes: income.notes || '',
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
        business_id: '',
        bank_account_name: '',
        notes: '',
        frequency: 'monthly',
        start_date: format(new Date(), 'yyyy-MM-dd')
      })
    }
  }, [income, open])

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
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{income ? 'Edit Income' : 'New Income'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Salary, Freelance project"
              maxLength={200}
              required
            />
          </div>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={prev => setIsRecurring(!!prev)}
            />
            <label
              htmlFor="recurring"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Recurring income
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
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
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={value => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
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
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            )}
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="business">Life Area (optional)</Label>
            <Select
              value={formData.business_id}
              onValueChange={value =>
                setFormData({ ...formData, business_id: value, category: '' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Personal income" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Personal</SelectItem>
                {businesses.map(business => (
                  <SelectItem key={business.id} value={String(business.id)}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Select
              value={formData.category}
              onValueChange={value => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {!formData.business_id ? (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Personal</div>
                    {PERSONAL_CATEGORIES.filter(cat => INCOME_CATEGORIES.includes(cat)).map(cat => (
                      <SelectItem key={cat} value={cat} className="text-emerald-600 font-medium">
                        {cat}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                      Business - {selectedBusiness?.name}
                    </div>
                    {BUSINESS_CATEGORIES.filter(cat => INCOME_CATEGORIES.includes(cat)).map(cat => (
                      <SelectItem key={cat} value={cat} className="text-emerald-600 font-medium">
                        {cat}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          {!isRecurring && offlineAccounts.length > 0 && (
            <div className="space-y-2">
              <Label>Bank Account (optional)</Label>
              <Select
                value={formData.bank_account_name || '__none__'}
                onValueChange={value =>
                  setFormData({ ...formData, bank_account_name: value === '__none__' ? '' : value })
                }
              >
                <SelectTrigger>
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? 'Saving...' : income ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
