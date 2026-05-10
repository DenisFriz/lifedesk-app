import React, { useState } from 'react'
import { backend } from '@/api/backend'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function TransactionForm({
  type,
  transaction,
  onClose
}: {
  type: 'income' | 'expense'
  transaction?: any
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: transaction?.title || '',
    amount: transaction?.amount || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
    category: transaction?.category || '',
    notes: transaction?.notes || ''
  })

  const entityName = type === 'income' ? 'Income' : 'Expense'

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => backend.entities[entityName].create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName.toLowerCase()] })
      onClose()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      backend.entities[entityName].update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName.toLowerCase()] })
      onClose()
    }
  })

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const data = {
      ...formData,
      amount: parseFloat(formData.amount)
    }

    if (transaction) {
      updateMutation.mutate({ id: transaction.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Salary, Groceries"
              required
            />
          </div>

          <div>
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

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Food, Transportation"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className={
                type === 'income'
                  ? 'flex-1 bg-emerald-600 hover:bg-emerald-700'
                  : 'flex-1 bg-rose-600 hover:bg-rose-700'
              }
            >
              {transaction ? 'Update' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
