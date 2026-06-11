import React, { useState, useEffect } from 'react'
import { backend } from '@/api/backend'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Repeat, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import {
  PERSONAL_INCOME_CATEGORIES,
  BUSINESS_INCOME_CATEGORIES,
  PERSONAL_EXPENSE_CATEGORIES,
  BUSINESS_EXPENSE_CATEGORIES
} from './categories'
import { useRecurringIncomesMutations } from '@/hooks/recurringincomes/useRecurringIncomeMutations'
import { CreateRecurringIncomeInput } from '@/repositories/recurring-income.repository'
import { useAuth } from '@/lib/AuthContext'
import { useBusinessesQuery } from '@/hooks/businesses/useBusinessesQuery'

type Business = {
  id: string
  name: string
  categories?: string[]
}

type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

type FormState = {
  title: string
  amount: string
  frequency: Frequency
  start_date: string
  category: string
  business_id: string
}

export default function AddToBudgetModal({
  open,
  onClose,
  transaction
}: {
  open: boolean
  onClose: () => void
  transaction?: any
}) {
  const isIncome = transaction?.type === 'income'

  const { data: businesses = [] } = useBusinessesQuery()

  const queryClient = useQueryClient()

  const { user } = useAuth()
  const { createMutation } = useRecurringIncomesMutations()

  const expenseCreateMutation = useMutation({
    mutationFn: (data: any) => backend.entities.RecurringExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringexpenses'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const [formData, setFormData] = useState<FormState>({
    title: '',
    amount: '',
    frequency: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    business_id: ''
  })

  const handleCreateRecurringIncome = async (data: CreateRecurringIncomeInput) => {
    try {
      await createMutation.mutateAsync(data)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (transaction && open) {
      setFormData({
        title: transaction.title || '',
        amount: transaction.amount || '',
        frequency: 'monthly',
        start_date: transaction.date || format(new Date(), 'yyyy-MM-dd'),
        category: transaction.category || '',
        business_id: transaction.business_id || ''
      })
    }
  }, [transaction, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      business_id:
        formData.business_id === '' || formData.business_id === '__private__'
          ? null
          : formData.business_id,
      created_by: user.id,
      active: true
    }
    if (isIncome) {
      await handleCreateRecurringIncome(payload)
    } else {
      try {
        await expenseCreateMutation.mutateAsync(payload)
        onClose()
      } catch (e) {
        console.error(e)
      }
    }
  }

  const selectedBusiness = businesses.find(b => String(b.id) === String(formData.business_id))
  const categories = isIncome
    ? !formData.business_id || formData.business_id === '__private__'
      ? PERSONAL_INCOME_CATEGORIES
      : BUSINESS_INCOME_CATEGORIES
    : !formData.business_id || formData.business_id === '__private__'
      ? PERSONAL_EXPENSE_CATEGORIES
      : BUSINESS_EXPENSE_CATEGORIES

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className={`w-5 h-5 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`} />
            Add to Budget
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            This will create a recurring {isIncome ? 'income' : 'expense'} entry in your budget.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(v: Frequency) => setFormData({ ...formData, frequency: v })}
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
            <Label>Life Area (optional)</Label>
            <Select
              value={formData.business_id || '__private__'}
              onValueChange={v =>
                setFormData({
                  ...formData,
                  business_id: v === '__private__' ? '' : v,
                  category: ''
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Personal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__private__">Personal</SelectItem>
                {businesses.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category (optional)</Label>
            <Select
              value={formData.category}
              onValueChange={v => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || expenseCreateMutation.isPending}
              className={`flex-1 ${isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {createMutation.isPending || expenseCreateMutation.isPending
                ? 'Saving...'
                : 'Add to Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
