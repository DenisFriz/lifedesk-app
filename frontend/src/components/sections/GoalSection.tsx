import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Target, MoreHorizontal, Pencil, Trash2, CheckCircle, Star } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import GoalForm from './GoalForm'
import { useGoalsQuery } from '@/hooks/goals/useGoalsQuery'
import { useGoalMutations } from '@/hooks/goals/useGoalMutations'
import { GoalCreateInput } from '@/repositories/goal.repository'

interface GoalSectionProps {
  category: string
  onCreateTask?: (data: any) => void
}

export default function GoalSection({ category, onCreateTask }: GoalSectionProps) {
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editingGoal, setEditingGoal] = useState<any | null>(null)

  const { data: goals = [] } = useGoalsQuery({ category })

  const { updateMutation, createMutation, deleteMutation } = useGoalMutations()

  const handleCreateGoal = async (data: GoalCreateInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
    }
  }

  const handleUpdateGoal = async ({ id, data }: { id: string; data: any }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingGoal(null)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteMutation.mutateAsync(goalId)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingGoal(null)
    }
  }

  const handleSubmit = (data: any): void => {
    if (editingGoal) {
      handleUpdateGoal({ id: editingGoal.id, data: { ...data, category } })
    } else {
      handleCreateGoal({ ...data, status: 'active', category })
    }
  }

  const handleEdit = (goal: any): void => {
    setEditingGoal(goal)
    setShowForm(true)
  }

  const handleAchieve = (goal: any): void => {
    handleUpdateGoal({
      id: goal.id,
      data: { status: goal.status === 'achieved' ? 'active' : 'achieved' }
    })
  }

  const toggleImportant = (goal: any): void => {
    updateMutation.mutate({
      id: goal.id,
      data: { important: !goal.important }
    })
  }

  const activeGoals = goals.filter(g => g.status === 'active')

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Goals</h2>
          <Badge variant="secondary" className="bg-slate-100">
            {activeGoals.length}
          </Badge>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {activeGoals.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            No goals set. Start by adding one!
          </p>
        ) : (
          activeGoals.map(goal => (
            <div
              key={goal.id}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => toggleImportant(goal)} className="flex-shrink-0">
                      <Star
                        className={cn(
                          'w-5 h-5',
                          goal.important
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 hover:text-slate-400'
                        )}
                      />
                    </button>
                    <h3 className="font-medium text-slate-900">{goal.title}</h3>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-slate-600 mb-2 ml-7">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap ml-7">
                    {goal.target_date && (
                      <span className="text-xs text-slate-500">
                        Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() =>
                        onCreateTask({ goal_id: goal.id, title: `Work on: ${goal.title}` })
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
                    <DropdownMenuItem onClick={() => handleEdit(goal)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAchieve(goal)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark achieved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteGoal(goal.id)}
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

      <GoalForm
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingGoal(null)
        }}
        onSubmit={handleSubmit}
        goal={editingGoal}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
