import { useState } from 'react'
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
import { useProblemsQuery } from '@/hooks/problems/useProblemsQuery'
import { useProblemMutations } from '@/hooks/problems/useProblemMutations'
import { CreateProblemInput } from '@/repositories/problem.repository'
import { ProblemRecord } from '@/db'

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
} as const

interface ProblemSectionProps {
  category: string
  onCreateTask?: (data: any) => void
}

export default function ProblemSection({ category, onCreateTask }: ProblemSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingProblem, setEditingProblem] = useState<any | null>(null)

  const { data: problems = [] } = useProblemsQuery({ category })

  const { createMutation, updateMutation, deleteMutation } = useProblemMutations()

  const handleCreateProblem = async (data: CreateProblemInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
    }
  }

  const handleUpdateProblem = async ({
    id,
    data
  }: {
    id: string
    data: Partial<ProblemRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingProblem(null)
    }
  }

  const handleDeleteProblem = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
    }
  }

  const handleSubmit = (data: any): void => {
    if (editingProblem) {
      handleUpdateProblem({ id: editingProblem.id, data: { ...data, category } })
    } else {
      handleCreateProblem({ ...data, category })
    }
  }

  const handleEdit = (problem: any): void => {
    setEditingProblem(problem)
    setShowForm(true)
  }

  const handleResolve = (problem: any): void => {
    handleUpdateProblem({
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
                      onClick={() => handleDeleteProblem(problem.id)}
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
