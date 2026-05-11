import { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, CheckCircle2, Clock, Flame } from 'lucide-react'
import TaskForm, { TaskFormData } from '@/components/tasks/TaskForm'
import TaskTable from '@/components/tasks/TaskTable'
import { Task } from '@/types/entities'
import { Helmet } from 'react-helmet-async'

export default function Tasks() {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_date',
    direction: 'desc'
  })

  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const result = await backend.entities.Task.filter({ category: 'business' }, '-created_date')
      return (result as any[]).map(t => ({ ...t, priority: t.priority || 'low' })) as Task[]
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Task>) => backend.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowForm(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      backend.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowForm(false)
      setEditingTask(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const handleSubmit = (data: TaskFormData) => {
    const payload = { ...data, category: 'business' }

    if (editingTask) {
      updateMutation.mutate({
        id: editingTask.id,
        data: payload
      })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleToggleComplete = (task: Task) => {
    updateMutation.mutate({
      id: task.id,
      data: {
        status: task.status === 'completed' ? 'todo' : 'completed'
      }
    })
  }

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTask(null)
  }

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks]

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        task =>
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key] || ''
      const bVal = b[sortConfig.key] || ''

      if (sortConfig.key === 'priority') {
        const order = { high: 3, medium: 2, low: 1 }
        const aOrder = order[aVal] || 0
        const bOrder = order[bVal] || 0
        return sortConfig.direction === 'asc' ? aOrder - bOrder : bOrder - aOrder
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [tasks, searchQuery, sortConfig])

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
    return { total, completed, highPriority, pending: total - completed }
  }, [tasks])

  return (
    <>
      <Helmet>
        <title>Tasks</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Tasks</h1>
            <p className="text-slate-500 mt-2">Stay focused and get things done</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-sm text-slate-500">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                  <p className="text-sm text-slate-500">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                  <p className="text-sm text-slate-500">Done</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.highPriority}</p>
                  <p className="text-sm text-slate-500">High Priority</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500">Loading tasks...</p>
              </div>
            </div>
          ) : (
            <TaskTable
              tasks={filteredAndSortedTasks}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleComplete={handleToggleComplete}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}

          {/* Form Modal */}
          <TaskForm
            open={showForm}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            task={editingTask}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      </div>
    </>
  )
}
