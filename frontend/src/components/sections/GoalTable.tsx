import React, { useState, useMemo, useRef } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { offlineFirst, offlineCreate } from '@/hooks/useOfflineFirst'
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
  Star,
  MoreHorizontal,
  Archive,
  Trash2,
  ArrowUpDown,
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
import confetti from 'canvas-confetti'
import { formatDateMedium } from '@/components/utils/formatters'
import GoalTaskRow from './GoalTaskRow'
import { TablePagination } from '../TablePagination'
import { CategorySelectDialog } from '../CategorySelectDialog'
import { useSound } from '@/contexts/SoundContext'
import { useUserLimit } from '@/contexts/UserLimitContext'

function TasksToggleButton({
  goal,
  compactView,
  expandedGoals,
  getGoalTasks,
  toggleExpandGoal,
  queryClient
}) {
  const taskCount = getGoalTasks(goal._id).length
  const isExpanded = expandedGoals[goal._id]
  const handleClick = () => {
    if (taskCount > 0) {
      toggleExpandGoal(goal._id)
    } else {
      offlineCreate('tasks', backend.entities.Task, {
        title: 'New Task',
        status: 'pending',
        category: goal.category,
        business_id: goal.business_id || null,
        goal_id: goal._id
      }).then(newTask => {
        queryClient.setQueryData(['tasks'], old =>
          old ? [newTask, ...old.filter(t => t.id !== newTask.id)] : [newTask]
        )
        toggleExpandGoal(goal._id)
      })
    }
  }
  const colorCls =
    taskCount > 0 ? 'text-blue-600 hover:text-blue-700' : 'text-slate-600 hover:text-slate-900'
  if (compactView) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn('h-8 w-8', colorCls)}
              onClick={handleClick}
            >
              {taskCount > 0 ? (
                isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {taskCount > 0 ? `${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}` : 'Add Task'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleClick}
      className={cn('h-6 px-2 text-xs gap-1', colorCls)}
    >
      {taskCount > 0 ? (
        isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <Plus className="w-3 h-3" />
      )}
      {taskCount > 0 ? `${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}` : 'Add Task'}
    </Button>
  )
}

type GoalTableProps = {
  category?: string
  businessId?: string
  filterType?: 'important' | 'business' | 'category' | 'all'
}

