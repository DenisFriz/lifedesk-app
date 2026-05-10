import React, { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Repeat, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import RecurringExpenseForm from './RecurringExpenseForm'

export default function RecurringExpenseList() {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: items = [] } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: () => backend.entities.RecurringExpense.list('-created_date')
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => backend.entities.RecurringExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
      setShowForm(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      backend.entities.RecurringExpense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
      setShowForm(false)
      setEditingItem(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.entities.RecurringExpense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
    }
  })

  const handleSubmit = (data: Record<string, any>) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const toggleActive = (item: any) => {
    updateMutation.mutate({ id: item.id, data: { active: !item.active } })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowForm(true)} className="bg-rose-600 hover:bg-rose-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Recurring Expense
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No recurring expenses yet</p>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{item.title}</h3>
                    {item.active ? (
                      <Badge className="bg-rose-50 text-rose-700">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{item.frequency}</p>
                </div>
                <p className="text-lg font-semibold text-rose-600">
                  -${item.amount.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleActive(item)}
                  title={item.active ? 'Mark Inactive' : 'Mark Active'}
                >
                  {item.active ? (
                    <XCircle className="h-4 w-4 text-slate-400" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditingItem(item)
                    setShowForm(true)
                  }}
                >
                  <Pencil className="h-4 w-4 text-slate-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <RecurringExpenseForm
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingItem(null)
        }}
        onSubmit={handleSubmit}
        expense={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
