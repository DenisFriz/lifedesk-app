import React, { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Plus, TrendingDown, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import ExpenseForm from './ExpenseForm'

export default function ExpenseSection() {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => backend.entities.Expense.list('-date')
  })

  const createMutation = useMutation({
    mutationFn: data => backend.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setShowForm(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => backend.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setShowForm(false)
      setEditingItem(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: id => backend.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })

  const handleSubmit = data => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Expense Entries</h2>
        <Button onClick={() => setShowForm(true)} className="bg-rose-600 hover:bg-rose-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="space-y-3">
        {expenses.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No expenses recorded yet</p>
        ) : (
          expenses.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                    {item.category && <span>• {item.category}</span>}
                  </div>
                </div>
                <p className="text-lg font-semibold text-rose-600">
                  -${item.amount.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
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

      <ExpenseForm
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
