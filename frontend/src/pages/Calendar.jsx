import React, { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { offlineFirst } from '@/hooks/useOfflineFirst'
import { useLayout } from '@/Layout'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/useSubscription'
import UpgradeGate from '@/components/subscription/UpgradeGate'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Target,
  Filter,
  Star,
  Calendar as CalendarIcon,
  Clock,
  Copy,
  Trash2,
  Bell,
  BellOff,
  Dumbbell
} from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay
} from 'date-fns'
import TaskEditDialog from '../components/calendar/TaskEditDialog'
import GoalEditDialog from '../components/calendar/GoalEditDialog'
import EventEditDialog from '../components/calendar/EventEditDialog'
import CreateEntryDialog from '../components/calendar/CreateEntryDialog'
import { toast } from 'sonner'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isScrolled, setIsScrolled] = React.useState(false)
  const headerRef = React.useRef(null)
  const { isHidden } = useLayout()

  React.useEffect(() => {
    if (!headerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    )
    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  const [viewType, setViewType] = useState(() => {
    const saved = localStorage.getItem('calendarViewType')
    return saved || 'month'
  })
  const [showTasks, setShowTasks] = useState(() => {
    const saved = localStorage.getItem('calendarShowTasks')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [showGoals, setShowGoals] = useState(() => {
    const saved = localStorage.getItem('calendarShowGoals')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [showEvents, setShowEvents] = useState(() => {
    const saved = localStorage.getItem('calendarShowEvents')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(() => {
    const saved = localStorage.getItem('calendarShowGoogle')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [showWorkoutPlans, setShowWorkoutPlans] = useState(() => {
    const saved = localStorage.getItem('calendarShowWorkoutPlans')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [showImportant, setShowImportant] = useState(() => {
    const saved = localStorage.getItem('calendarShowImportant')
    return saved !== null ? JSON.parse(saved) : false
  })
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [editingTask, setEditingTask] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [creatingDate, setCreatingDate] = useState(null)
  const [creatingTime, setCreatingTime] = useState(null)
  const [draggedItem, setDraggedItem] = useState(null)
  const [duplicateTask, setDuplicateTask] = useState(null)
  const [duplicateGoal, setDuplicateGoal] = useState(null)
  const [duplicateEvent, setDuplicateEvent] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = localStorage.getItem('calendarSelectedCategories')
    return saved
      ? JSON.parse(saved)
      : ['health_body', 'health_mind', 'fitness', 'assets', 'hobbies', 'learning', 'relationships']
  })
  const [selectedBusinessIds, setSelectedBusinessIds] = useState(() => {
    const saved = localStorage.getItem('calendarSelectedBusinessIds')
    return saved ? JSON.parse(saved) : []
  })
  const [expandedDays, setExpandedDays] = useState(new Set())
  const [expandedWeekHours, setExpandedWeekHours] = useState(new Set())
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (!('Notification' in window)) return false
    const isGranted = Notification.permission === 'granted'
    const storedValue = localStorage.getItem('browserNotificationsEnabled')

    // Sync localStorage with actual browser permission
    if (isGranted && storedValue !== 'true') {
      localStorage.setItem('browserNotificationsEnabled', 'true')
    }

    return isGranted && storedValue !== 'false'
  })
  const weekViewRef = React.useRef(null)

  /*   const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => backend.auth.me()
  }) */
  const { can } = useSubscription()

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => offlineFirst('tasks', () => backend.entities.Task.list('-due_date'))
  })

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => offlineFirst('goals', () => backend.entities.Goal.list('-target_date'))
  })

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => offlineFirst('events', () => backend.entities.Event.list('-start_date'))
  })

  const { data: workoutPlans = [] } = useQuery({
    queryKey: ['workoutPlans'],
    queryFn: () => backend.entities.WorkoutPlan.list('-created_date')
  })

  const queryClient = useQueryClient()

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => backend.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => backend.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => backend.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  const deleteTaskMutation = useMutation({
    mutationFn: id => backend.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    }
  })

  const deleteGoalMutation = useMutation({
    mutationFn: id => backend.entities.Goal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Goal deleted')
    }
  })

  const deleteEventMutation = useMutation({
    mutationFn: id => backend.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event deleted')
    }
  })

  const handleDuplicate = (item, itemType) => {
    /* const { id, created_date, updated_date, ...itemData } = item */

    if (itemType === 'task') {
      setDuplicateTask(itemData)
    } else if (itemType === 'goal') {
      setDuplicateGoal(itemData)
    } else if (itemType === 'event') {
      setDuplicateEvent(itemData)
    }

    if (itemType === 'task' && item.due_date) {
      setCreatingDate(new Date(item.due_date))
    } else if (itemType === 'goal' && item.target_date) {
      setCreatingDate(new Date(item.target_date))
    } else if (itemType === 'event' && item.start_date) {
      setCreatingDate(new Date(item.start_date))
    }
  }

  const handleDelete = (item, itemType) => {
    if (item.is_recurring) {
      setDeletingItem({ item, itemType })
      setDeleteDialogOpen(true)
    } else {
      if (itemType === 'task') {
        deleteTaskMutation.mutate(item.id)
      } else if (itemType === 'goal') {
        deleteGoalMutation.mutate(item.id)
      } else if (itemType === 'event') {
        deleteEventMutation.mutate(item.id)
      }
    }
  }

  const handleDeleteRecurring = deleteType => {
    if (!deletingItem) return

    const { item, itemType } = deletingItem

    if (deleteType === 'all') {
      if (itemType === 'task') {
        deleteTaskMutation.mutate(item.id)
      } else if (itemType === 'goal') {
        deleteGoalMutation.mutate(item.id)
      } else if (itemType === 'event') {
        deleteEventMutation.mutate(item.id)
      }
    } else if (deleteType === 'single') {
      const dateToExclude =
        itemType === 'task'
          ? item.due_date
          : itemType === 'goal'
            ? item.target_date
            : item.start_date

      const excludedDates = Array.isArray(item.excluded_dates) ? [...item.excluded_dates] : []

      if (!excludedDates.includes(dateToExclude)) {
        excludedDates.push(dateToExclude)

        if (itemType === 'task') {
          backend.entities.Task.update(item.id, { excluded_dates: excludedDates }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
          })
        } else if (itemType === 'goal') {
          backend.entities.Goal.update(item.id, { excluded_dates: excludedDates }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['goals'] })
          })
        } else if (itemType === 'event') {
          backend.entities.Event.update(item.id, { excluded_dates: excludedDates }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
          })
        }
      }
    }

    setDeleteDialogOpen(false)
    setDeletingItem(null)
  }

  const handleDrop = (targetDate, targetTime = null) => {
    if (!draggedItem) return

    const { type, item } = draggedItem
    const formatDate = d => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (type === 'task') {
      updateTaskMutation.mutate({
        id: item.id,
        data: {
          ...item,
          due_date: formatDate(targetDate),
          due_time: targetTime || item.due_time
        }
      })
    } else if (type === 'goal') {
      updateGoalMutation.mutate({
        id: item.id,
        data: {
          ...item,
          target_date: formatDate(targetDate),
          target_time: targetTime || item.target_time
        }
      })
    } else if (type === 'event') {
      const currentStartDate = new Date(item.start_date)
      const daysDiff = Math.floor((targetDate - currentStartDate) / (1000 * 60 * 60 * 24))

      let newEndDate = item.end_date
      if (item.end_date) {
        const endDate = new Date(item.end_date)
        endDate.setDate(endDate.getDate() + daysDiff)
        newEndDate = formatDate(endDate)
      }

      updateEventMutation.mutate({
        id: item.id,
        data: {
          ...item,
          start_date: formatDate(targetDate),
          start_time: targetTime || item.start_time,
          end_date: newEndDate
        }
      })
    }

    setDraggedItem(null)
  }

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order')
  })

  const generateRecurringInstances = (item, itemType) => {
    if (!item.is_recurring) return [item]

    const instances = []
    const startDate = new Date(
      itemType === 'event'
        ? item.start_date
        : itemType === 'task'
          ? item.due_date
          : item.target_date
    )
    const today = new Date()
    const viewStart = startOfMonth(subMonths(currentDate, 1))
    const viewEnd = endOfMonth(addMonths(currentDate, 1))
    const excludedDates = item.excluded_dates || []

    const formatDate = d => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const getMonthlyInstanceDate = (year, month, monthlyType, startDate) => {
      if (monthlyType === 'day_of_month') {
        return new Date(year, month, startDate.getDate())
      } else if (monthlyType === 'first_weekday') {
        const d = new Date(year, month, 1)
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
        return d
      } else if (monthlyType === 'last_weekday') {
        const d = new Date(year, month + 1, 0)
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1)
        return d
      }
      return new Date(year, month, startDate.getDate())
    }

    let instanceCount = 0
    const maxInstances = item.recurrence_end_count || 365

    if (item.recurrence_frequency === 'monthly') {
      const monthlyType = item.recurrence_monthly_type || 'day_of_month'
      const interval = item.recurrence_interval || 1
      let monthOffset = 0

      while (instanceCount < maxInstances) {
        const instanceDate = getMonthlyInstanceDate(
          startDate.getFullYear(),
          startDate.getMonth() + monthOffset,
          monthlyType,
          startDate
        )

        if (instanceDate > new Date(today.getFullYear() + 2, 11, 31)) break
        if (instanceDate > viewEnd) break

        if (instanceDate >= new Date(startDate.getFullYear(), startDate.getMonth(), 1)) {
          if (item.recurrence_end_type === 'on_date' && item.recurrence_end_date) {
            if (instanceDate > new Date(item.recurrence_end_date)) break
          } else if (item.recurrence_end_type === 'after_count' && item.recurrence_end_count) {
            if (instanceCount >= item.recurrence_end_count) break
          }

          if (instanceDate >= viewStart) {
            const instanceDateStr = formatDate(instanceDate)
            if (!excludedDates.includes(instanceDateStr)) {
              const instance = { ...item }
              if (itemType === 'event') {
                instance.start_date = instanceDateStr
                if (item.end_date) {
                  const daysDiff = Math.floor(
                    (new Date(item.end_date) - startDate) / (1000 * 60 * 60 * 24)
                  )
                  const newEndDate = new Date(instanceDate)
                  newEndDate.setDate(newEndDate.getDate() + daysDiff)
                  instance.end_date = formatDate(newEndDate)
                }
              } else if (itemType === 'task') {
                instance.due_date = instanceDateStr
              } else if (itemType === 'goal') {
                instance.target_date = instanceDateStr
              }
              instances.push(instance)
            }
          }
          instanceCount++
        }

        monthOffset += interval
      }
    } else {
      let currentInstanceDate = new Date(startDate)

      while (currentInstanceDate <= viewEnd && instanceCount < maxInstances) {
        if (currentInstanceDate >= viewStart) {
          let shouldInclude = false

          if (item.recurrence_frequency === 'daily') {
            shouldInclude = true
          } else if (item.recurrence_frequency === 'weekly') {
            const dayOfWeek = currentInstanceDate.getDay()
            if (item.recurrence_days_of_week && item.recurrence_days_of_week.length > 0) {
              shouldInclude = item.recurrence_days_of_week.includes(dayOfWeek)
            } else {
              shouldInclude = dayOfWeek === startDate.getDay()
            }
          }

          if (shouldInclude) {
            if (item.recurrence_end_type === 'on_date' && item.recurrence_end_date) {
              if (currentInstanceDate > new Date(item.recurrence_end_date)) break
            } else if (item.recurrence_end_type === 'after_count' && item.recurrence_end_count) {
              if (instanceCount >= item.recurrence_end_count) break
            }

            const instanceDateStr = formatDate(currentInstanceDate)
            if (!excludedDates.includes(instanceDateStr)) {
              const instance = { ...item }
              if (itemType === 'event') {
                instance.start_date = instanceDateStr
                if (item.end_date) {
                  const daysDiff = Math.floor(
                    (new Date(item.end_date) - startDate) / (1000 * 60 * 60 * 24)
                  )
                  const newEndDate = new Date(currentInstanceDate)
                  newEndDate.setDate(newEndDate.getDate() + daysDiff)
                  instance.end_date = formatDate(newEndDate)
                }
              } else if (itemType === 'task') {
                instance.due_date = instanceDateStr
              } else if (itemType === 'goal') {
                instance.target_date = instanceDateStr
              }
              instances.push(instance)
            }
            instanceCount++
          }
        }

        if (item.recurrence_frequency === 'daily') {
          currentInstanceDate.setDate(
            currentInstanceDate.getDate() + (item.recurrence_interval || 1)
          )
        } else if (item.recurrence_frequency === 'weekly') {
          currentInstanceDate.setDate(currentInstanceDate.getDate() + 1)
        }

        if (currentInstanceDate > new Date(today.getFullYear() + 2, 11, 31)) break
      }
    }

    return instances.length > 0 ? instances : [item]
  }

  React.useEffect(() => {
    if (businesses.length > 0) {
      const saved = localStorage.getItem('calendarSelectedBusinessIds')
      const savedIds = saved ? JSON.parse(saved) : []
      // Add any new businesses that aren't yet in the saved list
      const newBusinessIds = businesses.map(b => b.id).filter(id => !savedIds.includes(id))
      if (newBusinessIds.length > 0) {
        const updatedIds = [...savedIds, ...newBusinessIds]
        setSelectedBusinessIds(updatedIds)
        localStorage.setItem('calendarSelectedBusinessIds', JSON.stringify(updatedIds))
      } else if (!saved) {
        const allBusinessIds = businesses.map(b => b.id)
        setSelectedBusinessIds(allBusinessIds)
        localStorage.setItem('calendarSelectedBusinessIds', JSON.stringify(allBusinessIds))
      }
    }
  }, [businesses])

  const getOrderedCategories = () => {
    const categories = [
      { value: 'health_body', label: 'Health', section: 'Private > Health' },
      { value: 'health_mind', label: 'Mind', section: 'Private > Mind' },
      { value: 'fitness', label: 'Fitness', section: 'Private > Fitness' },
      { value: 'assets', label: 'Assets', section: 'Private > Assets' },
      { value: 'hobbies', label: 'Hobbies', section: 'Private > Hobbies' },
      { value: 'learning', label: 'Learning', section: 'Private > Learning & Development' },
      { value: 'relationships', label: 'Relationships', section: 'Private > Relationships' }
    ]

    const saved = localStorage.getItem('subsectionOrder')
    const subsectionOrder = saved ? JSON.parse(saved) : {}
    const privateOrder = subsectionOrder['Private'] || []

    if (privateOrder.length === 0) return categories

    return [...categories].sort((a, b) => {
      const nameA = a.section.replace('Private > ', '')
      const nameB = b.section.replace('Private > ', '')
      const indexA = privateOrder.indexOf(nameA)
      const indexB = privateOrder.indexOf(nameB)

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })
  }

  const getOrderedBusinesses = () => {
    const saved = localStorage.getItem('subsectionOrder')
    const subsectionOrder = saved ? JSON.parse(saved) : {}
    const businessOrder = subsectionOrder['Business'] || []

    if (businessOrder.length === 0) return businesses

    return [...businesses].sort((a, b) => {
      const indexA = businessOrder.indexOf(a.name)
      const indexB = businessOrder.indexOf(b.name)

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })
  }

  const orderedCategories = getOrderedCategories()
  const orderedBusinesses = getOrderedBusinesses()

  const categories = orderedCategories.filter(cat => !isHidden(cat.section))

  const toggleCategory = categoryValue => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(categoryValue)
        ? prev.filter(c => c !== categoryValue)
        : [...prev, categoryValue]
      localStorage.setItem('calendarSelectedCategories', JSON.stringify(newCategories))
      return newCategories
    })
  }

  const toggleBusiness = businessId => {
    setSelectedBusinessIds(prev => {
      const newBusinessIds = prev.includes(businessId)
        ? prev.filter(id => id !== businessId)
        : [...prev, businessId]
      localStorage.setItem('calendarSelectedBusinessIds', JSON.stringify(newBusinessIds))
      return newBusinessIds
    })
  }

  React.useEffect(() => {
    localStorage.setItem('calendarShowTasks', JSON.stringify(showTasks))
  }, [showTasks])

  React.useEffect(() => {
    localStorage.setItem('calendarShowGoals', JSON.stringify(showGoals))
  }, [showGoals])

  React.useEffect(() => {
    localStorage.setItem('calendarShowEvents', JSON.stringify(showEvents))
  }, [showEvents])

  React.useEffect(() => {
    localStorage.setItem('calendarShowGoogle', JSON.stringify(showGoogleCalendar))
  }, [showGoogleCalendar])

  React.useEffect(() => {
    localStorage.setItem('calendarShowWorkoutPlans', JSON.stringify(showWorkoutPlans))
  }, [showWorkoutPlans])

  React.useEffect(() => {
    localStorage.setItem('calendarShowImportant', JSON.stringify(showImportant))
  }, [showImportant])

  React.useEffect(() => {
    localStorage.setItem('calendarViewType', viewType)

    // Scroll to 7 AM in week view
    if (viewType === 'week' && weekViewRef.current) {
      setTimeout(() => {
        weekViewRef.current.scrollTop = 7 * 90 // 7 hours * 90px per hour
      }, 0)
    }
  }, [viewType])

  const filteredTasks = useMemo(() => {
    if (!showTasks) return []

    const filtered = tasks.filter(task => {
      if (!task.due_date) return false

      // Filter by importance
      if (showImportant && !task.important) return false

      // Handle business category separately
      if (task.category === 'business') {
        return task.business_id && selectedBusinessIds.includes(task.business_id)
      }

      return selectedCategories.includes(task.category)
    })

    // Generate recurring instances
    return filtered.flatMap(task => generateRecurringInstances(task, 'task'))
  }, [tasks, showTasks, selectedCategories, selectedBusinessIds, showImportant, currentDate])

  const filteredGoals = useMemo(() => {
    if (!showGoals) return []

    const filtered = goals.filter(goal => {
      if (!goal.target_date) return false

      // Filter by importance
      if (showImportant && !goal.important) return false

      // Handle business category separately
      if (goal.category === 'business') {
        return goal.business_id && selectedBusinessIds.includes(goal.business_id)
      }

      return selectedCategories.includes(goal.category)
    })

    // Generate recurring instances
    return filtered.flatMap(goal => generateRecurringInstances(goal, 'goal'))
  }, [goals, showGoals, selectedCategories, selectedBusinessIds, showImportant, currentDate])

  const filteredEvents = useMemo(() => {
    if (!showEvents) return []

    const filtered = events.filter(event => {
      if (!event.start_date) return false

      // Filter by importance
      if (showImportant && !event.important) return false

      // Handle business category separately
      if (event.category === 'business') {
        return event.business_id && selectedBusinessIds.includes(event.business_id)
      }

      return selectedCategories.includes(event.category)
    })

    // Generate recurring instances
    return filtered.flatMap(event => generateRecurringInstances(event, 'event'))
  }, [events, showEvents, selectedCategories, selectedBusinessIds, showImportant, currentDate])

  const getCalendarDays = () => {
    if (viewType === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    } else if (viewType === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    } else {
      return [startOfDay(currentDate)]
    }
  }

  const calendarDays = getCalendarDays()

  const getEventsForDay = day => {
    const dayTasks = filteredTasks
      .filter(task => task.due_date && isSameDay(new Date(task.due_date), day))
      .sort((a, b) => {
        // Sort by time if both have time set
        if (a.due_time && b.due_time) {
          return a.due_time.localeCompare(b.due_time)
        }
        // Items with time come first
        if (a.due_time && !b.due_time) return -1
        if (!a.due_time && b.due_time) return 1
        return 0
      })

    const dayGoals = filteredGoals
      .filter(goal => goal.target_date && isSameDay(new Date(goal.target_date), day))
      .sort((a, b) => {
        // Sort by time if both have time set
        if (a.target_time && b.target_time) {
          return a.target_time.localeCompare(b.target_time)
        }
        // Items with time come first
        if (a.target_time && !b.target_time) return -1
        if (!a.target_time && b.target_time) return 1
        return 0
      })

    const dayEvents = filteredEvents
      .filter(event => {
        if (!event.start_date) return false
        const startDate = startOfDay(new Date(event.start_date))
        const endDate = event.end_date ? startOfDay(new Date(event.end_date)) : startDate
        const checkDay = startOfDay(day)
        return checkDay >= startDate && checkDay <= endDate
      })
      .sort((a, b) => {
        // Multi-day events come first
        const aIsMultiDay = a.end_date && a.end_date !== a.start_date
        const bIsMultiDay = b.end_date && b.end_date !== b.start_date

        if (aIsMultiDay && !bIsMultiDay) return -1
        if (!aIsMultiDay && bIsMultiDay) return 1

        // Then sort by start time if both have time set
        if (a.start_time && b.start_time) {
          return a.start_time.localeCompare(b.start_time)
        }
        // Items with time come first
        if (a.start_time && !b.start_time) return -1
        if (!a.start_time && b.start_time) return 1
        return 0
      })

    const dayWorkouts = showWorkoutPlans
      ? workoutPlans.filter(
          plan => plan.active && plan.scheduled_days && plan.scheduled_days.includes(day.getDay())
        )
      : []

    return { tasks: dayTasks, goals: dayGoals, events: dayEvents, workouts: dayWorkouts }
  }

  /*   const getBusinessName = businessId => {
    const business = businesses.find(b => b.id === businessId)
    return business ? business.name : 'Business'
  } */

  const getCategoryColors = category => {
    const colorMap = {
      assets: 'bg-yellow-50 text-yellow-900',
      health_body: 'bg-green-50 text-green-900',
      health_mind: 'bg-green-50 text-green-900',
      fitness: 'bg-sky-50 text-sky-900',
      hobbies: 'bg-orange-50 text-orange-900',
      learning: 'bg-violet-50 text-violet-900',
      relationships: 'bg-rose-50 text-rose-900',
      business: 'bg-blue-50 text-blue-900'
    }
    return colorMap[category] || 'bg-slate-100 text-slate-700'
  }

  const handleNavigate = direction => {
    if (viewType === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    } else if (viewType === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1))
    }
  }

  const getDateRangeLabel = () => {
    if (viewType === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else if (viewType === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'MMMM d, yyyy')
    }
  }

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications are not supported')
      return
    }

    const currentPermission = Notification.permission

    if (notificationsEnabled) {
      // Disable notifications (can't revoke browser permission, just set flag)
      localStorage.setItem('browserNotificationsEnabled', 'false')
      setNotificationsEnabled(false)
      toast.success('Push notifications disabled')
    } else {
      // Check current permission status
      if (currentPermission === 'granted') {
        // Already granted, just enable
        localStorage.setItem('browserNotificationsEnabled', 'true')
        setNotificationsEnabled(true)
        toast.success('Push notifications enabled')
      } else if (currentPermission === 'denied') {
        toast.error(
          'Notification permission was denied. Please enable it in your browser settings.'
        )
      } else {
        // Request permission
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          localStorage.setItem('browserNotificationsEnabled', 'true')
          setNotificationsEnabled(true)
          toast.success('Push notifications enabled')
        } else {
          localStorage.setItem('browserNotificationsEnabled', 'false')
          toast.error('Notification permission denied')
        }
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TaskEditDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={open => !open && setEditingTask(null)}
        />
        <GoalEditDialog
          goal={editingGoal}
          open={!!editingGoal}
          onOpenChange={open => !open && setEditingGoal(null)}
        />
        <EventEditDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={open => !open && setEditingEvent(null)}
        />
        <CreateEntryDialog
          date={creatingDate}
          time={creatingTime}
          open={!!creatingDate}
          onOpenChange={open => !open && (setCreatingDate(null), setCreatingTime(null))}
          initialTaskData={duplicateTask}
          initialGoalData={duplicateGoal}
          initialEventData={duplicateEvent}
          onTaskCreated={() => setDuplicateTask(null)}
          onGoalCreated={() => setDuplicateGoal(null)}
          onEventCreated={() => setDuplicateEvent(null)}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete recurring entry</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600">
                Do you want to delete only this entry or all recurring entries?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50">
                Cancel
              </AlertDialogCancel>
              <button
                onClick={() => handleDeleteRecurring('single')}
                className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Only this entry
              </button>
              <button
                onClick={() => handleDeleteRecurring('all')}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors whitespace-nowrap"
              >
                All recurring entries
              </button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {isScrolled && (
          <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="py-3">
              <h1 className="calendar-sticky-title text-sm font-normal text-slate-900 text-center">
                Calendar
              </h1>
            </div>
          </div>
        )}
        <div
          ref={headerRef}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-6"
        >
          <h1 className="calendar-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left w-full lg:w-auto flex items-center justify-center lg:justify-start gap-3">
            <CalendarIcon className="w-9 h-9 text-black" />
            Calendar
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <UpgradeGate
              enabled={can('home_push_notifications')}
              message="Push Notifications require a paid plan. Upgrade to stay on top of your schedule."
              inline
            >
              <Button
                onClick={handleToggleNotifications}
                variant="outline"
                className="gap-2 w-full sm:w-auto"
              >
                {notificationsEnabled ? (
                  <BellOff className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {notificationsEnabled ? 'Disable' : 'Enable'} Push Notifications
              </Button>
            </UpgradeGate>
          </div>
        </div>

        <div className="calendar-wrapper bg-white lg:rounded-xl lg:border border-slate-200 lg:p-3 mb-6 w-full lg:max-w-[1400px] lg:mx-auto">
          <div className="calendar-content lg:space-y-0 space-y-3 p-3 lg:p-0">
            <div className="calendar-header flex flex-col lg:flex-row items-center lg:justify-between gap-3 mb-3">
              <div className="calendar-navigation flex items-center justify-center gap-3 w-full lg:w-auto overflow-x-auto">
                <Button variant="outline" size="icon" onClick={() => handleNavigate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Popover
                  open={showMonthPicker}
                  onOpenChange={open => {
                    setShowMonthPicker(open)
                    if (open) {
                      setPickerYear(currentDate.getFullYear())
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center justify-center gap-1 text-lg lg:text-xl font-semibold text-slate-900 min-w-[140px] lg:min-w-[200px] hover:text-indigo-600 transition-colors whitespace-nowrap">
                      {getDateRangeLabel()}{' '}
                      {viewType === 'month' && <span className="text-[10px]">▼</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPickerYear(prev => prev - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold text-slate-900">{pickerYear}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPickerYear(prev => prev + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        'Jan',
                        'Feb',
                        'Mar',
                        'Apr',
                        'May',
                        'Jun',
                        'Jul',
                        'Aug',
                        'Sep',
                        'Oct',
                        'Nov',
                        'Dec'
                      ].map((monthName, i) => {
                        const isSelected =
                          currentDate.getMonth() === i && currentDate.getFullYear() === pickerYear
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentDate(new Date(pickerYear, i, 1))
                              setShowMonthPicker(false)
                            }}
                            className={cn(
                              'px-2 py-2 text-sm rounded-md transition-colors',
                              isSelected
                                ? 'bg-indigo-600 text-white font-medium'
                                : 'hover:bg-slate-100 text-slate-700'
                            )}
                          >
                            {monthName}
                          </button>
                        )
                      })}
                    </div>
                    <div className="border-t border-slate-200 pt-2 space-y-1 max-h-40 overflow-y-auto">
                      {Array.from({ length: 2040 - 1950 + 1 }, (_, i) => {
                        const year = 2040 - i
                        return (
                          <button
                            key={year}
                            onClick={() => {
                              setPickerYear(year)
                              setCurrentDate(new Date(year, currentDate.getMonth(), 1))
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 rounded text-slate-700 transition-colors"
                          >
                            {year}
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={() => handleNavigate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="hidden sm:inline-flex"
                >
                  Today
                </Button>
              </div>

              <div className="calendar-controls flex items-center justify-center gap-2 w-full lg:w-auto">
                <div className="calendar-view-switcher flex items-center rounded-lg border border-slate-200 p-1 flex-shrink-0">
                  <Button
                    variant={viewType === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('month')}
                    className="h-8 px-2 lg:px-3 text-xs lg:text-sm"
                  >
                    Month
                  </Button>
                  <Button
                    variant={viewType === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('week')}
                    className="h-8 px-2 lg:px-3 text-xs lg:text-sm"
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewType === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('day')}
                    className="h-8 px-2 lg:px-3 text-xs lg:text-sm"
                  >
                    Day
                  </Button>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-6">
                      <div>
                        <h3 className="calendar-filter-title text-lg font-semibold text-slate-900 mb-3">
                          Show
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="show-tasks"
                              checked={showTasks}
                              onCheckedChange={setShowTasks}
                            />

                            <label
                              htmlFor="show-tasks"
                              className="text-base font-normal text-slate-900 cursor-pointer"
                            >
                              Tasks
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="show-goals"
                              checked={showGoals}
                              onCheckedChange={setShowGoals}
                            />

                            <label
                              htmlFor="show-goals"
                              className="text-base font-normal text-slate-900 cursor-pointer"
                            >
                              Goals
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="show-events"
                              checked={showEvents}
                              onCheckedChange={setShowEvents}
                            />

                            <label
                              htmlFor="show-events"
                              className="text-base font-normal text-slate-900 cursor-pointer"
                            >
                              Events
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="show-google"
                              checked={showGoogleCalendar}
                              onCheckedChange={setShowGoogleCalendar}
                            />

                            <label
                              htmlFor="show-google"
                              className="text-base font-normal text-slate-900 cursor-pointer"
                            >
                              Google Calendar
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="show-workouts"
                              checked={showWorkoutPlans}
                              onCheckedChange={setShowWorkoutPlans}
                            />

                            <label
                              htmlFor="show-workouts"
                              className="text-base font-normal text-slate-900 cursor-pointer"
                            >
                              Workout Plans
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="show-important"
                              checked={showImportant}
                              onCheckedChange={setShowImportant}
                            />

                            <label
                              htmlFor="show-important"
                              className="text-base font-normal text-slate-900 cursor-pointer"
                            >
                              Important Only
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="calendar-categories-title text-lg font-semibold text-slate-900 mb-3">
                          Personal Categories
                        </h3>
                        <div className="space-y-3">
                          {categories.map(cat => (
                            <div key={cat.value} className="flex items-center gap-3">
                              <Checkbox
                                id={`cat-${cat.value}`}
                                checked={selectedCategories.includes(cat.value)}
                                onCheckedChange={() => toggleCategory(cat.value)}
                              />

                              <label
                                htmlFor={`cat-${cat.value}`}
                                className="text-base font-normal text-slate-900 cursor-pointer"
                              >
                                {cat.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {orderedBusinesses.filter(b => !isHidden(`Business > ${b.name}`)).length >
                        0 && (
                        <div className="border-t border-slate-200 pt-6">
                          <h3 className="calendar-businesses-title text-lg font-semibold text-slate-900 mb-3">
                            Businesses
                          </h3>
                          <div className="space-y-3">
                            {orderedBusinesses
                              .filter(b => !isHidden(`Business > ${b.name}`))
                              .map(business => (
                                <div key={business.id} className="flex items-center gap-3">
                                  <Checkbox
                                    id={`business-${business.id}`}
                                    checked={selectedBusinessIds.includes(business.id)}
                                    onCheckedChange={() => toggleBusiness(business.id)}
                                  />

                                  <label
                                    htmlFor={`business-${business.id}`}
                                    className="text-base font-normal text-slate-900 cursor-pointer"
                                  >
                                    {business.name}
                                  </label>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {viewType === 'month' && (
              <div className="calendar-month-view grid grid-cols-7 border-t border-l border-slate-200">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-slate-600 py-2 border-r border-b border-slate-200"
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map((day, idx) => {
                  const events = getEventsForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())
                  const allDayItems = [
                    ...events.events.map(e => ({ ...e, itemType: 'event' })),
                    ...events.tasks.map(t => ({ ...t, itemType: 'task' })),
                    ...events.goals.map(g => ({ ...g, itemType: 'goal' })),
                    ...events.workouts.map(w => ({ ...w, itemType: 'workout', title: w.name }))
                  ]

                  /*    const totalEvents = allDayItems.length */
                  const dayKey = day.toISOString()
                  const isExpanded = expandedDays.has(dayKey)
                  const maxVisible = 3
                  const visibleItems = allDayItems.slice(0, maxVisible)
                  const hiddenItems = allDayItems.slice(maxVisible)

                  return (
                    <div
                      key={idx}
                      onDoubleClick={() => setCreatingDate(day)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault()
                        handleDrop(day)
                      }}
                      className={cn(
                        'calendar-day-cell min-h-[134px] border-r border-b border-slate-200 p-[0.2rem] cursor-pointer relative',
                        !isCurrentMonth && 'bg-slate-50'
                      )}
                    >
                      <div className="flex items-start">
                        <span
                          className={cn(
                            'text-sm',
                            isToday ? 'text-indigo-600 font-bold' : 'text-slate-900',
                            !isCurrentMonth && 'text-slate-400'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {visibleItems.map(item => {
                          const isPast =
                            item.itemType === 'task'
                              ? item.due_date &&
                                new Date(item.due_date) < new Date(new Date().setHours(0, 0, 0, 0))
                              : item.itemType === 'goal'
                                ? item.target_date &&
                                  new Date(item.target_date) <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                : item.itemType === 'workout'
                                  ? false
                                  : day < new Date(new Date().setHours(0, 0, 0, 0))

                          const Icon =
                            item.itemType === 'task'
                              ? ListTodo
                              : item.itemType === 'goal'
                                ? Target
                                : item.itemType === 'workout'
                                  ? Dumbbell
                                  : Clock

                          return (
                            <ContextMenu key={`${item.itemType}-${item.id}`}>
                              <ContextMenuTrigger className="block">
                                <div
                                  draggable
                                  onDragStart={e => {
                                    setDraggedItem({ type: item.itemType, item })
                                    const dragImage = document.createElement('div')
                                    dragImage.style.width = e.currentTarget.offsetWidth + 'px'
                                    dragImage.style.height = e.currentTarget.offsetHeight + 'px'
                                    dragImage.style.backgroundColor = '#e2e8f0'
                                    dragImage.style.borderRadius = '6px'
                                    dragImage.style.position = 'absolute'
                                    dragImage.style.top = '-1000px'
                                    document.body.appendChild(dragImage)
                                    e.dataTransfer.setDragImage(dragImage, 0, 0)
                                    setTimeout(() => document.body.removeChild(dragImage), 0)
                                  }}
                                  onClick={() => {
                                    if (item.itemType === 'task') setEditingTask(item)
                                    else if (item.itemType === 'goal') setEditingGoal(item)
                                    else setEditingEvent(item)
                                  }}
                                  className={cn(
                                    'text-xs px-1.5 py-1 rounded flex items-center relative shadow-sm cursor-move hover:ring-2 hover:ring-indigo-400 transition-all',
                                    getCategoryColors(item.category),
                                    isPast && 'opacity-50'
                                  )}
                                  style={{ gap: '0.2rem' }}
                                  title={item.title}
                                >
                                  {item.important && (
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 absolute -top-1 -left-1" />
                                  )}
                                  <Icon className="w-3.5 h-3.5 flex-shrink-0 hidden lg:inline-block" />
                                  {(item.due_time || item.target_time || item.start_time) && (
                                    <span
                                      className="text-[10px] leading-none hidden lg:inline-block"
                                      style={{ paddingTop: '2px' }}
                                    >
                                      {item.due_time || item.target_time || item.start_time}
                                    </span>
                                  )}
                                  <span className="truncate text-[10px] lg:text-xs">
                                    {item.title}
                                  </span>
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem
                                  onClick={() => handleDuplicate(item, item.itemType)}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => handleDelete(item, item.itemType)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          )
                        })}

                        {hiddenItems.length > 0 && !isExpanded && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setExpandedDays(prev => new Set(prev).add(dayKey))
                            }}
                            className="text-xs text-slate-500 px-2 hover:text-indigo-600 hover:underline"
                          >
                            +{hiddenItems.length} more
                          </button>
                        )}
                      </div>

                      {isExpanded && hiddenItems.length > 0 && (
                        <div
                          className="absolute left-0 right-0 bg-white border border-slate-200 rounded-lg z-10 space-y-1"
                          style={{ top: '104px', padding: '0.2rem' }}
                        >
                          {hiddenItems.map(item => {
                            const isPast =
                              item.itemType === 'task'
                                ? item.due_date &&
                                  new Date(item.due_date) <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                : item.itemType === 'goal'
                                  ? item.target_date &&
                                    new Date(item.target_date) <
                                      new Date(new Date().setHours(0, 0, 0, 0))
                                  : item.itemType === 'workout'
                                    ? false
                                    : day < new Date(new Date().setHours(0, 0, 0, 0))

                            const Icon =
                              item.itemType === 'task'
                                ? ListTodo
                                : item.itemType === 'goal'
                                  ? Target
                                  : item.itemType === 'workout'
                                    ? Dumbbell
                                    : Clock

                            return (
                              <ContextMenu key={`${item.itemType}-${item.id}`}>
                                <ContextMenuTrigger className="block">
                                  <div
                                    draggable
                                    onDragStart={e => {
                                      setDraggedItem({ type: item.itemType, item })
                                      const dragImage = document.createElement('div')
                                      dragImage.style.width = e.currentTarget.offsetWidth + 'px'
                                      dragImage.style.height = e.currentTarget.offsetHeight + 'px'
                                      dragImage.style.backgroundColor = '#e2e8f0'
                                      dragImage.style.borderRadius = '6px'
                                      dragImage.style.position = 'absolute'
                                      dragImage.style.top = '-1000px'
                                      document.body.appendChild(dragImage)
                                      e.dataTransfer.setDragImage(dragImage, 0, 0)
                                      setTimeout(() => document.body.removeChild(dragImage), 0)
                                    }}
                                    onClick={() => {
                                      if (item.itemType === 'task') setEditingTask(item)
                                      else if (item.itemType === 'goal') setEditingGoal(item)
                                      else setEditingEvent(item)
                                    }}
                                    className={cn(
                                      'text-xs px-1.5 py-1 rounded flex items-center relative shadow-sm cursor-move hover:ring-2 hover:ring-indigo-400 transition-all',
                                      getCategoryColors(item.category),
                                      isPast && 'opacity-50'
                                    )}
                                    style={{ gap: '0.2rem' }}
                                    title={item.title}
                                  >
                                    {item.important && (
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 absolute -top-1 -left-1" />
                                    )}
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0 hidden lg:inline-block" />
                                    {(item.due_time || item.target_time || item.start_time) && (
                                      <span
                                        className="text-[10px] leading-none hidden lg:inline-block"
                                        style={{ paddingTop: '2px' }}
                                      >
                                        {item.due_time || item.target_time || item.start_time}
                                      </span>
                                    )}
                                    <span className="truncate text-[10px] lg:text-xs">
                                      {item.title}
                                    </span>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem
                                    onClick={() => handleDuplicate(item, item.itemType)}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => handleDelete(item, item.itemType)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            )
                          })}

                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setExpandedDays(prev => {
                                const newSet = new Set(prev)
                                newSet.delete(dayKey)
                                return newSet
                              })
                            }}
                            className="text-xs text-slate-500 px-2 hover:text-indigo-600 hover:underline w-full text-left"
                          >
                            Show less
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {viewType === 'week' && (
              <div
                className="calendar-week-view border-t border-slate-200 overflow-x-auto"
                style={{ height: 'calc(100vh - 250px)' }}
              >
                {/* Fixed Header */}
                <div className="calendar-week-header flex bg-white sticky top-0 z-10">
                  <div className="w-6 lg:w-20 border-r border-b border-slate-200 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-7 border-b border-slate-200">
                    {calendarDays.map((day, idx) => {
                      const isToday = isSameDay(day, new Date())
                      return (
                        <div
                          key={idx}
                          onDoubleClick={() => setCreatingDate(day)}
                          className={cn(
                            'text-center py-1.5 h-10 flex flex-col items-center justify-center cursor-pointer border-r border-slate-200',
                            isToday && 'bg-indigo-50'
                          )}
                        >
                          <div className="text-xs text-slate-600 font-medium">
                            {format(day, 'EEE')}
                          </div>
                          <div
                            className={cn(
                              'text-xs lg:text-sm font-semibold',
                              isToday
                                ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white'
                                : 'text-slate-900'
                            )}
                          >
                            {format(day, 'd')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Scrollable Content */}
                <div
                  ref={weekViewRef}
                  className="calendar-week-grid flex overflow-y-auto overflow-x-hidden"
                  style={{ height: 'calc(100% - 40px)' }}
                >
                  {/* Timeline column */}
                  <div
                    className="calendar-week-timeline w-6 lg:w-20 border-r border-slate-200 flex-shrink-0"
                    style={{ minHeight: '2160px' }}
                  >
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div
                        key={hour}
                        className="h-[90px] border-b border-slate-200 text-[10px] lg:text-xs text-slate-500 px-1 lg:px-2 py-1 text-right"
                      >
                        <span className="lg:hidden">{String(hour).padStart(2, '0')}</span>
                        <span className="hidden lg:inline">{String(hour).padStart(2, '0')}:00</span>
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div
                    className="calendar-week-days flex-1 grid grid-cols-7"
                    style={{ minHeight: '2160px' }}
                  >
                    {calendarDays.map((day, idx) => {
                      /*  const isToday = isSameDay(day, new Date()) */
                      const events = getEventsForDay(day)
                      return (
                        <div key={idx} className="border-r border-slate-200">
                          {Array.from({ length: 24 }, (_, hour) => {
                            const isExpanded = expandedWeekHours.has(hour)

                            const allEvents = [
                              ...events.tasks.map(task => ({ ...task, type: 'task' })),
                              ...events.goals.map(goal => ({ ...goal, type: 'goal' })),
                              ...events.events.map(event => ({ ...event, type: 'event' }))
                            ]

                            const hourEvents = allEvents.filter(event => {
                              const time =
                                event.type === 'task'
                                  ? event.due_time || '09:00'
                                  : event.type === 'goal'
                                    ? event.target_time || '09:00'
                                    : event.start_time || '09:00'
                              return parseInt(time.split(':')[0]) === hour
                            })

                            const visibleEvents = hourEvents.slice(0, 2)
                            const hiddenEvents = hourEvents.slice(2)

                            return (
                              <div
                                key={hour}
                                className="relative"
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                  e.preventDefault()
                                  const time = `${String(hour).padStart(2, '0')}:00`
                                  handleDrop(day, time)
                                }}
                              >
                                <div
                                  className="h-[90px] border-b border-slate-200 p-2 cursor-pointer hover:bg-indigo-50/30 transition-colors"
                                  onDoubleClick={() => {
                                    const time = `${String(hour).padStart(2, '0')}:00`
                                    setCreatingDate(day)
                                    setCreatingTime(time)
                                  }}
                                >
                                  <div className="space-y-1">
                                    {visibleEvents.map(event => {
                                      const isPast =
                                        event.type === 'task'
                                          ? event.due_date &&
                                            new Date(event.due_date) <
                                              new Date(new Date().setHours(0, 0, 0, 0))
                                          : event.type === 'goal'
                                            ? event.target_date &&
                                              new Date(event.target_date) <
                                                new Date(new Date().setHours(0, 0, 0, 0))
                                            : day < new Date(new Date().setHours(0, 0, 0, 0))

                                      const icon =
                                        event.type === 'task'
                                          ? ListTodo
                                          : event.type === 'goal'
                                            ? Target
                                            : Clock
                                      const IconComponent = icon

                                      return (
                                        <ContextMenu key={`${event.type}-${event.id}`}>
                                          <ContextMenuTrigger className="block">
                                            <div
                                              draggable
                                              onDragStart={e => {
                                                setDraggedItem({ type: event.type, item: event })
                                                const dragImage = document.createElement('div')
                                                dragImage.style.width =
                                                  e.currentTarget.offsetWidth + 'px'
                                                dragImage.style.height =
                                                  e.currentTarget.offsetHeight + 'px'
                                                dragImage.style.backgroundColor = '#e2e8f0'
                                                dragImage.style.borderRadius = '6px'
                                                dragImage.style.position = 'absolute'
                                                dragImage.style.top = '-1000px'
                                                document.body.appendChild(dragImage)
                                                e.dataTransfer.setDragImage(dragImage, 0, 0)
                                                setTimeout(
                                                  () => document.body.removeChild(dragImage),
                                                  0
                                                )
                                              }}
                                              onClick={() => {
                                                if (event.type === 'task') setEditingTask(event)
                                                else if (event.type === 'goal')
                                                  setEditingGoal(event)
                                                else setEditingEvent(event)
                                              }}
                                              className={cn(
                                                'text-xs px-1.5 py-1 rounded flex items-center relative shadow-sm cursor-move hover:ring-2 hover:ring-indigo-400 transition-all',
                                                getCategoryColors(event.category),
                                                isPast && 'opacity-50'
                                              )}
                                              style={{ gap: '0.2rem' }}
                                              title={event.title}
                                            >
                                              {event.important && (
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 absolute -top-1 -left-1" />
                                              )}
                                              <IconComponent className="w-3.5 h-3.5 flex-shrink-0 hidden lg:inline-block" />
                                              {(event.due_time ||
                                                event.target_time ||
                                                event.start_time) && (
                                                <span
                                                  className="text-[10px] leading-none hidden lg:inline-block"
                                                  style={{ paddingTop: '2px' }}
                                                >
                                                  {event.due_time ||
                                                    event.target_time ||
                                                    event.start_time}
                                                </span>
                                              )}
                                              <span className="truncate">{event.title}</span>
                                            </div>
                                          </ContextMenuTrigger>
                                          <ContextMenuContent>
                                            <ContextMenuItem
                                              onClick={() => handleDuplicate(event, event.type)}
                                            >
                                              <Copy className="w-4 h-4 mr-2" />
                                              Duplicate
                                            </ContextMenuItem>
                                            <ContextMenuItem
                                              onClick={() => handleDelete(event, event.type)}
                                              className="text-red-600"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </ContextMenuItem>
                                          </ContextMenuContent>
                                        </ContextMenu>
                                      )
                                    })}

                                    {hiddenEvents.length > 0 && !isExpanded && (
                                      <button
                                        onClick={e => {
                                          e.stopPropagation()
                                          setExpandedWeekHours(prev => new Set(prev).add(hour))
                                        }}
                                        className="text-xs text-slate-500 px-2 hover:text-indigo-600 hover:underline"
                                      >
                                        +{hiddenEvents.length} more
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isExpanded && hiddenEvents.length > 0 && (
                                  <div
                                    className="absolute left-0 right-0 bg-white border-b border-slate-200 p-2 pt-0.5 space-y-1 z-10"
                                    style={{ top: '62px', borderTop: 'none' }}
                                  >
                                    {hiddenEvents.map(event => {
                                      const isPast =
                                        event.type === 'task'
                                          ? event.due_date &&
                                            new Date(event.due_date) <
                                              new Date(new Date().setHours(0, 0, 0, 0))
                                          : event.type === 'goal'
                                            ? event.target_date &&
                                              new Date(event.target_date) <
                                                new Date(new Date().setHours(0, 0, 0, 0))
                                            : day < new Date(new Date().setHours(0, 0, 0, 0))

                                      const icon =
                                        event.type === 'task'
                                          ? ListTodo
                                          : event.type === 'goal'
                                            ? Target
                                            : Clock
                                      const IconComponent = icon

                                      return (
                                        <ContextMenu key={`${event.type}-${event.id}`}>
                                          <ContextMenuTrigger className="block">
                                            <div
                                              draggable
                                              onDragStart={e => {
                                                setDraggedItem({ type: event.type, item: event })
                                                const dragImage = document.createElement('div')
                                                dragImage.style.width =
                                                  e.currentTarget.offsetWidth + 'px'
                                                dragImage.style.height =
                                                  e.currentTarget.offsetHeight + 'px'
                                                dragImage.style.backgroundColor = '#e2e8f0'
                                                dragImage.style.borderRadius = '6px'
                                                dragImage.style.position = 'absolute'
                                                dragImage.style.top = '-1000px'
                                                document.body.appendChild(dragImage)
                                                e.dataTransfer.setDragImage(dragImage, 0, 0)
                                                setTimeout(
                                                  () => document.body.removeChild(dragImage),
                                                  0
                                                )
                                              }}
                                              onClick={() => {
                                                if (event.type === 'task') setEditingTask(event)
                                                else if (event.type === 'goal')
                                                  setEditingGoal(event)
                                                else setEditingEvent(event)
                                              }}
                                              className={cn(
                                                'text-xs px-1.5 py-1 rounded flex items-center relative shadow-sm cursor-move hover:ring-2 hover:ring-indigo-400 transition-all',
                                                getCategoryColors(event.category),
                                                isPast && 'opacity-50'
                                              )}
                                              style={{ gap: '0.2rem' }}
                                              title={event.title}
                                            >
                                              {event.important && (
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 absolute -top-1 -left-1" />
                                              )}
                                              <IconComponent className="w-3.5 h-3.5 flex-shrink-0 hidden lg:inline-block" />
                                              {(event.due_time ||
                                                event.target_time ||
                                                event.start_time) && (
                                                <span
                                                  className="text-[10px] leading-none hidden lg:inline-block"
                                                  style={{ paddingTop: '2px' }}
                                                >
                                                  {event.due_time ||
                                                    event.target_time ||
                                                    event.start_time}
                                                </span>
                                              )}
                                              <span className="truncate">{event.title}</span>
                                            </div>
                                          </ContextMenuTrigger>
                                          <ContextMenuContent>
                                            <ContextMenuItem
                                              onClick={() => handleDuplicate(event, event.type)}
                                            >
                                              <Copy className="w-4 h-4 mr-2" />
                                              Duplicate
                                            </ContextMenuItem>
                                            <ContextMenuItem
                                              onClick={() => handleDelete(event, event.type)}
                                              className="text-red-600"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </ContextMenuItem>
                                          </ContextMenuContent>
                                        </ContextMenu>
                                      )
                                    })}

                                    <button
                                      onClick={e => {
                                        e.stopPropagation()
                                        setExpandedWeekHours(prev => {
                                          const newSet = new Set(prev)
                                          newSet.delete(hour)
                                          return newSet
                                        })
                                      }}
                                      className="text-xs text-slate-500 px-2 hover:text-indigo-600 hover:underline"
                                    >
                                      Show less
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {viewType === 'day' && (
              <div className="calendar-day-view border-t border-slate-200">
                <div className="calendar-day-content p-6">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <CalendarIcon className="w-6 h-6 text-indigo-600" />
                    <h2 className="calendar-day-title text-2xl font-bold text-slate-900">
                      {format(currentDate, 'EEEE, MMMM d, yyyy')}
                    </h2>
                  </div>

                  {(() => {
                    const events = getEventsForDay(currentDate)
                    const hasEvents =
                      events.tasks.length > 0 || events.goals.length > 0 || events.events.length > 0

                    return hasEvents ? (
                      <div
                        className="space-y-4 max-w-2xl mx-auto"
                        onDoubleClick={() => setCreatingDate(currentDate)}
                      >
                        {events.tasks.length > 0 && (
                          <div>
                            <h3 className="calendar-tasks-section-title text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <ListTodo className="w-4 h-4" />
                              Tasks ({events.tasks.length})
                            </h3>
                            <div className="space-y-2">
                              {events.tasks.map(task => {
                                const isPast =
                                  task.due_date &&
                                  new Date(task.due_date) <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                return (
                                  <div
                                    key={task.id}
                                    onClick={() => setEditingTask(task)}
                                    className={cn(
                                      'px-4 py-3 rounded-lg relative shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all',
                                      getCategoryColors(task.category),
                                      isPast && 'opacity-50'
                                    )}
                                  >
                                    {task.important && (
                                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 absolute -top-1.5 -left-1.5" />
                                    )}
                                    {task.due_time && (
                                      <div className="text-sm opacity-70 mb-1">{task.due_time}</div>
                                    )}
                                    <div className="font-semibold mb-1">{task.title}</div>
                                    {task.description && (
                                      <div className="text-sm opacity-80">{task.description}</div>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                                      <span className="capitalize">
                                        {task.category?.replace('_', ' ')}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {events.goals.length > 0 && (
                          <div>
                            <h3 className="calendar-goals-section-title text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Goals ({events.goals.length})
                            </h3>
                            <div className="space-y-2">
                              {events.goals.map(goal => {
                                const isPast =
                                  goal.target_date &&
                                  new Date(goal.target_date) <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                return (
                                  <div
                                    key={goal.id}
                                    onClick={() => setEditingGoal(goal)}
                                    className={cn(
                                      'px-4 py-3 rounded-lg relative shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all',
                                      getCategoryColors(goal.category),
                                      isPast && 'opacity-50'
                                    )}
                                  >
                                    {goal.important && (
                                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 absolute -top-1.5 -left-1.5" />
                                    )}
                                    {goal.target_time && (
                                      <div className="text-sm opacity-70 mb-1">
                                        {goal.target_time}
                                      </div>
                                    )}
                                    <div className="font-semibold mb-1">{goal.title}</div>
                                    {goal.description && (
                                      <div className="text-sm opacity-80">{goal.description}</div>
                                    )}
                                    <div className="text-xs opacity-70 mt-2 capitalize">
                                      {goal.category?.replace('_', ' ')}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {events.events.length > 0 && (
                          <div>
                            <h3 className="calendar-events-section-title text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Events ({events.events.length})
                            </h3>
                            <div className="space-y-2">
                              {events.events.map(event => {
                                const isPast =
                                  currentDate < new Date(new Date().setHours(0, 0, 0, 0))
                                return (
                                  <div
                                    key={event.id}
                                    onClick={() => setEditingEvent(event)}
                                    className={cn(
                                      'px-4 py-3 rounded-lg relative shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all',
                                      getCategoryColors(event.category),
                                      isPast && 'opacity-50'
                                    )}
                                  >
                                    {event.important && (
                                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 absolute -top-1.5 -left-1.5" />
                                    )}
                                    {(event.start_time || event.end_time) && (
                                      <div className="text-sm opacity-70 mb-1">
                                        {event.start_time || ''}{' '}
                                        {event.end_time && `- ${event.end_time}`}
                                      </div>
                                    )}
                                    <div className="font-semibold mb-1">{event.title}</div>
                                    {event.end_date && event.end_date !== event.start_date && (
                                      <div className="text-sm opacity-70 mb-1">
                                        {format(new Date(event.start_date), 'MMM d')} -{' '}
                                        {format(new Date(event.end_date), 'MMM d')}
                                      </div>
                                    )}
                                    {event.description && (
                                      <div className="text-sm opacity-80">{event.description}</div>
                                    )}
                                    <div className="text-xs opacity-70 mt-2 capitalize">
                                      {event.category?.replace('_', ' ')}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="text-center py-12 cursor-pointer"
                        onDoubleClick={() => setCreatingDate(currentDate)}
                      >
                        <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">
                          No tasks, goals or events scheduled for this day
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Double-click to create an entry
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
