import React, { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, AlertCircle, MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import ProblemForm from './ProblemForm'

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

interface ProblemSectionProps {
  category: string
  onCreateTask?: (data: any) => void
}

export default function ProblemSection({ category, onCreateTask }: ProblemSectionProps) {
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editingProblem, setEditingProblem] = useState<any | null>(null)
  const queryClient = useQueryClient()

  const { data: problems = [] } = useQuery<any[]>({
    queryKey: ['problems', category],
    queryFn: () => backend.entities.Problem.filter({ category })
  })

  const createMutation = useMutation<any, any, any>({
    mutationFn: data => backend.entities.Problem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', category] })
      setShowForm(false)
    }
  })

  const updateMutation = useMutation<any, any, { id: string; data: any }>({
    mutationFn: ({ id, data }) => backend.entities.Problem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', category] })
      setShowForm(false)
      setEditingProblem(null)
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: id => backend.entities.Problem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', category] })
    }
  })

  const handleSubmit = (data: any): void => {
    if (editingProblem) {
      updateMutation.mutate({ id: editingProblem.id, data: { ...data, category } })
    } else {
      createMutation.mutate({ ...data, category })
    }
  }

  const handleEdit = (problem: any): void => {
    setEditingProblem(problem)
    setShowForm(true)
  }

  const handleResolve = (problem: any): void => {
    updateMutation.mutate({
      id: problem.id,
      data: { status: problem.status === 'resolved' ? 'active' : 'resolved' }
    })
  }

  const activeProblems = problems.filter((p: any) => p.status === 'active')

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <h2 className="text-lg font-semibold text-slate-900">Problems</h2>
          <Badge variant="secondary" className="bg-slate-100">
            {activeProblems.length}
          </Badge>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          className="bg-rose-600 hover:bg-rose-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {activeProblems.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No active problems. Great!</p>
        ) : (
          activeProblems.map(problem => (
            <div
              key={problem.id}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 mb-1">{problem.title}</h3>
                  {problem.description && (
                    <p className="text-sm text-slate-600 mb-2">{problem.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', priorityColors[problem.priority])}
                    >
                      {problem.priority}
                    </Badge>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() =>
                        onCreateTask({ problem_id: problem.id, title: `Fix: ${problem.title}` })
                      }
                      className="h-auto p-0 text-xs text-indigo-600"
                    >
                      Create task
                    </Button>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(problem)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResolve(problem)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteMutation.mutate(problem.id)}
                      className="text-rose-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      <ProblemForm
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingProblem(null)
        }}
        onSubmit={handleSubmit}
        problem={editingProblem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
