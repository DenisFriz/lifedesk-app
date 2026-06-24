import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import UsageLimitGate from '@/components/subscription/UsageLimitGate'
import { useTaskMutations } from '@/hooks/tasks/useTaskMutations'
import { taskRepository } from '@/repositories/task.repository'
import { goalRepository } from '@/repositories/goal.repository'
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
  Search,
  Lock
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
import { useGoalMutations } from '@/hooks/goals/useGoalMutations'
import { useGoalsQuery } from '@/hooks/goals/useGoalsQuery'
import { useTasksQuery } from '@/hooks/tasks/useTasksQuery'
import { useBusinessesQuery } from '@/hooks/businesses/useBusinessesQuery'
import { useTableState } from '@/hooks/useTableState'
import { GoalRecord } from '@/db'
import { GoalCreateInput } from '@/repositories/goal.repository'

function TasksToggleButton({
  goal,
  goalId,
  compactView,
  expandedGoals,
  getGoalTasks,
  toggleExpandGoal,
  onCreateTask
}: {
  goal: any
  goalId: string
  compactView: boolean
  expandedGoals: Record<string, boolean>
  getGoalTasks: (id: string) => any[]
  toggleExpandGoal: (id: string) => void
  onCreateTask: () => void
}) {
  const taskCount = getGoalTasks(goalId).length
  const isExpanded = expandedGoals[goalId]
  const handleClick = () => {
    if (taskCount > 0) {
      toggleExpandGoal(goalId)
    } else {
      onCreateTask()
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
  filterType?: 'all' | 'important' | 'business' | 'category'
}

export default function GoalTable({ category, businessId, filterType }: GoalTableProps) {
  const queryClient = useQueryClient()

  const { table } = useTableState('goalTableCompactView')

  const [animatingGoal, setAnimatingGoal] = useState(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showReminders, setShowReminders] = useState({})
  const [reminderValues, setReminderValues] = useState({})
  const [selectOpen, setSelectOpen] = useState(false)
  const [selectedGoals, setSelectedGoals] = useState([])
  const [expandedGoals, setExpandedGoals] = useState({})
  const [expandedRelatedTasks, setExpandedRelatedTasks] = useState({})
  const [hoveredTargetDate, setHoveredTargetDate] = useState(null)

  const { playSound } = useSound()

  const { canCreate } = useUserLimit()

  const {
    updateMutation,
    createMutation,
    deleteMutation,
    duplicateMutation,
    bulkDeleteMutation,
    bulkUpdateMutation
  } = useGoalMutations()

  const {
    createMutation: createTaskMutation,
    updateMutation: updateTaskMutation,
    deleteMutation: deleteTaskMutation
  } = useTaskMutations()

  const { data: allGoals = [] } = useGoalsQuery()

  const { data: businesses = [] } = useBusinessesQuery()

  const { data: allTasks = [] } = useTasksQuery()

  const getGoalProgress = (goalId: string) => {
    const goalTasks = allTasks.filter(t => t.goal_id === goalId)
    if (goalTasks.length === 0) return 0
    const completedTasks = goalTasks.filter(t => t.status === 'completed').length
    return Math.round((completedTasks / goalTasks.length) * 100)
  }

  let filteredGoals = allGoals
  if (filterType === 'important') {
    filteredGoals = allGoals.filter(g => g.important)
  } else if (filterType === 'business') {
    filteredGoals = allGoals.filter(
      g => g.business_id != null && String(g.business_id) === String(businessId)
    )
  } else if (filterType === 'category') {
    filteredGoals = allGoals.filter(g => g.category === category)
  }

  const goals = filteredGoals
    .filter(g => g.status === table.currentTab)
    .filter(
      g =>
        !table.searchQuery ||
        (g.title || '').toLowerCase().includes(table.searchQuery.toLowerCase()) ||
        (g.description || '').toLowerCase().includes(table.searchQuery.toLowerCase())
    )

  const getBusinessName = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId)
    return business ? business.name : 'Business'
  }

  const handleUpdateGoal = async ({ id, data }: { id: string; data: Partial<GoalRecord> }) => {
    try {
      setAnimatingGoal(id)
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setAnimatingGoal(null)
    }
  }

  const handleCreateGoal = async (data: GoalCreateInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteMutation.mutateAsync(goalId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDuplicateGoal = async (data: Record<string, any>) => {
    if (!canCreate('goals')) return
    try {
      await duplicateMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleBulkDeleteGoals = async (goaldIds: string[]) => {
    try {
      await bulkDeleteMutation.mutateAsync(goaldIds)
    } catch (e) {
      console.error(e)
    } finally {
      setSelectedGoals([])
    }
  }

  const handleBulkUpdateGoals = async ({
    ids,
    data
  }: {
    ids: string[]
    data: Record<string, any>
  }) => {
    try {
      await bulkUpdateMutation.mutateAsync({ ids, data })
    } catch (e) {
      console.error(e)
    } finally {
      setSelectedGoals([])
    }
  }

  const handleSort = (field: 'important' | 'title' | 'target_date') => {
    if (table.sortBy === field) {
      table.setSortOrder(table.sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      table.setSortBy(field)
      table.setSortOrder('asc')
    }
    table.setPage(1)
  }

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (!table.sortBy) {
        const orderA = a.order ?? 999999
        const orderB = b.order ?? 999999
        return orderA - orderB
      }

      let aVal = a[table.sortBy]
      let bVal = b[table.sortBy]

      if (table.sortBy === 'important') {
        aVal = a.important ? 1 : 0
        bVal = b.important ? 1 : 0
      }

      if (aVal === bVal) return 0
      const comparison = aVal > bVal ? 1 : -1
      return table.sortOrder === 'asc' ? comparison : -comparison
    })
  }, [goals, table.sortBy, table.sortOrder])

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

    // Patch cache directly for instant UI update
    queryClient.setQueryData(['goals', undefined], (oldGoals: any) => {
      if (!oldGoals) return oldGoals
      return oldGoals.map((goal: any) => {
        const goalId = goal.serverId || goal.id
        const itemIndex = newItems.findIndex((item: any) => (item.serverId || item.id) === goalId)
        if (itemIndex !== -1) {
          return { ...goal, order: itemIndex }
        }
        return goal
      })
    })

    // Persist to backend - single invalidation after all writes to avoid per-mutation cache corruption
    newItems.forEach((task: any, index: number) => {
      updateMutation.mutate({ id: getGoalId(task), data: { order: index } })
    })

    /* Promise.all(
      newItems.map((goal: any, index) =>
        goalRepository.update(String(goal.id || ''), { order: index })
      )
    )
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['goals'] })
      })
      .catch(err => {
        console.error(err)
        queryClient.invalidateQueries({ queryKey: ['goals'] })
      }) */
  }

  const paginatedGoals = useMemo(() => {
    const startIndex = (table.page - 1) * table.perPage
    return sortedGoals.slice(startIndex, startIndex + table.perPage)
  }, [sortedGoals, table.page, table.perPage])

  const totalPages = Math.ceil(sortedGoals.length / table.perPage)

  const startEdit = (goalId, field, currentValue, secondValue = null) => {
    if (table.editingField && table.editValue !== undefined) {
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
        if (table.editingField.endsWith(suffix)) {
          prevId = table.editingField.slice(0, table.editingField.length - suffix.length)
          prevField = suffix.slice(1).replace('-time', '')
          break
        }
      }
      if (prevId && prevField) {
        const prevTask = allTasks.find(t => t.id === prevId)
        if (prevTask) {
          updateTaskMutation.mutate({ id: prevId, data: { [prevField]: table.editValue } })
        } else {
          handleUpdateGoal({ id: prevId, data: { [prevField]: table.editValue } })
        }
      }
    }

    if (table.blurTimeoutRef.current) {
      clearTimeout(table.blurTimeoutRef.current)
      table.blurTimeoutRef.current = null
    }
    table.setEditingField(`${goalId}-${field}`)
    table.setEditValue(currentValue || '')
    if (secondValue !== null) {
      table.setEditingField(`${goalId}-${field}-time`)
    }
  }

  const saveEdit = (goalId, field, additionalData = {}) => {
    if (table.blurTimeoutRef.current) {
      clearTimeout(table.blurTimeoutRef.current)
      table.blurTimeoutRef.current = null
    }
    handleUpdateGoal({ id: goalId, data: { [field]: table.editValue, ...additionalData } })
    table.setEditingField(null)
  }

  const handleBlur = (goalId, field, additionalData = {}) => {
    table.blurTimeoutRef.current = setTimeout(() => {
      saveEdit(goalId, field, additionalData)
      table.blurTimeoutRef.current = null
    }, 150)
  }

  const saveTaskEdit = (taskId, field) => {
    if (table.blurTimeoutRef.current) {
      clearTimeout(table.blurTimeoutRef.current)
      table.blurTimeoutRef.current = null
    }
    updateTaskMutation.mutate({ id: taskId, data: { [field]: table.editValue } })
    table.setEditingField(null)
  }

  const handleTaskBlur = (taskId, field) => {
    table.blurTimeoutRef.current = setTimeout(() => {
      saveTaskEdit(taskId, field)
      table.blurTimeoutRef.current = null
    }, 150)
  }

  const handleKeyDown = (e, goalId, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit(goalId, field)
    } else if (e.key === 'Escape') {
      table.setEditingField(null)
    }
  }

  const toggleImportant = (goal: GoalRecord) => {
    handleUpdateGoal({ id: getGoalId(goal), data: { important: !goal.important } })
  }

  const triggerCelebration = (goalId: string) => {
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

  const toggleAchieved = (goal: GoalRecord) => {
    const newStatus = goal.status === 'archived' ? 'active' : 'archived'
    const goalId = getGoalId(goal)

    if (newStatus === 'archived') {
      setAnimatingGoal(goalId)
      playSound('goal-achieved')
      triggerCelebration(goalId)
      setTimeout(() => {
        handleUpdateGoal({ id: goalId, data: { status: newStatus } })
        setAnimatingGoal(null)
      }, 1000)
    } else {
      handleUpdateGoal({ id: goalId, data: { status: newStatus } })
    }
  }

  const archiveGoal = (goal: GoalRecord) => {
    playSound('archived')
    handleUpdateGoal({ id: getGoalId(goal), data: { status: 'archived' } })
  }

  const unarchiveGoal = (goal: GoalRecord) => {
    handleUpdateGoal({ id: getGoalId(goal), data: { status: 'active' } })
  }

  const handleAddNew = () => {
    if (filterType === 'all') {
      setShowCategoryDialog(true)
    } else {
      const minOrder = goals.length > 0 ? Math.min(...goals.map(g => g.order ?? 999999)) : 0
      const data: GoalCreateInput = {
        title: 'New Goal',
        category: null,
        status: 'active',
        order: minOrder === 999999 ? 0 : minOrder - 1,
        important: false,
        target_date: null,
        target_time: null,
        business_id: null
      }

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
      handleCreateGoal(data)
    }
  }

  const handleCategorySelect = (selectedCategory, selectedBusinessId = null) => {
    const minOrder = allGoals.length > 0 ? Math.min(...allGoals.map(g => g.order ?? 999999)) : 0
    const data: GoalCreateInput = {
      title: 'New Goal',
      category: selectedCategory,
      status: 'active',
      order: minOrder === 999999 ? 0 : minOrder - 1,
      important: false,
      target_date: null,
      target_time: null,
      business_id: null
    }

    if (selectedBusinessId) {
      data.business_id = selectedBusinessId
    }

    handleCreateGoal(data)
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
    table.setBulkMode(!table.bulkMode)
    if (table.bulkMode) {
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

  const updateTaskOrderMutation = useMutation<any, any, { id: string; order: number }[]>({
    mutationFn: async updatedTasks => {
      return Promise.all(
        updatedTasks.map((task: any) => taskRepository.update(task.id, { order: task.order }))
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

  const getGoalId = (goal: GoalRecord): string => String(goal.serverId || goal.id || '')

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
        <Tabs value={table.currentTab} onValueChange={table.setCurrentTab}>
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
                  value={table.searchQuery}
                  onChange={e => {
                    table.setSearchQuery(e.target.value)
                    table.setPage(1)
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
                      className={cn('h-9 w-9 flex-shrink-0', table.bulkMode && 'bg-slate-200')}
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
                        const newValue = !table.compactView
                        table.setCompactView(newValue)
                        localStorage.setItem('goalTableCompactView', JSON.stringify(newValue))
                      }}
                      className={cn('h-9 w-9 flex-shrink-0', table.compactView && 'bg-slate-200')}
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

          <TabsContent value={table.currentTab} className="m-0" ref={table.tableRef}>
            {goals.length === 0 ? (
              <div className="p-12 text-center">
                {!canCreate('goals') ? (
                  <>
                    <p className="text-slate-500 mb-4">You've reached your goals limit</p>
                    <Link to="/upgrade">
                      <Button variant="outline">
                        <Lock className="w-4 h-4 mr-2" />
                        Upgrade to add more
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-slate-500 mb-4">No {table.currentTab} goals</p>
                    {table.currentTab === 'active' && (
                      <Button onClick={handleAddNew} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Goal
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="goal-table-desktop hidden [@media(min-width:1130px)]:block overflow-x-auto">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <table className="goal-table w-full min-w-[1000px]">
                      <thead className="goal-table-thead bg-slate-50 border-b border-slate-200">
                        <tr className="goal-table-header-row">
                          {!table.sortBy && (
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
                          {table.bulkMode && (
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
                              const goalId = getGoalId(goal)

                              const goalOverLimit = !canCreate('goals')
                              return (
                                <Draggable
                                  key={goalId}
                                  draggableId={`goal-${goalId}`}
                                  index={index}
                                  isDragDisabled={!!table.sortBy || goalOverLimit}
                                >
                                  {(provided, snapshot) => (
                                    <React.Fragment>
                                      <tr
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={cn(
                                          'goal-table-row border-b border-slate-100 hover:bg-slate-50',
                                          animatingGoal === goalId &&
                                            'animate-[wiggle_0.3s_ease-in-out]',
                                          table.compactView && 'h-12',
                                          snapshot.isDragging && 'opacity-50'
                                        )}
                                      >
                                        {!table.sortBy && (
                                          <td
                                            className={cn(
                                              'goal-table-td-drag pl-3 pr-2 w-10 align-middle cursor-grab active:cursor-grabbing',
                                              table.compactView ? 'py-1' : 'py-3'
                                            )}
                                            {...provided.dragHandleProps}
                                          >
                                            <GripVertical className="w-4 h-4 text-slate-400" />
                                          </td>
                                        )}
                                        <td
                                          className={cn(
                                            'goal-table-td-star pl-3 pr-2 w-8 align-middle',
                                            table.compactView ? 'py-1' : 'py-3'
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
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <Checkbox
                                            data-goal-id={goalId}
                                            checked={
                                              goal.status === 'archived' || animatingGoal === goalId
                                            }
                                            onCheckedChange={() => toggleAchieved(goal)}
                                            className={cn(
                                              (goal.status === 'archived' ||
                                                animatingGoal === goalId) &&
                                                'border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500'
                                            )}
                                          />
                                        </td>
                                        {table.bulkMode && (
                                          <td
                                            className={cn(
                                              'goal-table-td-bulk px-4 text-center w-12 align-middle',
                                              table.compactView ? 'py-1' : 'py-3'
                                            )}
                                          >
                                            <Checkbox
                                              checked={selectedGoals.includes(goalId)}
                                              onCheckedChange={() => toggleSelectGoal(goalId)}
                                            />
                                          </td>
                                        )}
                                        <td
                                          className={cn(
                                            'goal-table-td-title px-4 align-middle w-64',
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <Input
                                            id={`goal-title-${goalId}`}
                                            value={
                                              table.editingField === `${goalId}-title`
                                                ? table.editValue
                                                : goal.title
                                            }
                                            onChange={e => {
                                              table.setEditValue(e.target.value)
                                              table.setEditingField(`${goalId}-title`)
                                            }}
                                            onBlur={() => {
                                              if (table.editingField === `${goalId}-title`) {
                                                handleBlur(goalId, 'title')
                                              }
                                            }}
                                            onFocus={() => startEdit(goalId, 'title', goal.title)}
                                            onKeyDown={e => handleKeyDown(e, goalId, 'title')}
                                            maxLength={200}
                                            className={cn(
                                              'border-0 shadow-none px-2 py-1 h-auto font-medium text-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                                              table.compactView ? 'line-clamp-1' : ''
                                            )}
                                          />
                                        </td>
                                        <td
                                          className={cn(
                                            'goal-table-td-description px-4 align-middle',
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <Textarea
                                            id={`goal-description-${goalId}`}
                                            value={
                                              table.editingField === `${goalId}-description`
                                                ? table.editValue
                                                : goal.description || ''
                                            }
                                            onChange={e => {
                                              table.setEditValue(e.target.value)
                                              table.setEditingField(`${goalId}-description`)
                                            }}
                                            onBlur={() => {
                                              if (table.editingField === `${goalId}-description`) {
                                                handleBlur(goalId, 'description')
                                              }
                                            }}
                                            onFocus={() =>
                                              startEdit(goalId, 'description', goal.description)
                                            }
                                            onKeyDown={e => handleKeyDown(e, goalId, 'description')}
                                            placeholder="Add description..."
                                            maxLength={5000}
                                            className={cn(
                                              'w-full resize-none border-0 shadow-none px-2 py-1 text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                                              table.compactView
                                                ? 'h-8 min-h-0 line-clamp-1 overflow-hidden'
                                                : 'min-h-[60px]'
                                            )}
                                          />
                                        </td>
                                        {(filterType === 'all' || filterType === 'important') && (
                                          <td
                                            className={cn(
                                              'goal-table-td-category px-4 w-32 max-w-32 align-middle',
                                              table.compactView ? 'py-1' : 'py-3'
                                            )}
                                          >
                                            {table.editingField === `${goalId}-category` ? (
                                              <Select
                                                value={table.editValue}
                                                onValueChange={value => {
                                                  table.setEditValue(value)
                                                  const updateData = { category: value } as Record<
                                                    string,
                                                    any
                                                  >
                                                  if (value !== 'business') {
                                                    updateData.business_id = null
                                                  }
                                                  handleUpdateGoal({
                                                    id: goalId,
                                                    data: updateData
                                                  })
                                                  table.setEditingField(null)
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
                                                  startEdit(goalId, 'category', currentValue)
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
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          <div className="goal-progress-wrapper">
                                            <div className="flex items-center gap-2">
                                              <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                <div
                                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                  style={{ width: `${getGoalProgress(goalId)}%` }}
                                                />
                                              </div>
                                              <span className="text-xs text-slate-600 font-medium w-10 text-right">
                                                {getGoalProgress(goalId)}%
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                        <td
                                          className={cn(
                                            'goal-table-td-targetdate px-4 w-40 align-middle',
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          {table.editingField === `${goalId}-target_date` ? (
                                            <div
                                              className="goal-targetdate-wrapper space-y-1"
                                              onBlur={e => {
                                                if (selectOpen) return
                                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                                  const timeInput = document.querySelector(
                                                    `input[data-time-for="${goalId}"]`
                                                  ) as HTMLInputElement | null
                                                  const reminders = reminderValues[goalId] || []
                                                  saveEdit(goalId, 'target_date', {
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
                                                value={table.editValue}
                                                onChange={e => table.setEditValue(e.target.value)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    const timeInput = document.querySelector(
                                                      `input[data-time-for="${goalId}"]`
                                                    ) as HTMLInputElement | null
                                                    const reminders = reminderValues[goalId] || []
                                                    saveEdit(goalId, 'target_date', {
                                                      target_time: timeInput?.value || null,
                                                      reminders
                                                    })
                                                    setShowReminders({})
                                                    setReminderValues({})
                                                  } else if (e.key === 'Escape') {
                                                    table.setEditingField(null)
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
                                                  data-time-for={goalId}
                                                  className="h-8 text-xs flex-1"
                                                  placeholder="Time"
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                      const timeInput = document.querySelector(
                                                        `input[data-time-for="${goalId}"]`
                                                      ) as HTMLInputElement | null
                                                      const reminders = reminderValues[goalId] || []
                                                      saveEdit(goalId, 'target_date', {
                                                        target_time: timeInput?.value || null,
                                                        reminders
                                                      })
                                                      setShowReminders({})
                                                      setReminderValues({})
                                                    } else if (e.key === 'Escape') {
                                                      table.setEditingField(null)
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
                                                      [goalId]: !prev[goalId]
                                                    }))
                                                    if (!reminderValues[goalId]) {
                                                      setReminderValues(prev => ({
                                                        ...prev,
                                                        [goalId]: goal.reminders || []
                                                      }))
                                                    }
                                                  }}
                                                >
                                                  <Bell className="w-4 h-4" />
                                                </Button>
                                              </div>
                                              {showReminders[goalId] && (
                                                <div className="space-y-1 mt-2">
                                                  <div className="text-xs text-slate-600 font-medium">
                                                    Reminders:
                                                  </div>
                                                  {(reminderValues[goalId] || []).map(
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
                                                                ...(reminderValues[goalId] || [])
                                                              ]
                                                              newReminders[idx] = newMinutes
                                                              setReminderValues(prev => ({
                                                                ...prev,
                                                                [goalId]: newReminders
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
                                                                ...(reminderValues[goalId] || [])
                                                              ]
                                                              newReminders[idx] = newMinutes
                                                              setReminderValues(prev => ({
                                                                ...prev,
                                                                [goalId]: newReminders
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
                                                          ...(reminderValues[goalId] || []),
                                                          30
                                                        ]
                                                        setReminderValues(prev => ({
                                                          ...prev,
                                                          [goalId]: newReminders
                                                        }))
                                                      }}
                                                      className="flex-1 text-xs"
                                                    >
                                                      Add reminder
                                                    </Button>
                                                    {(reminderValues[goalId] || []).length > 0 && (
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={e => {
                                                          e.stopPropagation()
                                                          const newReminders = reminderValues[
                                                            goalId
                                                          ].slice(0, -1)
                                                          setReminderValues(prev => ({
                                                            ...prev,
                                                            [goalId]: newReminders
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
                                                startEdit(goalId, 'target_date', goal.target_date)
                                                setReminderValues(prev => ({
                                                  ...prev,
                                                  [goalId]: goal.reminders || []
                                                }))
                                              }}
                                              onMouseEnter={() => setHoveredTargetDate(goalId)}
                                              onMouseLeave={() => setHoveredTargetDate(null)}
                                              className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                            >
                                              {goal.target_date ? (
                                                <>
                                                  <div>{formatDateMedium(goal.target_date)}</div>
                                                  {!table.compactView && goal.target_time && (
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                      {goal.target_time}
                                                    </div>
                                                  )}
                                                  {!table.compactView &&
                                                    goal.reminders &&
                                                    goal.reminders.length > 0 && (
                                                      <div className="text-xs text-slate-500 mt-0.5">
                                                        🔔 {goal.reminders.length}
                                                      </div>
                                                    )}
                                                  {table.compactView &&
                                                    hoveredTargetDate === goalId &&
                                                    goal.target_time && (
                                                      <div className="text-xs text-slate-500 mt-0.5">
                                                        {goal.target_time}
                                                      </div>
                                                    )}
                                                  {table.compactView &&
                                                    hoveredTargetDate === goalId &&
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
                                            table.compactView ? 'py-1' : 'py-3'
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
                                                    onClick={() => handleDuplicateGoal(goal)}
                                                  >
                                                    <Copy className="h-4 w-4 text-slate-600" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Duplicate</TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                            {table.currentTab === 'active' && (
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
                                            {table.currentTab === 'archived' && (
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
                                            {table.currentTab === 'archived' && (
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
                                                    onClick={() =>
                                                      handleDeleteGoal(goal.id || goalId)
                                                    }
                                                  >
                                                    <Trash2 className="h-4 w-4 text-rose-600" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete</TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                            <TasksToggleButton
                                              goal={goal}
                                              goalId={goalId}
                                              compactView={table.compactView}
                                              expandedGoals={expandedGoals}
                                              getGoalTasks={getGoalTasks}
                                              toggleExpandGoal={toggleExpandGoal}
                                              onCreateTask={() => {
                                                createTaskMutation.mutate({
                                                  title: 'New Task',
                                                  status: 'pending',
                                                  category: goal.category,
                                                  business_id: goal.business_id || null,
                                                  goal_id: goalId
                                                })
                                                toggleExpandGoal(goalId)
                                              }}
                                            />
                                          </div>
                                        </td>
                                      </tr>
                                      {expandedGoals[goalId] && (
                                        <>
                                          <tr className="bg-white">
                                            <td
                                              colSpan={
                                                !table.sortBy
                                                  ? table.bulkMode
                                                    ? filterType === 'all' ||
                                                      filterType === 'important'
                                                      ? 10
                                                      : 9
                                                    : filterType === 'all' ||
                                                        filterType === 'important'
                                                      ? 9
                                                      : 8
                                                  : table.bulkMode
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
                                                  droppableId={`tasks-${goalId}`}
                                                  type="task"
                                                >
                                                  {provided => (
                                                    <tbody
                                                      {...provided.droppableProps}
                                                      ref={provided.innerRef}
                                                    >
                                                      {getGoalTasks(goalId)
                                                        .slice(0, 10)
                                                        .map((task, taskIndex) => (
                                                          <GoalTaskRow
                                                            key={task.id}
                                                            task={task}
                                                            taskIndex={taskIndex}
                                                            goalId={goalId}
                                                            sortBy={table.sortBy}
                                                            bulkMode={table.bulkMode}
                                                            filterType={filterType}
                                                            editingField={table.editingField}
                                                            editValue={table.editValue}
                                                            selectOpen={selectOpen}
                                                            showReminders={showReminders}
                                                            reminderValues={reminderValues}
                                                            setEditValue={table.setEditValue}
                                                            setEditingField={table.setEditingField}
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
                                                            deleteTaskMutation={deleteTaskMutation}
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
                                          {getGoalTasks(goalId).length > 10 && (
                                            <tr className="bg-slate-50">
                                              <td
                                                colSpan={
                                                  !table.sortBy
                                                    ? table.bulkMode
                                                      ? filterType === 'all' ||
                                                        filterType === 'important'
                                                        ? 10
                                                        : 9
                                                      : filterType === 'all' ||
                                                          filterType === 'important'
                                                        ? 9
                                                        : 8
                                                    : table.bulkMode
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
                                                Showing 10 of {getGoalTasks(goalId).length} tasks
                                              </td>
                                            </tr>
                                          )}
                                          <tr className="bg-slate-50">
                                            <td
                                              colSpan={
                                                !table.sortBy
                                                  ? table.bulkMode
                                                    ? filterType === 'all' ||
                                                      filterType === 'important'
                                                      ? 10
                                                      : 9
                                                    : filterType === 'all' ||
                                                        filterType === 'important'
                                                      ? 9
                                                      : 8
                                                  : table.bulkMode
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
                                                  createTaskMutation.mutate({
                                                    title: 'New Task',
                                                    status: 'pending',
                                                    category: goal.category,
                                                    business_id: goal.business_id || null,
                                                    goal_id: goalId
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
                          {paginatedGoals.map((goal, index) => {
                            const goalId = getGoalId(goal)

                            return (
                              <Draggable
                                key={goalId}
                                draggableId={goalId}
                                index={index}
                                isDragDisabled={!!table.sortBy || !canCreate('goals')}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      'goal-card p-4 space-y-3 border-b-[10px]',
                                      index === 0 && 'border-t-[10px]',
                                      animatingGoal === goalId &&
                                        'animate-[wiggle_0.3s_ease-in-out]',
                                      snapshot.isDragging && 'opacity-50'
                                    )}
                                    style={{
                                      borderBottomColor: '#f5f7fb',
                                      borderTopColor: '#f5f7fb',
                                      ...provided.draggableProps.style
                                    }}
                                  >
                                    <div className="goal-card-header flex items-start gap-3">
                                      {!table.sortBy && (
                                        <div
                                          {...provided.dragHandleProps}
                                          className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing"
                                        >
                                          <GripVertical className="w-5 h-5 text-slate-400" />
                                        </div>
                                      )}
                                      {table.bulkMode && (
                                        <Checkbox
                                          checked={selectedGoals.includes(goalId)}
                                          onCheckedChange={() => toggleSelectGoal(goalId)}
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
                                            table.editingField === `${goalId}-title`
                                              ? table.editValue
                                              : goal.title
                                          }
                                          onChange={e => {
                                            table.setEditValue(e.target.value)
                                            table.setEditingField(`${goalId}-title`)
                                          }}
                                          onBlur={() => {
                                            if (table.editingField === `${goalId}-title`) {
                                              handleBlur(goalId, 'title')
                                            }
                                          }}
                                          onFocus={() => startEdit(goalId, 'title', goal.title)}
                                          maxLength={200}
                                          className="w-full border-0 shadow-none px-0 py-0 h-auto font-medium text-slate-900 focus-visible:ring-0 bg-transparent"
                                        />
                                      </div>
                                      <Checkbox
                                        data-goal-id={goalId}
                                        checked={
                                          goal.status === 'archived' || animatingGoal === goalId
                                        }
                                        onCheckedChange={() => toggleAchieved(goal)}
                                        className={cn(
                                          'flex-shrink-0 mt-1',
                                          (goal.status === 'archived' ||
                                            animatingGoal === goalId) &&
                                            'border-amber-500 data-[state=checked]:bg-amber-500'
                                        )}
                                      />
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpandGoal(goalId)}
                                        className="flex-1 justify-start gap-2 text-slate-600"
                                      >
                                        {expandedGoals[goalId] ? (
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
                                      {getGoalTasks(goalId).length > 0 ? (
                                        <span className="text-xs text-indigo-600 font-medium">
                                          {getGoalTasks(goalId).length}{' '}
                                          {getGoalTasks(goalId).length === 1 ? 'task' : 'tasks'}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-transparent">0 tasks</span>
                                      )}
                                    </div>

                                    {expandedGoals[goalId] && (
                                      <>
                                        <Textarea
                                          value={
                                            table.editingField === `${goalId}-description`
                                              ? table.editValue
                                              : goal.description || ''
                                          }
                                          onChange={e => {
                                            table.setEditValue(e.target.value)
                                            table.setEditingField(`${goalId}-description`)
                                          }}
                                          onBlur={() => {
                                            if (table.editingField === `${goalId}-description`) {
                                              handleBlur(goalId, 'description')
                                            }
                                          }}
                                          onFocus={() =>
                                            startEdit(goalId, 'description', goal.description)
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
                                                  handleUpdateGoal({
                                                    id: goalId,
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
                                                  <SelectItem value="health_body">
                                                    Health
                                                  </SelectItem>
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
                                                  style={{ width: `${getGoalProgress(goalId)}%` }}
                                                />
                                              </div>
                                              <span className="text-xs text-slate-600 font-medium">
                                                {getGoalProgress(goalId)}%
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="goal-card-footer flex items-center justify-between gap-3">
                                          <div className="flex-1">
                                            <label className="text-xs text-slate-500 block mb-1">
                                              Target Date
                                            </label>
                                            {table.editingField === `${goalId}-target_date` ? (
                                              <div className="space-y-1">
                                                <Input
                                                  type="date"
                                                  value={table.editValue}
                                                  onChange={e => table.setEditValue(e.target.value)}
                                                  onBlur={e => {
                                                    if (
                                                      !e.currentTarget.parentElement?.contains(
                                                        e.relatedTarget
                                                      )
                                                    ) {
                                                      const timeInput = document.querySelector(
                                                        `input[data-mobile-time-for="${goalId}"]`
                                                      ) as HTMLInputElement | null
                                                      handleBlur(goalId, 'target_date', {
                                                        target_time: timeInput?.value || null
                                                      })
                                                    }
                                                  }}
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                      const timeInput = document.querySelector(
                                                        `input[data-mobile-time-for="${goalId}"]`
                                                      ) as HTMLInputElement | null
                                                      saveEdit(goalId, 'target_date', {
                                                        target_time: timeInput?.value || null
                                                      })
                                                    } else if (e.key === 'Escape') {
                                                      table.setEditingField(null)
                                                    }
                                                  }}
                                                  className="h-9 text-sm"
                                                />
                                                <Input
                                                  type="time"
                                                  defaultValue={goal.target_time || ''}
                                                  data-mobile-time-for={goalId}
                                                  className="h-9 text-sm"
                                                  placeholder="Time"
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                      const timeInput = document.querySelector(
                                                        `input[data-mobile-time-for="${goalId}"]`
                                                      ) as HTMLInputElement | null
                                                      saveEdit(goalId, 'target_date', {
                                                        target_time: timeInput?.value || null
                                                      })
                                                    } else if (e.key === 'Escape') {
                                                      table.setEditingField(null)
                                                    }
                                                  }}
                                                />
                                              </div>
                                            ) : (
                                              <div
                                                onClick={() =>
                                                  startEdit(goalId, 'target_date', goal.target_date)
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
                                              {table.currentTab === 'active' && (
                                                <DropdownMenuItem onClick={() => archiveGoal(goal)}>
                                                  <Archive className="h-4 w-4 mr-2" />
                                                  Archive
                                                </DropdownMenuItem>
                                              )}
                                              {table.currentTab === 'archived' && (
                                                <DropdownMenuItem
                                                  onClick={() => unarchiveGoal(goal)}
                                                >
                                                  <Archive className="h-4 w-4 mr-2" />
                                                  Unarchive
                                                </DropdownMenuItem>
                                              )}
                                              {table.currentTab === 'archived' && (
                                                <DropdownMenuItem
                                                  onClick={() => unarchiveGoal(goal)}
                                                >
                                                  <Archive className="h-4 w-4 mr-2" />
                                                  Move to Active
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuItem
                                                onClick={() => handleDuplicateGoal(goal)}
                                              >
                                                <Copy className="h-4 w-4 mr-2" />
                                                Duplicate
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => handleDeleteGoal(goalId)}
                                                className="text-rose-600"
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>

                                        <div>
                                          {getGoalTasks(goalId).length > 0 && (
                                            <button
                                              onClick={() =>
                                                setExpandedRelatedTasks(prev => ({
                                                  ...prev,
                                                  [goalId]: !prev[goalId]
                                                }))
                                              }
                                              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 mb-2"
                                            >
                                              {expandedRelatedTasks[goalId] ? (
                                                <ChevronUp className="w-3 h-3" />
                                              ) : (
                                                <ChevronDown className="w-3 h-3" />
                                              )}
                                              Related Tasks ({getGoalTasks(goalId).length})
                                            </button>
                                          )}
                                          {expandedRelatedTasks[goalId] && (
                                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                              {getGoalTasks(goalId)
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
                                                            table.editingField ===
                                                            `${task.id}-title`
                                                              ? table.editValue
                                                              : task.title
                                                          }
                                                          onChange={e => {
                                                            table.setEditValue(e.target.value)
                                                            table.setEditingField(
                                                              `${task.id}-title`
                                                            )
                                                          }}
                                                          onBlur={() => {
                                                            if (
                                                              table.editingField ===
                                                              `${task.id}-title`
                                                            ) {
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
                                                              table.setEditingField(null)
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
                                                        table.editingField ===
                                                        `${task.id}-description`
                                                          ? table.editValue
                                                          : task.description || ''
                                                      }
                                                      onChange={e => {
                                                        table.setEditValue(e.target.value)
                                                        table.setEditingField(
                                                          `${task.id}-description`
                                                        )
                                                      }}
                                                      onBlur={() => {
                                                        if (
                                                          table.editingField ===
                                                          `${task.id}-description`
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
                                                          table.setEditingField(null)
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
                                                        {table.editingField ===
                                                        `${task.id}-due_date` ? (
                                                          <div className="space-y-1">
                                                            <Input
                                                              type="date"
                                                              value={table.editValue}
                                                              onChange={e =>
                                                                table.setEditValue(e.target.value)
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
                                                                  table.setEditingField(null)
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
                                                                  table.setEditingField(null)
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
                                                              deleteTaskMutation.mutate(task.id)
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
                                              {getGoalTasks(goalId).length > 10 && (
                                                <div className="text-xs text-slate-500 text-center py-1">
                                                  Showing 10 of {getGoalTasks(goalId).length}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          <div className="text-right mt-2">
                                            <Button
                                              onClick={() => {
                                                createTaskMutation.mutate({
                                                  title: 'New Task',
                                                  status: 'pending',
                                                  category: goal.category,
                                                  business_id: goal.business_id || null,
                                                  goal_id: goalId
                                                })
                                                setExpandedRelatedTasks(prev => ({
                                                  ...prev,
                                                  [goalId]: true
                                                }))
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
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>

                {sortedGoals.length > 0 && (
                  <TablePagination
                    totalItems={sortedGoals.length}
                    page={table.page}
                    perPage={table.perPage}
                    totalPages={totalPages}
                    onPageChange={table.setPage}
                    onPerPageChange={value => {
                      table.setPerPage(value)
                      table.setPage(1)
                    }}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedGoals.length > 0 && table.bulkMode && (
        <div className="goal-table-bulk-actions fixed bottom-4 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto bg-slate-900 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-full shadow-lg flex items-center justify-between lg:justify-start gap-2 lg:gap-4 z-50">
          <span className="text-xs lg:text-sm font-medium">{selectedGoals.length} selected</span>
          <div className="flex items-center gap-1 lg:gap-2">
            {table.currentTab === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  handleBulkUpdateGoals({ ids: selectedGoals, data: { status: 'archived' } })
                }
              >
                <Archive className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Archive</span>
              </Button>
            )}
            {(table.currentTab === 'archived' || table.currentTab === 'archived') && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  handleBulkUpdateGoals({ ids: selectedGoals, data: { status: 'active' } })
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
              onClick={() => handleBulkDeleteGoals(selectedGoals)}
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
