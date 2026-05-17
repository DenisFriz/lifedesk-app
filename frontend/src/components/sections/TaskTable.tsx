import React, { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { offlineFirst, offlineUpdate } from '@/hooks/useOfflineFirst'
import { useSubscription } from '@/hooks/useSubscription'
import UsageLimitGate from '@/components/subscription/UsageLimitGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  MoreHorizontal,
  Trash2,
  ArrowUpDown,
  Star,
  Archive,
  ArchiveRestore,
  Check,
  Bell,
  X,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Rows3,
  GripVertical,
  Copy,
  Search
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDateMedium } from '@/components/utils/formatters'
import { TablePagination } from '../TablePagination'
import { CategorySelectDialog } from '../CategorySelectDialog'
import { useSound } from '@/contexts/SoundContext'
import { useUserLimit } from '@/contexts/UserLimitContext'

interface TaskTableProps {
  filterType?: 'all' | 'important' | 'category' | 'business'
  category?: string
  businessId?: string
  isActive?: boolean
}

interface TaskValues {
  [key: string]: any
}

interface ReminderValues {
  [key: string]: number[]
}

export default function TaskTable({
  filterType = 'all',
  category,
  businessId,
  isActive = true
}: TaskTableProps) {
  const [taskValues, setTaskValues] = useState<TaskValues>({})
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<'active' | 'done' | 'archived'>('active')
  const [animatingTask, setAnimatingTask] = useState<string | null>(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(20)
  const [showReminders, setShowReminders] = useState<Record<string, boolean>>({})
  const [reminderValues, setReminderValues] = useState<ReminderValues>({})
  const [selectOpen, setSelectOpen] = useState<boolean>(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState<boolean>(false)
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})
  const [compactView, setCompactView] = useState<boolean>(() => {
    const saved = localStorage.getItem('taskTableCompactView')
    return saved ? JSON.parse(saved) : false
  })
  const [hoveredDueDate, setHoveredDueDate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const queryClient = useQueryClient()
  const tableRef = React.useRef(null)

  const { playSound } = useSound()

  const { limit } = useSubscription()

  const { canCreate } = useUserLimit()

  const tasksLimit = limit('home_tasks_limit')

  const { data: allTasks = [] } = useQuery<any[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const data = await backend.entities.Task.list('-created_date')
      return (data as any[]).filter(r => !r.is_deleted)
    },
    enabled: isActive
  })

  const { data: businesses = [] } = useQuery<any[]>({
    queryKey: ['businesses'],
    queryFn: async () => {
      const data = await backend.entities.Business.list('order')
      return (data as any[]).filter(r => !r.is_deleted)
    },
    enabled: isActive
  })

  const { data: allGoals = [] } = useQuery<any[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const data = await offlineFirst('goals', () => backend.entities.Goal.list('-created_date'))
      return (data as any[]).filter(r => !r.is_deleted)
    },
    enabled: isActive
  })

  // Filter tasks based on filterType
  let tasks = allTasks
  if (filterType === 'important') {
    tasks = allTasks.filter(t => t.important)
  } else if (filterType === 'category') {
    tasks = allTasks.filter(t => t.category === category)
  } else if (filterType === 'business') {
    tasks = allTasks.filter(t => t.category === 'business' && t.business_id === businessId)
  }

  const updateMutation = useMutation<any, any, { id: string; data: any }>({
    mutationFn: ({ id, data }) => offlineUpdate('tasks', backend.entities.Task, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData(['tasks'])
      queryClient.setQueryData(['tasks'], (oldTasks: any) => {
        if (!oldTasks) return oldTasks
        return oldTasks.map((task: any) => (task._id === id ? { ...task, ...data } : task))
      })
      return { previousTasks }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: (updatedTask, variables) => {
      queryClient.setQueryData(['tasks'], (oldTasks: any) =>
        oldTasks
          ? oldTasks.map((task: any) => (task._id === updatedTask.id ? updatedTask : task))
          : oldTasks
      )
      setTaskValues(prev => {
        const newValues = { ...prev }
        for (const field in variables.data) {
          delete newValues[`${updatedTask.id}-${field}`]
        }
        return newValues
      })
      if (variables.data.status === 'completed') {
        setAnimatingTask(null)
      }
    }
  })

  const createMutation = useMutation<any, any, any>({
    mutationFn: async data => {
      return backend.entities.Task.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      return { previousTasks: queryClient.getQueryData(['tasks']) }
    },
    onSuccess: (newTask: any) => {
      queryClient.setQueryData(['tasks'], (oldTasks: any) => {
        if (!oldTasks) return [newTask]
        const exists = oldTasks.find((t: any) => t._id === newTask._id)
        return exists
          ? oldTasks.map((t: any) => (t._id === newTask._id ? newTask : t))
          : [newTask, ...oldTasks]
      })

      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: id => {
      playSound('delete')
      return backend.entities.Task.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const duplicateMutation = useMutation<any, any, any>({
    mutationFn: task => {
      const { id, created_date, updated_date, created_by, ...rest } = task
      return backend.entities.Task.create({
        ...rest,
        title: `${rest.title} (copy)`,
        status: 'pending',
        order: (task.order ?? 0) + 0.5
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    mutationFn: async ids => {
      playSound('delete')
      await Promise.all(ids.map(id => backend.entities.Task.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setSelectedTasks([])
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: any }>({
    mutationFn: async ({ ids, data }) => {
      if (data.status === 'archived') {
        playSound('archived')
      }
      await Promise.all(ids.map(id => backend.entities.Task.update(id, data)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setSelectedTasks([])
    }
  })

  const filteredTasksByStatus = tasks
    .filter(t => {
      if (statusFilter === 'active' && animatingTask === t.id) return true

      if (statusFilter === 'active') return t.status === 'pending'
      if (statusFilter === 'done') return t.status === 'completed'
      if (statusFilter === 'archived') return t.status === 'archived'
      return true
    })
    .filter(t => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      )
    })

  const getBusinessName = businessId => {
    const business = businesses.find(b => b.id === businessId)
    return business ? business.name : 'Business'
  }

  const handleSort = (field: string): void => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const sortedTasks = [...filteredTasksByStatus].sort((a: any, b: any) => {
    if (!sortBy) {
      const orderA = a.order ?? 999999
      const orderB = b.order ?? 999999
      return orderA - orderB
    }

    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (sortBy === 'important') {
      aVal = a.important ? 1 : 0
      bVal = b.important ? 1 : 0
    }

    if (aVal === bVal) return 0
    const comparison = aVal > bVal ? 1 : -1
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleDragEnd = (result: any): void => {
    if (!result.destination || result.source.index === result.destination.index) return

    const items = Array.from(sortedTasks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    queryClient.setQueryData(['tasks'], (oldTasks: any) => {
      if (!oldTasks) return oldTasks
      return oldTasks.map((task: any) => {
        const itemIndex = items.findIndex(item => item.id === task._id)
        if (itemIndex !== -1) {
          return { ...task, order: itemIndex }
        }
        return task
      })
    })

    items.forEach((task: any, index: number) => {
      updateMutation.mutate({ id: task._id, data: { order: index } })
    })
  }

  const paginatedTasks = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return sortedTasks.slice(startIndex, startIndex + perPage)
  }, [sortedTasks, page, perPage])

  const totalPages = Math.ceil(sortedTasks.length / perPage)

  const toggleImportant = (task: any): void => {
    updateMutation.mutate({ id: task._id, data: { important: !task.important } })
  }

  const getTaskValue = (taskId: string, field: string, defaultValue?: any): any => {
    if (taskValues[`${taskId}-${field}`] !== undefined) {
      return taskValues[`${taskId}-${field}`]
    }
    return defaultValue || ''
  }

  const handleTaskChange = (taskId: string, field: string, value: any): void => {
    setTaskValues(prev => ({ ...prev, [`${taskId}-${field}`]: value }))
  }

  const handleTaskBlur = (task: any, field: string): void => {
    const value = taskValues[`${task._id}-${field}`]
    if (value !== undefined && value !== task[field]) {
      updateMutation.mutate({ id: task._id, data: { [field]: value } })
    }
  }

  const toggleComplete = (task: any): void => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    if (newStatus === 'completed') {
      setAnimatingTask(task._id)
      playSound('task-done')

      const updateData: any = { status: newStatus }
      if (!task.category) {
        updateData.category = 'assets'
      }
      setTimeout(() => {
        updateMutation.mutate({ id: task._id, data: updateData })
      }, 800)
    } else {
      const updateData: any = { status: newStatus }
      if (!task.category) {
        updateData.category = 'assets'
      }
      updateMutation.mutate({ id: task._id, data: updateData })
    }
  }

  const archiveTask = (task: any): void => {
    playSound('archived')
    updateMutation.mutate({ id: task._id, data: { status: 'archived' } })
  }

  const unarchiveTask = (task: any): void => {
    updateMutation.mutate({ id: task._id, data: { status: 'pending' } })
  }

  const handleAddNew = (): void => {
    if (filterType === 'all') {
      setShowCategoryDialog(true)
    } else {
      const minOrder = tasks.length > 0 ? Math.min(...tasks.map((t: any) => t.order ?? 999999)) : 0
      const data: any = {
        title: 'New Task',
        status: 'pending',
        order: minOrder === 999999 ? 0 : minOrder - 1
      }

      if (filterType === 'important') {
        data.important = true
        data.category = 'assets'
      } else if (filterType === 'category') {
        data.category = category
      } else if (filterType === 'business') {
        data.category = 'business'
        data.business_id = businessId
      } else {
        data.category = 'assets'
      }

      createMutation.mutate(data)
    }
  }

  const handleCategorySelect = (
    selectedCategory: string,
    selectedBusinessId?: string | null
  ): void => {
    const minOrder =
      allTasks.length > 0 ? Math.min(...allTasks.map((t: any) => t.order ?? 999999)) : 0
    const data: any = {
      title: 'New Task',
      status: 'pending',
      category: selectedCategory,
      order: minOrder === 999999 ? 0 : minOrder - 1
    }

    if (selectedBusinessId) {
      data.business_id = selectedBusinessId
    }

    createMutation.mutate(data)
    setShowCategoryDialog(false)
  }

  const toggleSelectAll = (): void => {
    if (selectedTasks.length === paginatedTasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(paginatedTasks.map((t: any) => t.id))
    }
  }

  const toggleSelectTask = (taskId: string): void => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    )
  }

  const toggleBulkMode = (): void => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedTasks([])
    }
  }

  const toggleExpandTask = (taskId: string): void => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  return (
    <>
      <CategorySelectDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        businesses={businesses}
        onSelect={handleCategorySelect}
        title="Choose a category"
        description="Please choose a category for the new task."
      />

      <div className="task-table-container bg-white rounded-xl overflow-hidden mb-6">
        <Tabs
          value={statusFilter}
          onValueChange={v => setStatusFilter(v as 'active' | 'done' | 'archived')}
        >
          <div className="task-table-header flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3 p-4">
            <TabsList className="bg-[#eaecf4] p-1 flex-1 lg:flex-none flex">
              <TabsTrigger
                value="active"
                className="rounded-md bg-transparent text-[#475569] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm flex-1 lg:flex-none lg:px-6"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="done"
                className="rounded-md bg-transparent text-[#475569] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm flex-1 lg:flex-none lg:px-6"
              >
                Done
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="rounded-md bg-transparent text-[#475569] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm flex-1 lg:flex-none lg:px-6"
              >
                Archived
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 lg:ml-auto">
              <div className="relative hidden lg:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  id="tasks-search"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-8 h-9 w-48 text-sm"
                />
              </div>
              <UsageLimitGate allowed={canCreate('tasks')} label="goals">
                <Button
                  onClick={handleAddNew}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 flex-1 lg:flex-none"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </UsageLimitGate>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleBulkMode}
                      className={cn('h-9 w-9 flex-shrink-0', bulkMode && 'bg-slate-200')}
                    >
                      <ListChecks className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle bulk selection</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newValue = !compactView
                        setCompactView(newValue)
                        localStorage.setItem('taskTableCompactView', JSON.stringify(newValue))
                      }}
                      className={cn('h-9 w-9 flex-shrink-0', compactView && 'bg-slate-200')}
                    >
                      <Rows3 className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle compact view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <TabsContent value={statusFilter} className="m-0" ref={tableRef}>
            {filteredTasksByStatus.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500 mb-4">No {statusFilter} tasks</p>
                {statusFilter === 'active' && (
                  <Button onClick={handleAddNew} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Task
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="task-table-desktop hidden [@media(min-width:1130px)]:block overflow-x-auto">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <table className="task-table w-full min-w-[1000px]">
                      <thead className="task-table-thead bg-slate-50 border-b border-slate-200">
                        <tr className="task-table-header-row">
                          {!sortBy && (
                            <th className="task-table-th-drag pl-3 pr-2 py-3 text-left w-10">
                              <GripVertical className="w-4 h-4 text-slate-400 mx-auto" />
                            </th>
                          )}
                          <th className="task-table-th-star pl-3 pr-2 py-3 text-left w-8">
                            <button
                              onClick={() => handleSort('important')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              <Star className="w-4 h-4" />
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="task-table-th-checkbox py-3 text-center w-8">
                            <Check className="w-4 h-4 text-slate-700 mx-auto" />
                          </th>
                          {bulkMode && (
                            <th className="task-table-th-bulk px-2 py-3 text-center w-12">
                              <Checkbox
                                checked={
                                  selectedTasks.length === paginatedTasks.length &&
                                  paginatedTasks.length > 0
                                }
                                onCheckedChange={toggleSelectAll}
                              />
                            </th>
                          )}
                          <th className="task-table-th-title px-2 py-3 text-left w-64">
                            <button
                              onClick={() => handleSort('title')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              Title
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="task-table-th-description px-2 py-3 text-left">
                            <span className="text-xs font-medium text-slate-700">Description</span>
                          </th>
                          {(filterType === 'all' || filterType === 'important') && (
                            <th className="task-table-th-category px-2 py-3 text-left w-40">
                              <span className="text-xs font-medium text-slate-700">Category</span>
                            </th>
                          )}

                          <th className="task-table-th-goal px-2 py-3 text-left w-40">
                            <span className="text-xs font-medium text-slate-700">Goal</span>
                          </th>
                          <th className="task-table-th-duedate px-2 py-3 text-left w-36">
                            <button
                              onClick={() => handleSort('due_date')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              Due Date
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="task-table-th-actions px-2 py-3 text-center w-20">
                            <span className="text-xs font-medium text-slate-700">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <Droppable droppableId="tasks">
                        {provided => (
                          <tbody
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="task-table-tbody"
                          >
                            {paginatedTasks.map((task, index) => {
                              const taskOverLimit =
                                tasksLimit !== Infinity && allTasks.indexOf(task) >= tasksLimit
                              return (
                                <Draggable
                                  key={task._id}
                                  draggableId={`task-${task._id}`}
                                  index={index}
                                  isDragDisabled={!!sortBy || taskOverLimit}
                                >
                                  {(provided, snapshot) => (
                                    <tr
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        'task-table-row border-b border-slate-100 hover:bg-slate-50',
                                        animatingTask === task._id &&
                                          'animate-[wiggle_0.3s_ease-in-out]',
                                        compactView && 'h-12',
                                        snapshot.isDragging && 'opacity-50'
                                      )}
                                    >
                                      {!sortBy && (
                                        <td
                                          className={cn(
                                            'task-table-td-drag pl-3 pr-2 w-10 align-middle cursor-grab active:cursor-grabbing',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                          {...provided.dragHandleProps}
                                        >
                                          <GripVertical className="w-4 h-4 text-slate-400" />
                                        </td>
                                      )}
                                      <td
                                        className={cn(
                                          'task-table-td-star pl-3 pr-2 w-8 align-middle',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        <button onClick={() => toggleImportant(task)}>
                                          <Star
                                            className={cn(
                                              'w-5 h-5',
                                              task.important
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-slate-300 hover:text-slate-400'
                                            )}
                                          />
                                        </button>
                                      </td>
                                      <td
                                        className={cn(
                                          'task-table-td-checkbox text-center w-8 align-middle',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        <Checkbox
                                          checked={
                                            task.status === 'completed' ||
                                            animatingTask === task._id
                                          }
                                          onCheckedChange={() => toggleComplete(task)}
                                          className={cn(
                                            'mx-auto',
                                            (task.status === 'completed' ||
                                              animatingTask === task._id) &&
                                              'border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                                          )}
                                        />
                                      </td>
                                      {bulkMode && (
                                        <td
                                          className={cn(
                                            'task-table-td-bulk px-2 text-center w-12 align-middle',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <Checkbox
                                            checked={selectedTasks.includes(task._id)}
                                            onCheckedChange={() => toggleSelectTask(task._id)}
                                          />
                                        </td>
                                      )}
                                      <td
                                        className={cn(
                                          'task-table-td-title align-middle w-64 max-w-64',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        <Input
                                          id={`task-title-${task._id}`}
                                          value={getTaskValue(task._id, 'title', task.title)}
                                          onChange={e =>
                                            handleTaskChange(task._id, 'title', e.target.value)
                                          }
                                          onBlur={() => handleTaskBlur(task, 'title')}
                                          maxLength={200}
                                          className={cn(
                                            'border-0 shadow-none px-2 py-1 h-auto font-medium text-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                                            compactView ? 'line-clamp-1' : 'truncate'
                                          )}
                                        />
                                      </td>
                                      <td
                                        className={cn(
                                          'task-table-td-description align-middle',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        <Textarea
                                          id={`task-description-${task._id}`}
                                          value={getTaskValue(
                                            task._id,
                                            'description',
                                            task.description
                                          )}
                                          onChange={e =>
                                            handleTaskChange(
                                              task._id,
                                              'description',
                                              e.target.value
                                            )
                                          }
                                          onBlur={() => handleTaskBlur(task, 'description')}
                                          placeholder="Add description..."
                                          maxLength={5000}
                                          className={cn(
                                            'border-0 shadow-none px-2 py-1 resize-none text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                                            compactView
                                              ? 'h-8 min-h-0 line-clamp-1 overflow-hidden'
                                              : 'min-h-[60px]'
                                          )}
                                        />
                                      </td>
                                      {(filterType === 'all' || filterType === 'important') && (
                                        <td
                                          className={cn(
                                            'task-table-td-category w-40 max-w-40 align-middle',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <Select
                                            value={
                                              task.category === 'business' && task.business_id
                                                ? `business-${task.business_id}`
                                                : task.category
                                            }
                                            onValueChange={value => {
                                              const updateData: Record<string, any> = {}
                                              if (value.startsWith('business-')) {
                                                updateData.category = 'business'
                                                updateData.business_id = value.replace(
                                                  'business-',
                                                  ''
                                                )
                                              } else {
                                                updateData.category = value
                                                updateData.business_id = null
                                              }
                                              updateMutation.mutate({
                                                id: task._id,
                                                data: updateData
                                              })
                                            }}
                                          >
                                            <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-1 focus:ring-indigo-500 bg-transparent hover:bg-slate-100 [&>span]:truncate [&>svg]:flex-shrink-0">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-w-[200px]">
                                              <SelectItem value="finances" className="truncate">
                                                Finance
                                              </SelectItem>
                                              <SelectItem value="assets" className="truncate">
                                                Assets
                                              </SelectItem>
                                              <SelectItem value="health_body" className="truncate">
                                                Health
                                              </SelectItem>
                                              <SelectItem value="fitness" className="truncate">
                                                Fitness
                                              </SelectItem>
                                              <SelectItem value="hobbies" className="truncate">
                                                Hobbies
                                              </SelectItem>
                                              <SelectItem value="learning" className="truncate">
                                                Learning
                                              </SelectItem>
                                              <SelectItem
                                                value="relationships"
                                                className="truncate"
                                              >
                                                Relationships
                                              </SelectItem>
                                              {businesses.map(business => (
                                                <SelectItem
                                                  key={business.id}
                                                  value={`business-${business.id}`}
                                                  className="truncate"
                                                >
                                                  {business.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </td>
                                      )}
                                      <td
                                        className={cn(
                                          'task-table-td-goal w-40 max-w-40 align-middle',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        <Select
                                          value={task.goal_id || 'none'}
                                          onValueChange={value => {
                                            const updateData = {
                                              goal_id: value === 'none' ? null : value
                                            }
                                            updateMutation.mutate({
                                              id: task._id,
                                              data: updateData
                                            })
                                          }}
                                        >
                                          <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-1 focus:ring-indigo-500 bg-transparent hover:bg-slate-100 [&>span]:truncate [&>svg]:flex-shrink-0">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="max-w-[300px]">
                                            <SelectItem value="none" className="truncate">
                                              No Goal
                                            </SelectItem>
                                            {allGoals
                                              .filter(
                                                g =>
                                                  g.status === 'active' &&
                                                  g.category === task.category &&
                                                  g.business_id === task.business_id
                                              )
                                              .map(goal => (
                                                <SelectItem
                                                  key={goal.id}
                                                  value={goal.id}
                                                  className="truncate"
                                                >
                                                  {goal.title}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </td>
                                      <td
                                        className={cn(
                                          'task-table-td-duedate w-36 align-middle',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        {taskValues[`${task._id}-due_date-editing`] ? (
                                          <div
                                            className="task-duedate-wrapper space-y-1"
                                            onBlur={e => {
                                              if (selectOpen) return
                                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                                const timeInput = document.querySelector(
                                                  `input[data-time-for="${task._id}"]`
                                                ) as HTMLInputElement | null
                                                const reminders = reminderValues[task._id] || []
                                                handleTaskBlur(task, 'due_date')
                                                if (
                                                  timeInput?.value !== task.due_time ||
                                                  JSON.stringify(reminders) !==
                                                    JSON.stringify(task.reminders || [])
                                                ) {
                                                  updateMutation.mutate({
                                                    id: task._id,
                                                    data: {
                                                      due_time: timeInput?.value || null,
                                                      reminders
                                                    }
                                                  })
                                                }
                                                setShowReminders({})
                                                setReminderValues({})
                                                setTaskValues(prev => ({
                                                  ...prev,
                                                  [`${task._id}-due_date-editing`]: false
                                                }))
                                              }
                                            }}
                                          >
                                            <Input
                                              type="date"
                                              value={getTaskValue(
                                                task._id,
                                                'due_date',
                                                task.due_date
                                              )}
                                              onChange={e =>
                                                handleTaskChange(
                                                  task._id,
                                                  'due_date',
                                                  e.target.value
                                                )
                                              }
                                              autoFocus
                                              className="border-0 shadow-none px-2 py-1 h-8 text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                                            />
                                            <div className="flex items-center gap-1">
                                              <Input
                                                type="time"
                                                defaultValue={task.due_time || ''}
                                                data-time-for={task._id}
                                                className="h-8 text-xs flex-1 border-0 shadow-none px-2 py-1 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                                                placeholder="Time"
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => {
                                                  setShowReminders(prev => ({
                                                    ...prev,
                                                    [task._id]: !prev[task._id]
                                                  }))
                                                  if (!reminderValues[task._id]) {
                                                    setReminderValues(prev => ({
                                                      ...prev,
                                                      [task._id]: task.reminders || []
                                                    }))
                                                  }
                                                }}
                                              >
                                                <Bell className="w-4 h-4" />
                                              </Button>
                                            </div>
                                            {showReminders[task._id] && (
                                              <div className="space-y-1 mt-2">
                                                <div className="text-xs text-slate-600 font-medium">
                                                  Reminders:
                                                </div>
                                                {(reminderValues[task._id] || []).map(
                                                  (totalMinutes, idx) => {
                                                    let value = totalMinutes
                                                    let unit = 'minutes'

                                                    if (
                                                      totalMinutes % 10080 === 0 &&
                                                      totalMinutes >= 10080
                                                    ) {
                                                      value = totalMinutes / 10080
                                                      unit = 'weeks'
                                                    } else if (
                                                      totalMinutes % 1440 === 0 &&
                                                      totalMinutes >= 1440
                                                    ) {
                                                      value = totalMinutes / 1440
                                                      unit = 'days'
                                                    } else if (
                                                      totalMinutes % 60 === 0 &&
                                                      totalMinutes >= 60
                                                    ) {
                                                      value = totalMinutes / 60
                                                      unit = 'hours'
                                                    }

                                                    return (
                                                      <div
                                                        key={idx}
                                                        className="flex items-center gap-1"
                                                      >
                                                        <Input
                                                          type="number"
                                                          value={value}
                                                          onChange={e => {
                                                            const newValue =
                                                              parseInt(e.target.value) || 1
                                                            const multiplier =
                                                              unit === 'minutes'
                                                                ? 1
                                                                : unit === 'hours'
                                                                  ? 60
                                                                  : unit === 'days'
                                                                    ? 1440
                                                                    : 10080
                                                            const newMinutes = newValue * multiplier

                                                            const newReminders = [
                                                              ...(reminderValues[task._id] || [])
                                                            ]
                                                            newReminders[idx] = newMinutes
                                                            setReminderValues(prev => ({
                                                              ...prev,
                                                              [task._id]: newReminders
                                                            }))
                                                          }}
                                                          className="h-8 text-xs w-20 flex-1"
                                                          placeholder="Value"
                                                          min="1"
                                                        />
                                                        <Select
                                                          value={unit}
                                                          open={selectOpen}
                                                          onOpenChange={setSelectOpen}
                                                          onValueChange={newUnit => {
                                                            const multiplier =
                                                              newUnit === 'minutes'
                                                                ? 1
                                                                : newUnit === 'hours'
                                                                  ? 60
                                                                  : newUnit === 'days'
                                                                    ? 1440
                                                                    : 10080
                                                            const newMinutes = value * multiplier

                                                            const newReminders = [
                                                              ...(reminderValues[task._id] || [])
                                                            ]
                                                            newReminders[idx] = newMinutes
                                                            setReminderValues(prev => ({
                                                              ...prev,
                                                              [task._id]: newReminders
                                                            }))
                                                          }}
                                                        >
                                                          <SelectTrigger className="h-8 flex-1 text-xs">
                                                            <SelectValue />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="minutes">
                                                              Minutes
                                                            </SelectItem>
                                                            <SelectItem value="hours">
                                                              Hours
                                                            </SelectItem>
                                                            <SelectItem value="days">
                                                              Days
                                                            </SelectItem>
                                                            <SelectItem value="weeks">
                                                              Weeks
                                                            </SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                      </div>
                                                    )
                                                  }
                                                )}
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      const newReminders = [
                                                        ...(reminderValues[task._id] || []),
                                                        30
                                                      ]
                                                      setReminderValues(prev => ({
                                                        ...prev,
                                                        [task._id]: newReminders
                                                      }))
                                                    }}
                                                    className="flex-1 text-xs"
                                                  >
                                                    Add reminder
                                                  </Button>
                                                  {(reminderValues[task._id] || []).length > 0 && (
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                      onClick={e => {
                                                        e.stopPropagation()
                                                        const newReminders = reminderValues[
                                                          task._id
                                                        ].slice(0, -1)
                                                        setReminderValues(prev => ({
                                                          ...prev,
                                                          [task._id]: newReminders
                                                        }))
                                                      }}
                                                    >
                                                      <X className="w-4 h-4" />
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div
                                            onClick={() => {
                                              setTaskValues(prev => ({
                                                ...prev,
                                                [`${task._id}-due_date-editing`]: true
                                              }))
                                              setReminderValues(prev => ({
                                                ...prev,
                                                [task._id]: task.reminders || []
                                              }))
                                            }}
                                            onMouseEnter={() => setHoveredDueDate(task._id)}
                                            onMouseLeave={() => setHoveredDueDate(null)}
                                            className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                          >
                                            {task.due_date ? (
                                              <>
                                                <div>{formatDateMedium(task.due_date)}</div>
                                                {!compactView && task.due_time && (
                                                  <div className="text-xs text-slate-500 mt-0.5">
                                                    {task.due_time}
                                                  </div>
                                                )}
                                                {!compactView &&
                                                  task.reminders &&
                                                  task.reminders.length > 0 && (
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                      🔔 {task.reminders.length}
                                                    </div>
                                                  )}
                                                {compactView &&
                                                  hoveredDueDate === task._id &&
                                                  task.due_time && (
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                      {task.due_time}
                                                    </div>
                                                  )}
                                                {compactView &&
                                                  hoveredDueDate === task._id &&
                                                  task.reminders &&
                                                  task.reminders.length > 0 && (
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                      🔔 {task.reminders.length}
                                                    </div>
                                                  )}
                                              </>
                                            ) : (
                                              'Set date...'
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      <td
                                        className={cn(
                                          'task-table-td-actions px-2 text-center w-20 align-middle',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        <div className="flex items-center justify-center gap-1">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => duplicateMutation.mutate(task)}
                                                >
                                                  <Copy className="h-4 w-4 text-slate-600" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>Duplicate</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          {statusFilter === 'active' && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => archiveTask(task)}
                                                  >
                                                    <Archive className="h-4 w-4 text-slate-600" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Archive</TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                          {statusFilter === 'archived' && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => unarchiveTask(task)}
                                                  >
                                                    <ArchiveRestore className="h-4 w-4 text-slate-600" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Unarchive</TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => deleteMutation.mutate(task._id)}
                                                >
                                                  <Trash2 className="h-4 w-4 text-rose-600" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>Delete</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Draggable>
                              )
                            })}
                            {provided.placeholder}
                          </tbody>
                        )}
                      </Droppable>
                    </table>
                  </DragDropContext>
                </div>

                <div className="task-table-mobile block [@media(min-width:1130px)]:hidden">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="tasks-mobile">
                      {provided => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {paginatedTasks.map((task, index) => (
                            <Draggable
                              key={task._id}
                              draggableId={task._id}
                              index={index}
                              isDragDisabled={!!sortBy}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    'task-card p-4 space-y-3 border-b-[10px]',
                                    index === 0 && 'border-t-[10px]',
                                    animatingTask === task._id &&
                                      'animate-[wiggle_0.3s_ease-in-out]',
                                    snapshot.isDragging && 'opacity-50',
                                    tasksLimit !== Infinity &&
                                      allTasks.indexOf(task) >= tasksLimit &&
                                      'opacity-50 pointer-events-none select-none'
                                  )}
                                  style={{
                                    borderBottomColor: '#f5f7fb',
                                    borderTopColor: '#f5f7fb',
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <div className="task-card-header flex items-start gap-3">
                                    {!sortBy && (
                                      <div
                                        {...provided.dragHandleProps}
                                        className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="w-5 h-5 text-slate-400" />
                                      </div>
                                    )}
                                    {bulkMode && (
                                      <Checkbox
                                        checked={selectedTasks.includes(task._id)}
                                        onCheckedChange={() => toggleSelectTask(task._id)}
                                        className="flex-shrink-0 mt-1"
                                      />
                                    )}
                                    <button
                                      onClick={() => toggleImportant(task)}
                                      className="flex-shrink-0 mt-1"
                                    >
                                      <Star
                                        className={cn(
                                          'w-5 h-5',
                                          task.important
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-slate-300'
                                        )}
                                      />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <Input
                                        value={getTaskValue(task._id, 'title', task.title)}
                                        onChange={e =>
                                          handleTaskChange(task._id, 'title', e.target.value)
                                        }
                                        onBlur={() => handleTaskBlur(task, 'title')}
                                        maxLength={200}
                                        className="w-full border-0 shadow-none px-0 py-0 h-auto font-medium text-slate-900 focus-visible:ring-0 bg-transparent"
                                      />
                                    </div>
                                    <Checkbox
                                      checked={
                                        task.status === 'completed' || animatingTask === task._id
                                      }
                                      onCheckedChange={() => toggleComplete(task)}
                                      className={cn(
                                        'flex-shrink-0 mt-1',
                                        (task.status === 'completed' ||
                                          animatingTask === task._id) &&
                                          'border-emerald-500 data-[state=checked]:bg-emerald-500'
                                      )}
                                    />
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpandTask(task._id)}
                                    className="w-full justify-start gap-2 text-slate-600"
                                  >
                                    {expandedTasks[task._id] ? (
                                      <>
                                        <ChevronUp className="w-4 h-4" />
                                        <span className="text-xs">Hide details</span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4" />
                                        <span className="text-xs">Show details</span>
                                      </>
                                    )}
                                  </Button>

                                  {expandedTasks[task._id] && (
                                    <>
                                      <Textarea
                                        value={getTaskValue(
                                          task._id,
                                          'description',
                                          task.description
                                        )}
                                        onChange={e =>
                                          handleTaskChange(task._id, 'description', e.target.value)
                                        }
                                        onBlur={() => handleTaskBlur(task, 'description')}
                                        placeholder="Add description..."
                                        maxLength={5000}
                                        className="task-card-description border-0 shadow-none px-0 py-0 min-h-[60px] resize-none text-sm text-slate-600 focus-visible:ring-0 bg-transparent"
                                      />

                                      <div className="task-card-meta grid grid-cols-2 gap-2 text-sm">
                                        {(filterType === 'all' || filterType === 'important') && (
                                          <div>
                                            <label className="text-xs text-slate-500 block mb-1">
                                              Category
                                            </label>
                                            <Select
                                              value={
                                                task.category === 'business' && task.business_id
                                                  ? `business-${task.business_id}`
                                                  : task.category
                                              }
                                              onValueChange={value => {
                                                const updateData: Record<string, any> = {}
                                                if (value.startsWith('business-')) {
                                                  updateData.category = 'business'
                                                  updateData.business_id = value.replace(
                                                    'business-',
                                                    ''
                                                  )
                                                } else {
                                                  updateData.category = value
                                                  updateData.business_id = null
                                                }
                                                updateMutation.mutate({
                                                  id: task._id,
                                                  data: updateData
                                                })
                                              }}
                                            >
                                              <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="max-w-[calc(100vw-2rem)]">
                                                <SelectItem value="finances">Finance</SelectItem>
                                                <SelectItem value="assets">Assets</SelectItem>
                                                <SelectItem value="health_body">Health</SelectItem>
                                                <SelectItem value="fitness">Fitness</SelectItem>
                                                <SelectItem value="hobbies">Hobbies</SelectItem>
                                                <SelectItem value="learning">Learning</SelectItem>
                                                <SelectItem value="relationships">
                                                  Relationships
                                                </SelectItem>
                                                {businesses.map(business => (
                                                  <SelectItem
                                                    key={business.id}
                                                    value={`business-${business.id}`}
                                                  >
                                                    {business.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
                                        <div>
                                          <label className="text-xs text-slate-500 block mb-1">
                                            Goal
                                          </label>
                                          <Select
                                            value={task.goal_id || 'none'}
                                            onValueChange={value => {
                                              const updateData = {
                                                goal_id: value === 'none' ? null : value
                                              }
                                              updateMutation.mutate({
                                                id: task._id,
                                                data: updateData
                                              })
                                            }}
                                          >
                                            <SelectTrigger className="h-9 text-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-w-[calc(100vw-2rem)]">
                                              <SelectItem value="none">No Goal</SelectItem>
                                              {allGoals
                                                .filter(
                                                  g =>
                                                    g.status === 'active' &&
                                                    g.category === task.category &&
                                                    g.business_id === task.business_id
                                                )
                                                .map(goal => (
                                                  <SelectItem key={goal.id} value={goal.id}>
                                                    {goal.title}
                                                  </SelectItem>
                                                ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <div className="task-card-footer flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                          <label className="text-xs text-slate-500 block mb-1">
                                            Due Date
                                          </label>
                                          {taskValues[`${task._id}-due_date-editing-mobile`] ? (
                                            <div
                                              className="task-card-duedate space-y-1"
                                              onBlur={e => {
                                                if (selectOpen) return
                                                if (
                                                  !e.currentTarget.parentElement?.contains(
                                                    e.relatedTarget
                                                  )
                                                ) {
                                                  const timeInput = document.querySelector(
                                                    `input[data-time-for-mobile="${task._id}"]`
                                                  ) as HTMLInputElement | null
                                                  const reminders = reminderValues[task._id] || []
                                                  handleTaskBlur(task, 'due_date')
                                                  if (
                                                    timeInput?.value !== task.due_time ||
                                                    JSON.stringify(reminders) !==
                                                      JSON.stringify(task.reminders || [])
                                                  ) {
                                                    updateMutation.mutate({
                                                      id: task._id,
                                                      data: {
                                                        due_time: timeInput?.value || null,
                                                        reminders
                                                      }
                                                    })
                                                  }
                                                  setShowReminders({})
                                                  setReminderValues({})
                                                  setTaskValues(prev => ({
                                                    ...prev,
                                                    [`${task._id}-due_date-editing-mobile`]: false
                                                  }))
                                                }
                                              }}
                                            >
                                              <Input
                                                type="date"
                                                value={getTaskValue(
                                                  task._id,
                                                  'due_date',
                                                  task.due_date
                                                )}
                                                onChange={e =>
                                                  handleTaskChange(
                                                    task._id,
                                                    'due_date',
                                                    e.target.value
                                                  )
                                                }
                                                autoFocus
                                                className="h-9 text-sm"
                                              />
                                              <Input
                                                type="time"
                                                defaultValue={task.due_time || ''}
                                                data-time-for-mobile={task._id}
                                                className="h-9 text-sm"
                                                placeholder="Time"
                                              />
                                              {showReminders[task._id] && (
                                                <div className="space-y-1 mt-2">
                                                  <div className="text-xs text-slate-600 font-medium">
                                                    Reminders:
                                                  </div>
                                                  {(reminderValues[task._id] || []).map(
                                                    (totalMinutes, idx) => {
                                                      let value = totalMinutes
                                                      let unit = 'minutes'

                                                      if (
                                                        totalMinutes % 10080 === 0 &&
                                                        totalMinutes >= 10080
                                                      ) {
                                                        value = totalMinutes / 10080
                                                        unit = 'weeks'
                                                      } else if (
                                                        totalMinutes % 1440 === 0 &&
                                                        totalMinutes >= 1440
                                                      ) {
                                                        value = totalMinutes / 1440
                                                        unit = 'days'
                                                      } else if (
                                                        totalMinutes % 60 === 0 &&
                                                        totalMinutes >= 60
                                                      ) {
                                                        value = totalMinutes / 60
                                                        unit = 'hours'
                                                      }

                                                      return (
                                                        <div
                                                          key={idx}
                                                          className="flex items-center gap-1"
                                                        >
                                                          <Input
                                                            type="number"
                                                            value={value}
                                                            onChange={e => {
                                                              const newValue =
                                                                parseInt(e.target.value) || 1
                                                              const multiplier =
                                                                unit === 'minutes'
                                                                  ? 1
                                                                  : unit === 'hours'
                                                                    ? 60
                                                                    : unit === 'days'
                                                                      ? 1440
                                                                      : 10080
                                                              const newMinutes =
                                                                newValue * multiplier

                                                              const newReminders = [
                                                                ...(reminderValues[task._id] || [])
                                                              ]
                                                              newReminders[idx] = newMinutes
                                                              setReminderValues(prev => ({
                                                                ...prev,
                                                                [task._id]: newReminders
                                                              }))
                                                            }}
                                                            className="h-8 text-xs w-20 flex-1"
                                                            placeholder="Value"
                                                            min="1"
                                                          />
                                                          <Select
                                                            value={unit}
                                                            open={selectOpen}
                                                            onOpenChange={setSelectOpen}
                                                            onValueChange={newUnit => {
                                                              const multiplier =
                                                                newUnit === 'minutes'
                                                                  ? 1
                                                                  : newUnit === 'hours'
                                                                    ? 60
                                                                    : newUnit === 'days'
                                                                      ? 1440
                                                                      : 10080
                                                              const newMinutes = value * multiplier

                                                              const newReminders = [
                                                                ...(reminderValues[task._id] || [])
                                                              ]
                                                              newReminders[idx] = newMinutes
                                                              setReminderValues(prev => ({
                                                                ...prev,
                                                                [task._id]: newReminders
                                                              }))
                                                            }}
                                                          >
                                                            <SelectTrigger className="h-8 flex-1 text-xs">
                                                              <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                              <SelectItem value="minutes">
                                                                Minutes
                                                              </SelectItem>
                                                              <SelectItem value="hours">
                                                                Hours
                                                              </SelectItem>
                                                              <SelectItem value="days">
                                                                Days
                                                              </SelectItem>
                                                              <SelectItem value="weeks">
                                                                Weeks
                                                              </SelectItem>
                                                            </SelectContent>
                                                          </Select>
                                                        </div>
                                                      )
                                                    }
                                                  )}
                                                  <div className="flex items-center gap-1">
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => {
                                                        const newReminders = [
                                                          ...(reminderValues[task._id] || []),
                                                          30
                                                        ]
                                                        setReminderValues(prev => ({
                                                          ...prev,
                                                          [task._id]: newReminders
                                                        }))
                                                      }}
                                                      className="flex-1 text-xs"
                                                    >
                                                      Add reminder
                                                    </Button>
                                                    {(reminderValues[task._id] || []).length >
                                                      0 && (
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={e => {
                                                          e.stopPropagation()
                                                          const newReminders = reminderValues[
                                                            task._id
                                                          ].slice(0, -1)
                                                          setReminderValues(prev => ({
                                                            ...prev,
                                                            [task._id]: newReminders
                                                          }))
                                                        }}
                                                      >
                                                        <X className="w-4 h-4" />
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div
                                              onClick={() => {
                                                setTaskValues(prev => ({
                                                  ...prev,
                                                  [`${task._id}-due_date-editing-mobile`]: true
                                                }))
                                                setReminderValues(prev => ({
                                                  ...prev,
                                                  [task._id]: task.reminders || []
                                                }))
                                              }}
                                              className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                            >
                                              {task.due_date ? (
                                                <>
                                                  <div>{formatDateMedium(task.due_date)}</div>
                                                  {task.due_time && (
                                                    <div className="text-xs text-slate-500 mt-1">
                                                      {task.due_time}
                                                    </div>
                                                  )}
                                                  {task.reminders && task.reminders.length > 0 && (
                                                    <div className="text-xs text-slate-500 mt-1">
                                                      🔔 {task.reminders.length}
                                                    </div>
                                                  )}
                                                </>
                                              ) : (
                                                'Set date...'
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-9 w-9 flex-shrink-0 mt-5"
                                            >
                                              <MoreHorizontal className="h-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {statusFilter === 'active' && (
                                              <DropdownMenuItem onClick={() => archiveTask(task)}>
                                                <Archive className="h-4 w-4 mr-2" />
                                                Archive
                                              </DropdownMenuItem>
                                            )}
                                            {statusFilter === 'archived' && (
                                              <DropdownMenuItem onClick={() => unarchiveTask(task)}>
                                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                                Unarchive
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              onClick={() => duplicateMutation.mutate(task)}
                                            >
                                              <Copy className="h-4 w-4 mr-2" />
                                              Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => deleteMutation.mutate(task._id)}
                                              className="text-rose-600"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>

                {sortedTasks.length > 0 && (
                  <TablePagination
                    totalItems={sortedTasks.length}
                    page={page}
                    perPage={perPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onPerPageChange={value => {
                      setPerPage(value)
                      setPage(1)
                    }}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedTasks.length > 0 && bulkMode && (
        <div className="task-table-bulk-actions fixed bottom-4 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto bg-slate-900 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-full shadow-lg flex items-center justify-between lg:justify-start gap-2 lg:gap-4 z-50">
          <span className="text-xs lg:text-sm font-medium">{selectedTasks.length} selected</span>
          <div className="flex items-center gap-1 lg:gap-2">
            {statusFilter === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedTasks, data: { status: 'completed' } })
                }
              >
                <Check className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Complete</span>
              </Button>
            )}
            {statusFilter === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedTasks, data: { status: 'archived' } })
                }
              >
                <Archive className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Archive</span>
              </Button>
            )}
            {statusFilter === 'archived' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedTasks, data: { status: 'pending' } })
                }
              >
                <ArchiveRestore className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Unarchive</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-300 hover:bg-rose-900/30 h-8 px-2 lg:px-3"
              onClick={() => bulkDeleteMutation.mutate(selectedTasks)}
            >
              <Trash2 className="w-4 h-4 lg:mr-1" />
              <span className="hidden lg:inline">Delete</span>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
