import React, { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Repeat, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import RecurringIncomeForm from './RecurringIncomeForm'

export default function RecurringIncomeList() {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: items = [] } = useQuery({
    queryKey: ['recurring-income'],
    queryFn: () => backend.entities.RecurringIncome.list('-created_date')
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => backend.entities.RecurringIncome.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-income'] })
      setShowForm(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      backend.entities.RecurringIncome.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-income'] })
      setShowForm(false)
      setEditingItem(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.entities.RecurringIncome.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-income'] })
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
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Recurring Income
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No recurring income yet</p>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{item.title}</h3>
                    {item.active ? (
                      <Badge className="bg-emerald-50 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{item.frequency}</p>
                </div>
                <p className="text-lg font-semibold text-emerald-600">
                  ${item.amount.toLocaleString()}
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

      <RecurringIncomeForm
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingItem(null)
        }}
        onSubmit={handleSubmit}
        income={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