export default function GoalTable({ category, businessId, filterType }: GoalTableProps) {
  const queryClient = useQueryClient()
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentTab, setCurrentTab] = useState('active')
  const [animatingGoal, setAnimatingGoal] = useState(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [showReminders, setShowReminders] = useState({})
  const [reminderValues, setReminderValues] = useState({})
  const [selectOpen, setSelectOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGoals, setSelectedGoals] = useState([])
  const [bulkMode, setBulkMode] = useState(false)
  const [expandedGoals, setExpandedGoals] = useState({})
  const [expandedRelatedTasks, setExpandedRelatedTasks] = useState({})
  const [compactView, setCompactView] = useState(() => {
    const saved = localStorage.getItem('goalTableCompactView')
    return saved ? JSON.parse(saved) : false
  })

  const [hoveredTargetDate, setHoveredTargetDate] = useState(null)
  const [reorderGoals, setReorderGoals] = useState(null)
  const blurTimeoutRef = useRef(null)
  const tableRef = useRef(null)

  const { playSound } = useSound()

  const { limit } = useSubscription()

  const { canCreate } = useUserLimit()

  const goalsLimit = limit('home_goals_limit')

  const { data: allGoals = [] } = useQuery<any[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const d = await backend.entities.Goal.list('-created_date')
      return (d as any[]).filter(r => !r.is_deleted)
    }
  })

  const { data: businesses = [] } = useQuery<any[]>({
    queryKey: ['businesses'],
    queryFn: async () => {
      const d = await backend.entities.Business.list('order')
      return (d as any[]).filter(r => !r.is_deleted)
    }
  })

  const { data: allTasks = [] } = useQuery<any[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const d = await offlineFirst('tasks', () => backend.entities.Task.list('-created_date'))
      return (d as any[]).filter(r => !r.is_deleted)
    }
  })

  const getGoalProgress = goalId => {
    const goalTasks = allTasks.filter(t => t.goal_id === goalId)
    if (goalTasks.length === 0) return 0
    const completedTasks = goalTasks.filter(t => t.status === 'completed').length
    return Math.round((completedTasks / goalTasks.length) * 100)
  }

  let filteredGoals = allGoals
  if (filterType === 'important') {
    filteredGoals = allGoals.filter(g => g.important)
  } else if (filterType === 'business') {
    filteredGoals = allGoals.filter(g => g.category === 'business' && g.business_id === businessId)
  } else if (filterType === 'category') {
    filteredGoals = allGoals.filter(g => g.category === category)
  }

  const goals = filteredGoals
    .filter(g => g.status === currentTab)
    .filter(
      g =>
        !searchQuery ||
        (g.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

  const getBusinessName = businessId => {
    const business = businesses.find(b => b.id === businessId)
    return business ? business.name : 'Business'
  }

  const updateMutation = useMutation<any, any, { id: string; data: Record<string, any> }>({
    mutationFn: async ({ id, data }) => {
      const result = await backend.entities.Goal.update(id, data)

      if (data.category) {
        const goalTasks = allTasks.filter(t => t.goal_id === id)
        if (goalTasks.length > 0) {
          await Promise.all(
            goalTasks.map(task =>
              backend.entities.Task.update(task.id, {
                category: data.category,
                business_id: data.business_id || null
              })
            )
          )
        }
      }

      return result
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previousGoals = queryClient.getQueryData(['goals'])
      queryClient.setQueryData(['goals'], (oldGoals: any) => {
        if (!oldGoals) return oldGoals
        return oldGoals.map((goal: any) => (goal._id === id ? { ...goal, ...data } : goal))
      })
      return { previousGoals }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals)
      }
    },
    onSuccess: () => {
      setAnimatingGoal(null)
    }
  })

  const updateGoalOrderMutation = useMutation<any, any, { _id: string; order: number }[]>({
    mutationFn: async updatedGoals => {
      return Promise.all(
        updatedGoals.map(goal => backend.entities.Goal.update(goal._id, { order: goal.order }))
      )
    },
    onMutate: async newOrderGoals => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previousGoals = queryClient.getQueryData(['goals'])
      queryClient.setQueryData(['goals'], (oldGoals: any) => {
        if (!oldGoals) return oldGoals
        const newGoalsMap = new Map(newOrderGoals.map((goal: any) => [goal._id, goal.order]))
        return oldGoals.map((goal: any) => ({
          ...goal,
          order: newGoalsMap.has(goal._id) ? newGoalsMap.get(goal._id) : goal.order
        }))
      })
      return { previousGoals }
    },
    onError: (err, newOrderGoals, context: any) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals)
      }
      setReorderGoals(null)
    },
    onSuccess: () => {
      setReorderGoals(null)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  const createMutation = useMutation<any, any, Record<string, any>>({
    mutationFn: async data => {
      return backend.entities.Goal.create(data)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      return { previousGoals: queryClient.getQueryData(['goals']) }
    },
    onSuccess: newGoal => {
      queryClient.setQueryData(['goals'], (old: any) => {
        if (!old) return [newGoal]
        const exists = old.find((g: any) => g._id === newGoal._id)
        return exists
          ? old.map((g: any) => (g._id === newGoal._id ? newGoal : g))
          : [newGoal, ...old]
      })

      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousGoals) queryClient.setQueryData(['goals'], context.previousGoals)
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: id => {
      playSound('delete')
      return backend.entities.Goal.delete(id)
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previousGoals = queryClient.getQueryData(['goals'])
      queryClient.setQueryData(['goals'], (oldGoals: any) => {
        if (!oldGoals) return oldGoals
        return oldGoals.filter((g: any) => g._id !== id && g.id !== id)
      })
      return { previousGoals }
    },
    onError: (err, id, context: any) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const duplicateMutation = useMutation<any, any, Record<string, any>>({
    mutationFn: goal => {
      const { id, created_date, updated_date, created_by, ...rest } = goal
      return backend.entities.Goal.create({
        ...rest,
        title: `${rest.title} (copy)`,
        status: 'active',
        order: (goal.order ?? 0) + 0.5
      })
    },
    onSuccess: newGoal => {
      queryClient.setQueryData(['goals'], (old: any) => {
        if (!old) return [newGoal]
        return [newGoal, ...old]
      })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    mutationFn: async ids => {
      playSound('delete')
      await Promise.all(ids.map(id => backend.entities.Goal.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
      setSelectedGoals([])
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: Record<string, any> }>({
    mutationFn: async ({ ids, data }) => {
      if (data.status === 'archived') {
        playSound('archived')
      }
      await Promise.all(ids.map(id => backend.entities.Goal.update(id, data)))
    },
    onMutate: async ({ ids, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previousGoals = queryClient.getQueryData(['goals'])
      queryClient.setQueryData(['goals'], (oldGoals: any) => {
        if (!oldGoals) return oldGoals
        return oldGoals.map((goal: any) => (ids.includes(goal._id) ? { ...goal, ...data } : goal))
      })
      return { previousGoals }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals)
      }
    },
    onSuccess: () => {
      setSelectedGoals([])
    }
  })

  const handleSort = field => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const sortedGoals = useMemo(() => {
    if (reorderGoals) return reorderGoals
    return [...goals].sort((a, b) => {
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
  }, [goals, sortBy, sortOrder, reorderGoals])

  const handleDragEnd = result => {
    if (!result.destination || result.source.index === result.destination.index) return

    // Handle task reordering
    if (result.type === 'task') {
      const goalId = result.source.droppableId.replace('tasks-', '')
      const tasks = getGoalTasks(goalId)
      const newItems = Array.from(tasks)
      const [reorderedItem] = newItems.splice(result.source.index, 1)
      newItems.splice(result.destination.index, 0, reorderedItem)

      const updatedOrderForBackend = newItems.map((task, index) => ({
        id: task.id,
        order: index
      }))

      updateTaskOrderMutation.mutate(updatedOrderForBackend)
      return
    }

    // Handle goal reordering
    const newItems = Array.from(sortedGoals)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)

    setReorderGoals(newItems)

    const updatedOrderForBackend = newItems.map((goal: any, index) => ({
      _id: goal._id,
      order: index
    }))

    updateGoalOrderMutation.mutate(updatedOrderForBackend)
  }

  const paginatedGoals = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return sortedGoals.slice(startIndex, startIndex + perPage)
  }, [sortedGoals, page, perPage])

  const totalPages = Math.ceil(sortedGoals.length / perPage)

  const startEdit = (goalId, field, currentValue, secondValue = null) => {
    if (editingField && editValue !== undefined) {
      const knownSuffixes = [
        '-target_date-time',
        '-target_date',
        '-description',
        '-category',
        '-due_date',
        '-title'
      ]
      let prevId: string | null = null
      let prevField: string | null = null
      for (const suffix of knownSuffixes) {
        if (editingField.endsWith(suffix)) {
          prevId = editingField.slice(0, editingField.length - suffix.length)
          prevField = suffix.slice(1).replace('-time', '')
          break
        }
      }
      if (prevId && prevField) {
        const prevTask = allTasks.find(t => t.id === prevId)
        if (prevTask) {
          updateTaskMutation.mutate({ id: prevId, data: { [prevField]: editValue } })
        } else {
          updateMutation.mutate({ id: prevId, data: { [prevField]: editValue } })
        }
      }
    }

    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    setEditingField(`${goalId}-${field}`)
    setEditValue(currentValue || '')
    if (secondValue !== null) {
      setEditingField(`${goalId}-${field}-time`)
    }
  }

  const saveEdit = (goalId, field, additionalData = {}) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    updateMutation.mutate({ id: goalId, data: { [field]: editValue, ...additionalData } })
    setEditingField(null)
  }

  const handleBlur = (goalId, field, additionalData = {}) => {
    blurTimeoutRef.current = setTimeout(() => {
      saveEdit(goalId, field, additionalData)
      blurTimeoutRef.current = null
    }, 150)
  }

  const saveTaskEdit = (taskId, field) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    updateTaskMutation.mutate({ id: taskId, data: { [field]: editValue } })
    setEditingField(null)
  }

  const handleTaskBlur = (taskId, field) => {
    blurTimeoutRef.current = setTimeout(() => {
      saveTaskEdit(taskId, field)
      blurTimeoutRef.current = null
    }, 150)
  }

  const handleKeyDown = (e, goalId, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit(goalId, field)
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  const toggleImportant = goal => {
    updateMutation.mutate({ id: goal._id || goal._id, data: { important: !goal.important } })
  }

  const triggerCelebration = goalId => {
    const checkboxElement = document.querySelector(`[data-goal-id="${goalId}"]`)
    if (!checkboxElement) return

    const rect = checkboxElement.getBoundingClientRect()
    const x = (rect.left + rect.width / 2) / window.innerWidth
    const y = (rect.top + rect.height / 2) / window.innerHeight

    confetti({
      particleCount: 40,
      spread: 80,
      origin: { x, y },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#FFD700', '#FFA500'],
      shapes: ['line'],
      scalar: 1.2,
      gravity: 1.5,
      ticks: 100
    })
  }

  const toggleAchieved = goal => {
    const newStatus = goal.status === 'archived' ? 'active' : 'archived'
    const goalId = goal._id || goal._id

    if (newStatus === 'archived') {
      setAnimatingGoal(goalId)
      playSound('goal-achieved')
      triggerCelebration(goalId)
      setTimeout(() => {
        updateMutation.mutate({ id: goalId, data: { status: newStatus } })
        setAnimatingGoal(null)
      }, 1000)
    } else {
      updateMutation.mutate({ id: goalId, data: { status: newStatus } })
    }
  }

  const archiveGoal = goal => {
    playSound('archived')
    updateMutation.mutate({ id: goal._id || goal._id, data: { status: 'archived' } })
  }

  const unarchiveGoal = goal => {
    updateMutation.mutate({ id: goal._id || goal._id, data: { status: 'active' } })
  }

  const handleAddNew = () => {
    if (filterType === 'all') {
      setShowCategoryDialog(true)
    } else {
      const minOrder = goals.length > 0 ? Math.min(...goals.map(g => g.order ?? 999999)) : 0
      const data = {
        title: 'New Goal',
        status: 'active',
        order: minOrder === 999999 ? 0 : minOrder - 1
      } as Record<string, any>

      if (filterType === 'important') {
        data.important = true
        data.category = 'assets'
      } else if (category) {
        data.category = category
      }

      if (filterType === 'business' && businessId) {
        data.category = 'business'
        data.business_id = businessId
      }
      if (businessId && !data.category) data.business_id = businessId
      createMutation.mutate(data)
    }
  }

  const handleCategorySelect = (selectedCategory, selectedBusinessId = null) => {
    const minOrder = allGoals.length > 0 ? Math.min(...allGoals.map(g => g.order ?? 999999)) : 0
    const data = {
      title: 'New Goal',
      status: 'active',
      category: selectedCategory,
      order: minOrder === 999999 ? 0 : minOrder - 1
    } as Record<string, any>

    if (selectedBusinessId) {
      data.business_id = selectedBusinessId
    }

    createMutation.mutate(data)
    setShowCategoryDialog(false)
  }

  const toggleSelectAll = () => {
    if (selectedGoals.length === paginatedGoals.length) {
      setSelectedGoals([])
    } else {
      setSelectedGoals(paginatedGoals.map(g => g.id))
    }
  }

  const toggleSelectGoal = goalId => {
    setSelectedGoals(prev =>
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    )
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedGoals([])
    }
  }

  const toggleExpandGoal = goalId => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }))
  }

  const getGoalTasks = goalId => {
    return allTasks
      .filter(t => t.goal_id === goalId && t.status !== 'archived')
      .sort((a, b) => {
        const orderA = a.order ?? 999999
        const orderB = b.order ?? 999999
        return orderA - orderB
      })
  }

  const updateTaskMutation = useMutation<any, any, { id: string; data: Record<string, any> }>({
    mutationFn: ({ id, data }) => backend.entities.Task.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData(['tasks'])
      queryClient.setQueryData(['tasks'], (oldTasks: any) => {
        if (!oldTasks) return oldTasks
        return oldTasks.map((task: any) => (task.id === id ? { ...task, ...data } : task))
      })
      return { previousTasks }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const updateTaskOrderMutation = useMutation<any, any, { id: string; order: number }[]>({
    mutationFn: async updatedTasks => {
      return Promise.all(
        updatedTasks.map((task: any) =>
          backend.entities.Task.update(task.id, { order: task.order })
        )
      )
    },
    onMutate: async newOrderTasks => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData(['tasks'])
      queryClient.setQueryData(['tasks'], (oldTasks: any) => {
        if (!oldTasks) return oldTasks
        const newTasksMap = new Map(newOrderTasks.map((task: any) => [task.id, task.order]))
        return oldTasks.map((task: any) => ({
          ...task,
          order: newTasksMap.has(task.id) ? newTasksMap.get(task.id) : task.order
        }))
      })
      return { previousTasks }
    },
    onError: (err, newOrderTasks, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const tabs = [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' }
  ]

  return (
    <>
      <CategorySelectDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        businesses={businesses}
        onSelect={handleCategorySelect}
        title="Choose a category"
        description="Please choose a category for the new goal."
      />

      <div className="goal-table-container bg-white rounded-xl overflow-hidden mb-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <div className="goal-table-header flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3 p-4">
            <TabsList className="bg-[#eaecf4] p-1 flex-1 lg:flex-none flex">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-md bg-transparent text-[#475569] data-[state=active]:bg-white
                   data-[state=active]:text-slate-900 data-[state=active]:shadow-sm flex-1 lg:flex-none lg:px-6"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex items-center gap-2 lg:ml-auto">
              <div className="relative hidden lg:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  id="goals-search"
                  placeholder="Search goals..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-8 h-9 w-48 text-sm"
                />
              </div>
              <UsageLimitGate allowed={canCreate('goals')} label="goals">
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
                        localStorage.setItem('goalTableCompactView', JSON.stringify(newValue))
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

          <TabsContent value={currentTab} className="m-0" ref={tableRef}>
            {goals.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500 mb-4">No {currentTab} goals</p>
                {currentTab === 'active' && (
                  <Button onClick={handleAddNew} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Goal
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="goal-table-desktop hidden [@media(min-width:1130px)]:block overflow-x-auto">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <table className="goal-table w-full min-w-[1000px]">
                      <thead className="goal-table-thead bg-slate-50 border-b border-slate-200">
                        <tr className="goal-table-header-row">
                          {!sortBy && (
                            <th className="goal-table-th-drag pl-3 pr-2 py-3 text-left w-10">
                              <GripVertical className="w-4 h-4 text-slate-400 mx-auto" />
                            </th>
                          )}
                          <th className="goal-table-th-star pl-3 pr-2 py-3 text-left w-8">
                            <button
                              onClick={() => handleSort('important')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              <Star className="w-4 h-4" />
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="goal-table-th-checkbox py-3 text-center w-8">
                            <Check className="w-4 h-4 text-slate-700 mx-auto" />
                          </th>
                          {bulkMode && (
                            <th className="goal-table-th-bulk px-4 py-3 text-center w-12">
                              <Checkbox
                                checked={
                                  selectedGoals.length === paginatedGoals.length &&
                                  paginatedGoals.length > 0
                                }
                                onCheckedChange={toggleSelectAll}
                              />
                            </th>
                          )}
                          <th className="goal-table-th-title px-4 py-3 text-left w-64">
                            <button
                              onClick={() => handleSort('title')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              Title
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="goal-table-th-description px-4 py-3 text-left">
                            <span className="text-xs font-medium text-slate-700">Description</span>
                          </th>
                          {(filterType === 'all' || filterType === 'important') && (
                            <th className="goal-table-th-category px-4 py-3 text-left w-32">
                              <span className="text-xs font-medium text-slate-700">Category</span>
                            </th>
                          )}
                          <th className="goal-table-th-progress px-4 py-3 text-left w-32">
                            <span className="text-xs font-medium text-slate-700">Progress</span>
                          </th>
                          <th className="goal-table-th-targetdate px-4 py-3 text-left w-40">
                            <button
                              onClick={() => handleSort('target_date')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              Target Date
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="goal-table-th-actions px-4 py-3 text-center w-20">
                            <span className="text-xs font-medium text-slate-700">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <Droppable droppableId="goals" type="goal">
                        {provided => (
                          <tbody
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="goal-table-tbody"
                          >
                            {paginatedGoals.map((goal, index) => {
                              const goalOverLimit =
                                goalsLimit !== Infinity && allGoals.indexOf(goal) >= goalsLimit
                              return (
                                <Draggable
                                  key={goal._id}
                                  draggableId={`goal-${goal._id}`}
                                  index={index}
                                  isDragDisabled={!!sortBy || goalOverLimit}
                                >
                                  {(provided, snapshot) => (
                                    <React.Fragment>
                                      <tr
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={cn(
                                          'goal-table-row border-b border-slate-100 hover:bg-slate-50',
                                          animatingGoal === goal._id &&
                                            'animate-[wiggle_0.3s_ease-in-out]',
                                          compactView && 'h-12',
                                          snapshot.isDragging && 'opacity-50'
                                        )}
                                      >
                                        {!sortBy && (
                                          <td
                                            className={cn(
                                              'goal-table-td-drag pl-3 pr-2 w-10 align-middle cursor-grab active:cursor-grabbing',
                                              compactView ? 'py-1' : 'py-3'
                                            )}
                                            {...provided.dragHandleProps}
                                          >
                                            <GripVertical className="w-4 h-4 text-slate-400" />
                                          </td>
                                        )}
                                        <td
                                          className={cn(
                                            'goal-table-td-star pl-3 pr-2 w-8 align-middle',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <button onClick={() => toggleImportant(goal)}>
                                            <Star
                                              className={cn(
                                                'w-5 h-5',
                                                goal.important
                                                  ? 'fill-amber-400 text-amber-400'
                                                  : 'text-slate-300 hover:text-slate-400'
                                              )}
                                            />
                                          </button>
                                        </td>
                                        <td
                                          className={cn(
                                            'goal-table-td-checkbox text-center w-8 align-middle',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <Checkbox
                                            data-goal-id={goal._id}
                                            checked={
                                              goal.status === 'archived' ||
                                              animatingGoal === goal._id
                                            }
                                            onCheckedChange={() => toggleAchieved(goal)}
                                            className={cn(
                                              (goal.status === 'archived' ||
                                                animatingGoal === goal._id) &&
                                                'border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500'
                                            )}
                                          />
                                        </td>
                                        {bulkMode && (
                                          <td
                                            className={cn(
                                              'goal-table-td-bulk px-4 text-center w-12 align-middle',
                                              compactView ? 'py-1' : 'py-3'
                                            )}
                                          >
                                            <Checkbox
                                              checked={selectedGoals.includes(goal._id)}
                                              onCheckedChange={() => toggleSelectGoal(goal._id)}
                                            />
                                          </td>
                                        )}
                                        <td
                                          className={cn(
                                            'goal-table-td-title px-4 align-middle w-64',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <Input
                                            id={`goal-title-${goal._id}`}
                                            value={
                                              editingField === `${goal._id}-title`
                                                ? editValue
                                                : goal.title
                                            }
                                            onChange={e => {
                                              setEditValue(e.target.value)
                                              setEditingField(`${goal._id}-title`)
                                            }}
                                            onBlur={() => {
                                              if (editingField === `${goal._id}-title`) {
                                                handleBlur(goal._id, 'title')
                                              }
                                            }}
                                            onFocus={() => startEdit(goal._id, 'title', goal.title)}
                                            onKeyDown={e => handleKeyDown(e, goal._id, 'title')}
                                            maxLength={200}
                                            className={cn(
                                              'border-0 shadow-none px-2 py-1 h-auto font-medium text-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                                              compactView ? 'line-clamp-1' : ''
                                            )}
                                          />
                                        </td>
                                        <td
                                          className={cn(
                                            'goal-table-td-description px-4 align-middle',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <Textarea
                                            id={`goal-description-${goal._id}`}
                                            value={
                                              editingField === `${goal._id}-description`
                                                ? editValue
                                                : goal.description || ''
                                            }
                                            onChange={e => {
                                              setEditValue(e.target.value)
                                              setEditingField(`${goal._id}-description`)
                                            }}
                                            onBlur={() => {
                                              if (editingField === `${goal._id}-description`) {
                                                handleBlur(goal._id, 'description')
                                              }
                                            }}
                                            onFocus={() =>
                                              startEdit(goal._id, 'description', goal.description)
                                            }
                                            onKeyDown={e =>
                                              handleKeyDown(e, goal._id, 'description')
                                            }
                                            placeholder="Add description..."
                                            maxLength={5000}
                                            className={cn(
                                              'w-full resize-none border-0 shadow-none px-2 py-1 text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                                              compactView
                                                ? 'h-8 min-h-0 line-clamp-1 overflow-hidden'
                                                : 'min-h-[60px]'
                                            )}
                                          />
                                        </td>
                                        {(filterType === 'all' || filterType === 'important') && (
                                          <td
                                            className={cn(
                                              'goal-table-td-category px-4 w-32 max-w-32 align-middle',
                                              compactView ? 'py-1' : 'py-3'
                                            )}
                                          >
                                            {editingField === `${goal._id}-category` ? (
                                              <Select
                                                value={editValue}
                                                onValueChange={value => {
                                                  setEditValue(value)
                                                  const updateData = { category: value } as Record<
                                                    string,
                                                    any
                                                  >
                                                  if (value !== 'business') {
                                                    updateData.business_id = null
                                                  }
                                                  updateMutation.mutate({
                                                    id: goal._id,
                                                    data: updateData
                                                  })
                                                  setEditingField(null)
                                                }}
                                              >
                                                <SelectTrigger className="h-8 border-0 shadow-none focus:ring-1 focus:ring-indigo-500 bg-transparent hover:bg-slate-100 [&>span]:truncate [&>svg]:flex-shrink-0">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="max-w-[200px]">
                                                  <SelectItem value="finances" className="truncate">
                                                    Finance
                                                  </SelectItem>
                                                  <SelectItem value="assets" className="truncate">
                                                    Assets
                                                  </SelectItem>
                                                  <SelectItem
                                                    value="health_body"
                                                    className="truncate"
                                                  >
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
                                            ) : (
                                              <div
                                                onClick={() => {
                                                  const currentValue =
                                                    goal.category === 'business' && goal.business_id
                                                      ? `business-${goal.business_id}`
                                                      : goal.category
                                                  startEdit(goal._id, 'category', currentValue)
                                                }}
                                                className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                              >
                                                {goal.business_id
                                                  ? getBusinessName(goal.business_id)
                                                  : goal.category?.startsWith('business-')
                                                    ? businesses.find(
                                                        b =>
                                                          String(b.id) ===
                                                          goal.category.replace('business-', '')
                                                      )?.name || goal.category
                                                    : goal.category === 'finances'
                                                      ? 'Finance'
                                                      : goal.category === 'health_body'
                                                        ? 'Health'
                                                        : goal.category === 'health_mind'
                                                          ? 'Mind'
                                                          : goal.category === 'fitness'
                                                            ? 'Fitness'
                                                            : goal.category === 'assets'
                                                              ? 'Assets'
                                                              : goal.category === 'hobbies'
                                                                ? 'Hobbies'
                                                                : goal.category === 'learning'
                                                                  ? 'Learning'
                                                                  : goal.category ===
                                                                      'relationships'
                                                                    ? 'Relationships'
                                                                    : goal.category}
                                              </div>
                                            )}
                                          </td>
                                        )}
                                        <td
                                          className={cn(
                                            'goal-table-td-progress px-4 w-32 align-middle',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <div className="goal-progress-wrapper">
                                            <div className="flex items-center gap-2">
                                              <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                <div
                                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                  style={{ width: `${getGoalProgress(goal._id)}%` }}
                                                />
                                              </div>
                                              <span className="text-xs text-slate-600 font-medium w-10 text-right">
                                                {getGoalProgress(goal._id)}%
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                        <td
                                          className={cn(
                                            'goal-table-td-targetdate px-4 w-40 align-middle',
                                            compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          {editingField === `${goal._id}-target_date` ? (
                                            <div
                                              className="goal-targetdate-wrapper space-y-1"
                                              onBlur={e => {
                                                if (selectOpen) return
                                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                                  const timeInput = document.querySelector(
                                                    `input[data-time-for="${goal._id}"]`
                                                  ) as HTMLInputElement | null
                                                  const reminders = reminderValues[goal._id] || []
                                                  saveEdit(goal._id, 'target_date', {
                                                    target_time: timeInput?.value || null,
                                                    reminders
                                                  })
                                                  setShowReminders({})
                                                  setReminderValues({})
                                                }
                                              }}
                                            >
                                              <Input
                                                type="date"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    const timeInput = document.querySelector(
                                                      `input[data-time-for="${goal._id}"]`
                                                    ) as HTMLInputElement | null
                                                    const reminders = reminderValues[goal._id] || []
                                                    saveEdit(goal._id, 'target_date', {
                                                      target_time: timeInput?.value || null,
                                                      reminders
                                                    })
                                                    setShowReminders({})
                                                    setReminderValues({})
                                                  } else if (e.key === 'Escape') {
                                                    setEditingField(null)
                                                    setShowReminders({})
                                                    setReminderValues({})
                                                  }
                                                }}
                                                autoFocus
                                                className="h-8"
                                              />
                                              <div className="flex items-center gap-1">
                                                <Input
                                                  type="time"
                                                  defaultValue={goal.target_time || ''}
                                                  data-time-for={goal._id}
                                                  className="h-8 text-xs flex-1"
                                                  placeholder="Time"
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                      const timeInput = document.querySelector(
                                                        `input[data-time-for="${goal._id}"]`
                                                      ) as HTMLInputElement | null
                                                      const reminders =
                                                        reminderValues[goal._id] || []
                                                      saveEdit(goal._id, 'target_date', {
                                                        target_time: timeInput?.value || null,
                                                        reminders
                                                      })
                                                      setShowReminders({})
                                                      setReminderValues({})
                                                    } else if (e.key === 'Escape') {
                                                      setEditingField(null)
                                                      setShowReminders({})
                                                      setReminderValues({})
                                                    }
                                                  }}
                                                />
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => {
                                                    setShowReminders(prev => ({
                                                      ...prev,
                                                      [goal._id]: !prev[goal._id]
                                                    }))
                                                    if (!reminderValues[goal._id]) {
                                                      setReminderValues(prev => ({
                                                        ...prev,
                                                        [goal._id]: goal.reminders || []
                                                      }))
                                                    }
                                                  }}
                                                >
                                                  <Bell className="w-4 h-4" />
                                                </Button>
                                              </div>
                                              {showReminders[goal._id] && (
                                                <div className="space-y-1 mt-2">
                                                  <div className="text-xs text-slate-600 font-medium">
                                                    Reminders:
                                                  </div>
                                                  {(reminderValues[goal._id] || []).map(
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
                                                                ...(reminderValues[goal._id] || [])
                                                              ]
                                                              newReminders[idx] = newMinutes
                                                              setReminderValues(prev => ({
                                                                ...prev,
                                                                [goal._id]: newReminders
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
                                                                ...(reminderValues[goal._id] || [])
                                                              ]
                                                              newReminders[idx] = newMinutes
                                                              setReminderValues(prev => ({
                                                                ...prev,
                                                                [goal._id]: newReminders
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
                                                          ...(reminderValues[goal._id] || []),
                                                          30
                                                        ]
                                                        setReminderValues(prev => ({
                                                          ...prev,
                                                          [goal._id]: newReminders
                                                        }))
                                                      }}
                                                      className="flex-1 text-xs"
                                                    >
                                                      Add reminder
                                                    </Button>
                                                    {(reminderValues[goal._id] || []).length >
                                                      0 && (
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={e => {
                                                          e.stopPropagation()
                                                          const newReminders = reminderValues[
                                                            goal._id
                                                          ].slice(0, -1)
                                                          setReminderValues(prev => ({
                                                            ...prev,
                                                            [goal._id]: newReminders
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
                                                startEdit(goal._id, 'target_date', goal.target_date)
                                                setReminderValues(prev => ({
                                                  ...prev,
                                                  [goal._id]: goal.reminders || []
                                                }))
                                              }}
                                              onMouseEnter={() => setHoveredTargetDate(goal._id)}
                                              onMouseLeave={() => setHoveredTargetDate(null)}
                                              className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                            >
                                              {goal.target_date ? (
                                                <>
                                                  <div>{formatDateMedium(goal.target_date)}</div>
                                                  {!compactView && goal.target_time && (
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                      {goal.target_time}
                                                    </div>
                                                  )}
                                                  {!compactView &&
                                                    goal.reminders &&
                                                    goal.reminders.length > 0 && (
                                                      <div className="text-xs text-slate-500 mt-0.5">
                                                        🔔 {goal.reminders.length}
                                                      </div>
                                                    )}
                                                  {compactView &&
                                                    hoveredTargetDate === goal._id &&
                                                    goal.target_time && (
                                                      <div className="text-xs text-slate-500 mt-0.5">
                                                        {goal.target_time}
                                                      </div>
                                                    )}
                                                  {compactView &&
                                                    hoveredTargetDate === goal._id &&
                                                    goal.reminders &&
                                                    goal.reminders.length > 0 && (
                                                      <div className="text-xs text-slate-500 mt-0.5">
                                                        🔔 {goal.reminders.length}
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
                                            'goal-table-td-actions px-4 text-center w-20 align-middle',
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
                                                    onClick={() => duplicateMutation.mutate(goal)}
                                                  >
                                                    <Copy className="h-4 w-4 text-slate-600" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Duplicate</TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                            {currentTab === 'active' && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                      onClick={() => archiveGoal(goal)}
                                                    >
                                                      <Archive className="h-4 w-4 text-slate-600" />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Archive</TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                            {currentTab === 'archived' && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                      onClick={() => unarchiveGoal(goal)}
                                                    >
                                                      <Archive className="h-4 w-4 text-slate-600" />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Unarchive</TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                            {currentTab === 'archived' && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                      onClick={() => unarchiveGoal(goal)}
                                                    >
                                                      <Archive className="h-4 w-4 text-slate-600" />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Move to Active</TooltipContent>
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
                                                    onClick={() => deleteMutation.mutate(goal._id)}
                                                  >
                                                    <Trash2 className="h-4 w-4 text-rose-600" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete</TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                            <TasksToggleButton
                                              goal={goal}
                                              compactView={compactView}
                                              expandedGoals={expandedGoals}
                                              getGoalTasks={getGoalTasks}
                                              toggleExpandGoal={toggleExpandGoal}
                                              queryClient={queryClient}
                                            />
                                          </div>
                                        </td>
                                      </tr>
                                      {expandedGoals[goal._id] && (
                                        <>
                                          <tr className="bg-white">
                                            <td
                                              colSpan={
                                                !sortBy
                                                  ? bulkMode
                                                    ? filterType === 'all' ||
                                                      filterType === 'important'
                                                      ? 10
                                                      : 9
                                                    : filterType === 'all' ||
                                                        filterType === 'important'
                                                      ? 9
                                                      : 8
                                                  : bulkMode
                                                    ? filterType === 'all' ||
                                                      filterType === 'important'
                                                      ? 9
                                                      : 8
                                                    : filterType === 'all' ||
                                                        filterType === 'important'
                                                      ? 8
                                                      : 7
                                              }
                                              className="p-0"
                                            >
                                              <table className="w-full">
                                                <Droppable
                                                  droppableId={`tasks-${goal._id}`}
                                                  type="task"
                                                >
                                                  {provided => (
                                                    <tbody
                                                      {...provided.droppableProps}
                                                      ref={provided.innerRef}
                                                    >
                                                      {getGoalTasks(goal._id)
                                                        .slice(0, 10)
                                                        .map((task, taskIndex) => (
                                                          <GoalTaskRow
                                                            key={task.id}
                                                            task={task}
                                                            taskIndex={taskIndex}
                                                            goalId={goal._id}
                                                            sortBy={sortBy}
                                                            bulkMode={bulkMode}
                                                            filterType={filterType}
                                                            editingField={editingField}
                                                            editValue={editValue}
                                                            selectOpen={selectOpen}
                                                            showReminders={showReminders}
                                                            reminderValues={reminderValues}
                                                            setEditValue={setEditValue}
                                                            setEditingField={setEditingField}
                                                            setSelectOpen={setSelectOpen}
                                                            setShowReminders={setShowReminders}
                                                            setReminderValues={setReminderValues}
                                                            startEdit={startEdit}
                                                            handleTaskBlur={handleTaskBlur}
                                                            saveTaskEdit={saveTaskEdit}
                                                            updateTaskMutation={updateTaskMutation}
                                                            updateTaskOrderMutation={
                                                              updateTaskOrderMutation
                                                            }
                                                            playSound={playSound}
                                                            queryClient={queryClient}
                                                            getGoalTasks={getGoalTasks}
                                                          />
                                                        ))}
                                                      {provided.placeholder}
                                                    </tbody>
                                                  )}
                                                </Droppable>
                                              </table>
                                            </td>
                                          </tr>
                                          {getGoalTasks(goal._id).length > 10 && (
                                            <tr className="bg-slate-50">
                                              <td
                                                colSpan={
                                                  !sortBy
                                                    ? bulkMode
                                                      ? filterType === 'all' ||
                                                        filterType === 'important'
                                                        ? 10
                                                        : 9
                                                      : filterType === 'all' ||
                                                          filterType === 'important'
                                                        ? 9
                                                        : 8
                                                    : bulkMode
                                                      ? filterType === 'all' ||
                                                        filterType === 'important'
                                                        ? 9
                                                        : 8
                                                      : filterType === 'all' ||
                                                          filterType === 'important'
                                                        ? 8
                                                        : 7
                                                }
                                                className="px-4 py-2 text-xs text-slate-500 text-center"
                                              >
                                                Showing 10 of {getGoalTasks(goal._id).length} tasks
                                              </td>
                                            </tr>
                                          )}
                                          <tr className="bg-slate-50">
                                            <td
                                              colSpan={
                                                !sortBy
                                                  ? bulkMode
                                                    ? filterType === 'all' ||
                                                      filterType === 'important'
                                                      ? 10
                                                      : 9
                                                    : filterType === 'all' ||
                                                        filterType === 'important'
                                                      ? 9
                                                      : 8
                                                  : bulkMode
                                                    ? filterType === 'all' ||
                                                      filterType === 'important'
                                                      ? 9
                                                      : 8
                                                    : filterType === 'all' ||
                                                        filterType === 'important'
                                                      ? 8
                                                      : 7
                                              }
                                              className="px-4 py-2 text-right"
                                            >
                                              <Button
                                                onClick={() => {
                                                  const data = {
                                                    title: 'New Task',
                                                    status: 'pending',
                                                    category: goal.category,
                                                    business_id: goal.business_id || null,
                                                    goal_id: goal._id
                                                  }
                                                  offlineCreate(
                                                    'tasks',
                                                    backend.entities.Task,
                                                    data
                                                  ).then(newTask => {
                                                    queryClient.setQueryData(
                                                      ['tasks'],
                                                      (old: any) =>
                                                        old
                                                          ? [
                                                              newTask,
                                                              ...old.filter(
                                                                t => t.id !== newTask.id
                                                              )
                                                            ]
                                                          : [newTask]
                                                    )
                                                  })
                                                }}
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs text-slate-500 hover:text-slate-700"
                                              >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Add Task
                                              </Button>
                                            </td>
                                          </tr>
                                        </>
                                      )}
                                    </React.Fragment>
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

                <div className="goal-table-mobile block [@media(min-width:1130px)]:hidden">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="goals-mobile">
                      {provided => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {paginatedGoals.map((goal, index) => (
                            <Draggable
                              key={goal._id}
                              draggableId={goal._id}
                              index={index}
                              isDragDisabled={!!sortBy}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    'goal-card p-4 space-y-3 border-b-[10px]',
                                    index === 0 && 'border-t-[10px]',
                                    animatingGoal === goal._id &&
                                      'animate-[wiggle_0.3s_ease-in-out]',
                                    snapshot.isDragging && 'opacity-50',
                                    goalsLimit !== Infinity &&
                                      allGoals.indexOf(goal) >= goalsLimit &&
                                      'opacity-50 pointer-events-none select-none'
                                  )}
                                  style={{
                                    borderBottomColor: '#f5f7fb',
                                    borderTopColor: '#f5f7fb',
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <div className="goal-card-header flex items-start gap-3">
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
                                        checked={selectedGoals.includes(goal._id)}
                                        onCheckedChange={() => toggleSelectGoal(goal._id)}
                                        className="flex-shrink-0 mt-1"
                                      />
                                    )}
                                    <button
                                      onClick={() => toggleImportant(goal)}
                                      className="flex-shrink-0 mt-1"
                                    >
                                      <Star
                                        className={cn(
                                          'w-5 h-5',
                                          goal.important
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-slate-300'
                                        )}
                                      />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <Input
                                        value={
                                          editingField === `${goal._id}-title`
                                            ? editValue
                                            : goal.title
                                        }
                                        onChange={e => {
                                          setEditValue(e.target.value)
                                          setEditingField(`${goal._id}-title`)
                                        }}
                                        onBlur={() => {
                                          if (editingField === `${goal._id}-title`) {
                                            handleBlur(goal._id, 'title')
                                          }
                                        }}
                                        onFocus={() => startEdit(goal._id, 'title', goal.title)}
                                        maxLength={200}
                                        className="w-full border-0 shadow-none px-0 py-0 h-auto font-medium text-slate-900 focus-visible:ring-0 bg-transparent"
                                      />
                                    </div>
                                    <Checkbox
                                      data-goal-id={goal._id}
                                      checked={
                                        goal.status === 'archived' || animatingGoal === goal._id
                                      }
                                      onCheckedChange={() => toggleAchieved(goal)}
                                      className={cn(
                                        'flex-shrink-0 mt-1',
                                        (goal.status === 'archived' ||
                                          animatingGoal === goal._id) &&
                                          'border-amber-500 data-[state=checked]:bg-amber-500'
                                      )}
                                    />
                                  </div>

                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleExpandGoal(goal._id)}
                                      className="flex-1 justify-start gap-2 text-slate-600"
                                    >
                                      {expandedGoals[goal._id] ? (
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
                                    {getGoalTasks(goal._id).length > 0 ? (
                                      <span className="text-xs text-indigo-600 font-medium">
                                        {getGoalTasks(goal._id).length}{' '}
                                        {getGoalTasks(goal._id).length === 1 ? 'task' : 'tasks'}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-transparent">0 tasks</span>
                                    )}
                                  </div>

                                  {expandedGoals[goal._id] && (
                                    <>
                                      <Textarea
                                        value={
                                          editingField === `${goal._id}-description`
                                            ? editValue
                                            : goal.description || ''
                                        }
                                        onChange={e => {
                                          setEditValue(e.target.value)
                                          setEditingField(`${goal._id}-description`)
                                        }}
                                        onBlur={() => {
                                          if (editingField === `${goal._id}-description`) {
                                            handleBlur(goal._id, 'description')
                                          }
                                        }}
                                        onFocus={() =>
                                          startEdit(goal._id, 'description', goal.description)
                                        }
                                        placeholder="Add description..."
                                        maxLength={5000}
                                        className="goal-card-description border-0 shadow-none px-0 py-0 min-h-[60px] resize-none text-sm text-slate-600 focus-visible:ring-0 bg-transparent"
                                      />

                                      <div className="goal-card-meta grid grid-cols-2 gap-2 text-sm">
                                        {(filterType === 'all' || filterType === 'important') && (
                                          <div>
                                            <label className="text-xs text-slate-500 block mb-1">
                                              Category
                                            </label>
                                            <Select
                                              value={
                                                goal.category === 'business' && goal.business_id
                                                  ? `business-${goal.business_id}`
                                                  : goal.category
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
                                                  id: goal._id,
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
                                            Progress
                                          </label>
                                          <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                                              <div
                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${getGoalProgress(goal._id)}%` }}
                                              />
                                            </div>
                                            <span className="text-xs text-slate-600 font-medium">
                                              {getGoalProgress(goal._id)}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="goal-card-footer flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                          <label className="text-xs text-slate-500 block mb-1">
                                            Target Date
                                          </label>
                                          {editingField === `${goal._id}-target_date` ? (
                                            <div className="space-y-1">
                                              <Input
                                                type="date"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onBlur={e => {
                                                  if (
                                                    !e.currentTarget.parentElement?.contains(
                                                      e.relatedTarget
                                                    )
                                                  ) {
                                                    const timeInput = document.querySelector(
                                                      `input[data-mobile-time-for="${goal._id}"]`
                                                    ) as HTMLInputElement | null
                                                    handleBlur(goal._id, 'target_date', {
                                                      target_time: timeInput?.value || null
                                                    })
                                                  }
                                                }}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    const timeInput = document.querySelector(
                                                      `input[data-mobile-time-for="${goal._id}"]`
                                                    ) as HTMLInputElement | null
                                                    saveEdit(goal._id, 'target_date', {
                                                      target_time: timeInput?.value || null
                                                    })
                                                  } else if (e.key === 'Escape') {
                                                    setEditingField(null)
                                                  }
                                                }}
                                                className="h-9 text-sm"
                                              />
                                              <Input
                                                type="time"
                                                defaultValue={goal.target_time || ''}
                                                data-mobile-time-for={goal._id}
                                                className="h-9 text-sm"
                                                placeholder="Time"
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    const timeInput = document.querySelector(
                                                      `input[data-mobile-time-for="${goal._id}"]`
                                                    ) as HTMLInputElement | null
                                                    saveEdit(goal._id, 'target_date', {
                                                      target_time: timeInput?.value || null
                                                    })
                                                  } else if (e.key === 'Escape') {
                                                    setEditingField(null)
                                                  }
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <div
                                              onClick={() =>
                                                startEdit(goal._id, 'target_date', goal.target_date)
                                              }
                                              className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                            >
                                              {goal.target_date ? (
                                                <>
                                                  <div>{formatDateMedium(goal.target_date)}</div>
                                                  {goal.target_time && (
                                                    <div className="text-xs text-slate-500 mt-1">
                                                      {goal.target_time}
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
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {currentTab === 'active' && (
                                              <DropdownMenuItem onClick={() => archiveGoal(goal)}>
                                                <Archive className="h-4 w-4 mr-2" />
                                                Archive
                                              </DropdownMenuItem>
                                            )}
                                            {currentTab === 'archived' && (
                                              <DropdownMenuItem onClick={() => unarchiveGoal(goal)}>
                                                <Archive className="h-4 w-4 mr-2" />
                                                Unarchive
                                              </DropdownMenuItem>
                                            )}
                                            {currentTab === 'archived' && (
                                              <DropdownMenuItem onClick={() => unarchiveGoal(goal)}>
                                                <Archive className="h-4 w-4 mr-2" />
                                                Move to Active
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              onClick={() => duplicateMutation.mutate(goal)}
                                            >
                                              <Copy className="h-4 w-4 mr-2" />
                                              Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => deleteMutation.mutate(goal._id)}
                                              className="text-rose-600"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>

                                      <div>
                                        {getGoalTasks(goal._id).length > 0 && (
                                          <button
                                            onClick={() =>
                                              setExpandedRelatedTasks(prev => ({
                                                ...prev,
                                                [goal._id]: !prev[goal._id]
                                              }))
                                            }
                                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 mb-2"
                                          >
                                            {expandedRelatedTasks[goal._id] ? (
                                              <ChevronUp className="w-3 h-3" />
                                            ) : (
                                              <ChevronDown className="w-3 h-3" />
                                            )}
                                            Related Tasks ({getGoalTasks(goal._id).length})
                                          </button>
                                        )}
                                        {expandedRelatedTasks[goal._id] && (
                                          <div className="max-h-[300px] overflow-y-auto space-y-2">
                                            {getGoalTasks(goal._id)
                                              .slice(0, 10)
                                              .map(task => (
                                                <div
                                                  key={task.id}
                                                  className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2"
                                                >
                                                  <div className="flex items-start gap-2">
                                                    <button
                                                      onClick={() => {
                                                        updateTaskMutation.mutate({
                                                          id: task.id,
                                                          data: { important: !task.important }
                                                        })
                                                      }}
                                                      className="flex-shrink-0 mt-0.5"
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
                                                        value={
                                                          editingField === `${task.id}-title`
                                                            ? editValue
                                                            : task.title
                                                        }
                                                        onChange={e => {
                                                          setEditValue(e.target.value)
                                                          setEditingField(`${task.id}-title`)
                                                        }}
                                                        onBlur={() => {
                                                          if (editingField === `${task.id}-title`) {
                                                            handleTaskBlur(task.id, 'title')
                                                          }
                                                        }}
                                                        onFocus={() =>
                                                          startEdit(task.id, 'title', task.title)
                                                        }
                                                        onKeyDown={e => {
                                                          if (e.key === 'Enter') {
                                                            saveTaskEdit(task.id, 'title')
                                                          } else if (e.key === 'Escape') {
                                                            setEditingField(null)
                                                          }
                                                        }}
                                                        maxLength={200}
                                                        className={cn(
                                                          'w-full border-0 shadow-none px-0 py-0 h-auto text-sm font-medium focus-visible:ring-0 bg-transparent',
                                                          task.status === 'completed'
                                                            ? 'line-through text-slate-500'
                                                            : 'text-slate-900'
                                                        )}
                                                      />
                                                    </div>
                                                    <Checkbox
                                                      checked={task.status === 'completed'}
                                                      onCheckedChange={checked => {
                                                        updateTaskMutation.mutate({
                                                          id: task.id,
                                                          data: {
                                                            status: checked
                                                              ? 'completed'
                                                              : 'pending'
                                                          }
                                                        })
                                                        if (checked) playSound('task-done')
                                                      }}
                                                      className={cn(
                                                        'flex-shrink-0 mt-0.5',
                                                        task.status === 'completed' &&
                                                          'border-green-500 data-[state=checked]:bg-green-500'
                                                      )}
                                                    />
                                                  </div>

                                                  <Textarea
                                                    value={
                                                      editingField === `${task.id}-description`
                                                        ? editValue
                                                        : task.description || ''
                                                    }
                                                    onChange={e => {
                                                      setEditValue(e.target.value)
                                                      setEditingField(`${task.id}-description`)
                                                    }}
                                                    onBlur={() => {
                                                      if (
                                                        editingField === `${task.id}-description`
                                                      ) {
                                                        handleTaskBlur(task.id, 'description')
                                                      }
                                                    }}
                                                    onFocus={() =>
                                                      startEdit(
                                                        task.id,
                                                        'description',
                                                        task.description
                                                      )
                                                    }
                                                    onKeyDown={e => {
                                                      if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault()
                                                        saveTaskEdit(task.id, 'description')
                                                      } else if (e.key === 'Escape') {
                                                        setEditingField(null)
                                                      }
                                                    }}
                                                    placeholder="Add description..."
                                                    maxLength={5000}
                                                    className="w-full border-0 shadow-none px-0 py-0 min-h-[60px] resize-none text-sm text-slate-600 focus-visible:ring-0 bg-transparent"
                                                  />

                                                  <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1">
                                                      <label className="text-xs text-slate-500 block mb-1">
                                                        Due Date
                                                      </label>
                                                      {editingField === `${task.id}-due_date` ? (
                                                        <div className="space-y-1">
                                                          <Input
                                                            type="date"
                                                            value={editValue}
                                                            onChange={e =>
                                                              setEditValue(e.target.value)
                                                            }
                                                            onBlur={e => {
                                                              if (
                                                                !e.currentTarget.parentElement?.contains(
                                                                  e.relatedTarget
                                                                )
                                                              ) {
                                                                const timeInput =
                                                                  document.querySelector(
                                                                    `input[data-mobile-task-time-for="${task.id}"]`
                                                                  ) as HTMLInputElement | null
                                                                saveTaskEdit(task.id, 'due_date')
                                                                updateTaskMutation.mutate({
                                                                  id: task.id,
                                                                  data: {
                                                                    due_time:
                                                                      timeInput?.value || null
                                                                  }
                                                                })
                                                              }
                                                            }}
                                                            onKeyDown={e => {
                                                              if (e.key === 'Enter') {
                                                                const timeInput =
                                                                  document.querySelector(
                                                                    `input[data-mobile-task-time-for="${task.id}"]`
                                                                  ) as HTMLInputElement | null
                                                                saveTaskEdit(task.id, 'due_date')
                                                                updateTaskMutation.mutate({
                                                                  id: task.id,
                                                                  data: {
                                                                    due_time:
                                                                      timeInput?.value || null
                                                                  }
                                                                })
                                                              } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                              }
                                                            }}
                                                            autoFocus
                                                            className="h-9 text-sm"
                                                          />
                                                          <Input
                                                            type="time"
                                                            defaultValue={task.due_time || ''}
                                                            data-mobile-task-time-for={task.id}
                                                            className="h-9 text-sm"
                                                            placeholder="Time"
                                                            onKeyDown={e => {
                                                              if (e.key === 'Enter') {
                                                                const timeInput =
                                                                  document.querySelector(
                                                                    `input[data-mobile-task-time-for="${task.id}"]`
                                                                  ) as HTMLInputElement | null
                                                                saveTaskEdit(task.id, 'due_date')
                                                                updateTaskMutation.mutate({
                                                                  id: task.id,
                                                                  data: {
                                                                    due_time:
                                                                      timeInput?.value || null
                                                                  }
                                                                })
                                                              } else if (e.key === 'Escape') {
                                                                setEditingField(null)
                                                              }
                                                            }}
                                                          />
                                                        </div>
                                                      ) : (
                                                        <div
                                                          onClick={() =>
                                                            startEdit(
                                                              task.id,
                                                              'due_date',
                                                              task.due_date
                                                            )
                                                          }
                                                          className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                                        >
                                                          {task.due_date ? (
                                                            <>
                                                              <div>
                                                                {formatDateMedium(task.due_date)}
                                                              </div>
                                                              {task.due_time && (
                                                                <div className="text-xs text-slate-500 mt-1">
                                                                  {task.due_time}
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
                                                          <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                          onClick={() => {
                                                            playSound('archived')
                                                            updateTaskMutation.mutate({
                                                              id: task.id,
                                                              data: { status: 'archived' }
                                                            })
                                                          }}
                                                        >
                                                          <Archive className="w-4 h-4 mr-2" />
                                                          Archive
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                          onClick={() => {
                                                            playSound('delete')
                                                            backend.entities.Task.delete(
                                                              task.id
                                                            ).then(() => {
                                                              queryClient.invalidateQueries({
                                                                queryKey: ['tasks']
                                                              })
                                                            })
                                                          }}
                                                          className="text-rose-600"
                                                        >
                                                          <Trash2 className="w-4 mr-2" />
                                                          Delete
                                                        </DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                  </div>
                                                </div>
                                              ))}
                                            {getGoalTasks(goal._id).length > 10 && (
                                              <div className="text-xs text-slate-500 text-center py-1">
                                                Showing 10 of {getGoalTasks(goal._id).length}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        <div className="text-right mt-2">
                                          <Button
                                            onClick={() => {
                                              const data = {
                                                title: 'New Task',
                                                status: 'pending',
                                                category: goal.category,
                                                business_id: goal.business_id || null,
                                                goal_id: goal._id
                                              }
                                              offlineCreate(
                                                'tasks',
                                                backend.entities.Task,
                                                data
                                              ).then(newTask => {
                                                queryClient.setQueryData(['tasks'], (old: any) =>
                                                  old
                                                    ? [
                                                        newTask,
                                                        ...old.filter(t => t.id !== newTask.id)
                                                      ]
                                                    : [newTask]
                                                )
                                                setExpandedRelatedTasks(prev => ({
                                                  ...prev,
                                                  [goal._id]: true
                                                }))
                                              })
                                            }}
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs text-slate-500 hover:text-slate-700"
                                          >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Task
                                          </Button>
                                        </div>
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

                {sortedGoals.length > 0 && (
                  <TablePagination
                    totalItems={sortedGoals.length}
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

      {selectedGoals.length > 0 && bulkMode && (
        <div className="goal-table-bulk-actions fixed bottom-4 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto bg-slate-900 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-full shadow-lg flex items-center justify-between lg:justify-start gap-2 lg:gap-4 z-50">
          <span className="text-xs lg:text-sm font-medium">{selectedGoals.length} selected</span>
          <div className="flex items-center gap-1 lg:gap-2">
            {currentTab === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedGoals, data: { status: 'archived' } })
                }
              >
                <Check className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Achieve</span>
              </Button>
            )}
            {currentTab === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedGoals, data: { status: 'archived' } })
                }
              >
                <Archive className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Archive</span>
              </Button>
            )}
            {(currentTab === 'archived' || currentTab === 'archived') && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedGoals, data: { status: 'active' } })
                }
              >
                <Archive className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Move to Active</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-300 hover:bg-rose-900/30 h-8 px-2 lg:px-3"
              onClick={() => bulkDeleteMutation.mutate(selectedGoals)}
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
