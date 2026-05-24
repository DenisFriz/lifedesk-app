import React, { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, ListTodo, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import TaskFormSimple from './TaskFormSimple'
import { useTasksQuery } from '@/hooks/tasks/useTasksQuery'

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

interface TaskSectionProps {
  category: string
  initialTaskData?: any
}

export default function TaskSection({ category, initialTaskData }: TaskSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const queryClient = useQueryClient()

  const { data: tasks = [] } = useTasksQuery({ category })

  const { data: problems = [] } = useQuery<any[]>({
    queryKey: ['problems', category],
    queryFn: () => backend.entities.Problem.filter({ category })
  })

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ['goals', category],
    queryFn: () => backend.entities.Goal.filter({ category })
  })

  const createMutation = useMutation<any, any, any>({
    mutationFn: data => backend.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', category] })
      setShowForm(false)
    }
  })

  const updateMutation = useMutation<any, any, { id: string; data: any }>({
    mutationFn: ({ id, data }) => backend.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', category] })
      setShowForm(false)
      setEditingTask(null)
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: id => backend.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', category] })
    }
  })

  const handleSubmit = (data: any): void => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: { ...data, category } })
    } else {
      createMutation.mutate({ ...data, category })
    }
  }

  const handleEdit = (task: any): void => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleToggleComplete = (task: any): void => {
    updateMutation.mutate({
      id: task.id,
      data: { status: task.status === 'completed' ? 'pending' : 'completed' }
    })
  }

  React.useEffect(() => {
    if (initialTaskData) {
      setEditingTask(initialTaskData)
      setShowForm(true)
      setTimeout(() => setEditingTask(null), 50)
    }
  }, [initialTaskData])

  const activeTasks = tasks.filter(t => t.status === 'pending')

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
          <Badge variant="secondary" className="bg-slate-100">
            {activeTasks.length}
          </Badge>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {activeTasks.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            No tasks yet. Add one to get started!
          </p>
        ) : (
          activeTasks.map(task => {
            const linkedProblem = problems.find(p => p.id === task.problem_id)
            const linkedGoal = goals.find(g => g.id === task.goal_id)

            return (
              <div
                key={task.id}
                className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        'font-medium text-slate-900 mb-1',
                        task.status === 'completed' && 'line-through text-slate-400'
                      )}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', priorityColors[task.priority])}
                      >
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-slate-500">
                          Due: {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                      {linkedProblem && (
                        <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700">
                          Problem: {linkedProblem.title}
                        </Badge>
                      )}
                      {linkedGoal && (
                        <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">
                          Goal: {linkedGoal.title}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(task)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(task.id)}
                        className="text-rose-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })
        )}
      </div>

      <TaskFormSimple
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingTask(null)
        }}
        onSubmit={handleSubmit}
        task={editingTask}
        problems={problems}
        goals={goals}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
