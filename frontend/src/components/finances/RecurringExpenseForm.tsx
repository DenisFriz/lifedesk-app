import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import {
  PERSONAL_EXPENSE_CATEGORIES,
  BUSINESS_EXPENSE_CATEGORIES,
  EXPENSE_CATEGORIES
} from './categories'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'

export default function RecurringExpenseForm({
  open,
  onClose,
  onSubmit,
  expense,
  isLoading
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  expense?: any
  isLoading?: boolean
}) {
  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order')
  })
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    frequency: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    business_id: ''
  })

  const selectedBusiness = businesses.find(b => String(b.id) === String(formData.business_id))

  useEffect(() => {
    if (expense) {
      setFormData({
        title: expense.title || '',
        amount: expense.amount || '',
        frequency: expense.frequency || 'monthly',
        start_date: expense.start_date || format(new Date(), 'yyyy-MM-dd'),
        category: expense.category || '',
        business_id: expense.business_id || ''
      })
    } else {
      setFormData({
        title: '',
        amount: '',
        frequency: 'monthly',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        business_id: ''
      })
    }
  }, [expense, open])

  const handleSubmit = e => {
    e.preventDefault()
    const dataToSubmit = {
      ...formData,
      amount: parseFloat(formData.amount),
      business_id: formData.business_id === '' ? null : formData.business_id
    }
    onSubmit(dataToSubmit)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Recurring Expense' : 'New Recurring Expense'}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {expense
              ? 'Update the recurring expense details below.'
              : 'Add a new recurring expense.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Rent, Subscription"
              maxLength={200}
              required
            />
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
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business">Life Area (optional)</Label>
            <Select
              value={formData.business_id || '__private__'}
              onValueChange={value =>
                setFormData({
                  ...formData,
                  business_id: value === '__private__' ? '' : value,
                  category: ''
                })
              }
            >
              <SelectTrigger>
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
                    {PERSONAL_EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-rose-600 font-medium">
                        {cat}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                      Business - {selectedBusiness?.name}
                    </div>
                    {BUSINESS_EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-rose-600 font-medium">
                        {cat}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
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
