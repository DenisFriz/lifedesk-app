import React, { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLayout } from '@/Layout'
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
  Bell,
  X,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Wallet,
  Heart,
  Dumbbell,
  Smile,
  Brain,
  Users,
  Briefcase,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDateMedium } from '@/components/utils/formatters'
import { useSubscription } from '@/hooks/useSubscription'
import UsageLimitGate from '@/components/subscription/UsageLimitGate'

export default function EventTable({
  category,
  businessId,
  filterType
}: { category?: string; businessId?: string; filterType?: string } = {}) {
  const { limit } = useSubscription()
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentTab, setCurrentTab] = useState('active')
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [showReminders, setShowReminders] = useState({})
  const [reminderValues, setReminderValues] = useState({})
  const [selectOpen, setSelectOpen] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState({})
  const [selectedEvents, setSelectedEvents] = useState([])
  const [bulkMode, setBulkMode] = useState(false)
  const [expandedEvents, setExpandedEvents] = useState({})
  const [compactView, setCompactView] = useState(() => {
    const saved = localStorage.getItem('eventTableCompactView')
    return saved ? JSON.parse(saved) : false
  })
  const [hoveredStartDate, setHoveredStartDate] = useState(null)
  const [hoveredEndDate, setHoveredEndDate] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()
  const blurTimeoutRef = React.useRef(null)
  const tableRef = React.useRef(null)
  const { playAudio } = useLayout()

  const { data: allEvents = [] } = useQuery<any[]>({
    queryKey: ['events', category, businessId],
    queryFn: () => {
      if (!category) {
        return backend.entities.Event.list('-start_date')
      }
      const filter = businessId ? { category, business_id: businessId } : { category }
      return backend.entities.Event.filter(filter)
    }
  })

  const { data: businesses = [] } = useQuery<any[]>({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order')
  })

  let filteredEvents = allEvents
  if (filterType === 'important') {
    filteredEvents = allEvents.filter(e => e.important)
  } else if (filterType === 'business') {
    filteredEvents = allEvents.filter(
      e => e.category === 'business' && e.business_id === businessId
    )
  } else if (filterType === 'category') {
    filteredEvents = allEvents.filter(e => e.category === category)
  }

  const events = filteredEvents
    .filter(e => e.status === currentTab)
    .filter(e => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        (e.title || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
      )
    })

  const getBusinessName = businessId => {
    const business = businesses.find(b => b.id === businessId)
    return business ? business.name : 'Business'
  }

  const updateMutation = useMutation<any, any, { id: string; data: Record<string, any> }>({
    mutationFn: ({ id, data }) => backend.entities.Event.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['events', category, businessId] })
      const previousEvents = queryClient.getQueryData(['events', category, businessId])
      queryClient.setQueryData(['events', category, businessId], (old: any) =>
        old.map((event: any) => (event.id === id ? { ...event, ...data } : event))
      )
      return { previousEvents }
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['events', category, businessId], context.previousEvents)
    },
    onSuccess: (updatedEvent, { id }) => {
      queryClient.setQueryData(['events', category, businessId], (old: any) =>
        old ? old.map((event: any) => (event.id === id ? updatedEvent : event)) : old
      )
      setEditingField(null)
    }
  })

  const createMutation = useMutation<any, any, Record<string, any>>({
    mutationFn: data => backend.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', category, businessId] })
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: id => {
      playAudio('delete')
      return backend.entities.Event.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', category, businessId] })
    }
  })

  const duplicateMutation = useMutation<any, any, Record<string, any>>({
    mutationFn: event => {
      const { id, created_date, updated_date, created_by, ...rest } = event
      return backend.entities.Event.create({
        ...rest,
        title: `${rest.title} (copy)`,
        status: 'active',
        order: (event.order ?? 0) + 0.5
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', category, businessId] })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    mutationFn: async ids => {
      playAudio('delete')
      await Promise.all(ids.map(id => backend.entities.Event.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', category, businessId] })
      setSelectedEvents([])
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: Record<string, any> }>({
    mutationFn: async ({ ids, data }) => {
      if (data.status === 'archived') {
        playAudio('archived')
      }
      await Promise.all(ids.map(id => backend.entities.Event.update(id, data)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', category, businessId] })
      setSelectedEvents([])
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

  const sortedEvents = [...events].sort((a, b) => {
    if (!sortBy) {
      // Default sort by order field
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

  const handleDragEnd = result => {
    if (!result.destination || result.source.index === result.destination.index) return

    const items = Array.from(sortedEvents)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Optimistically update the UI immediately
    queryClient.setQueryData(['events', category, businessId], (oldEvents: any) => {
      if (!oldEvents) return oldEvents
      return oldEvents.map((event: any) => {
        const itemIndex = items.findIndex((item: any) => item.id === event.id)
        if (itemIndex !== -1) {
          return { ...event, order: itemIndex }
        }
        return event
      })
    })

    // Update order in the backend
    items.forEach((event, index) => {
      updateMutation.mutate({ id: event.id, data: { order: index } })
    })
  }

  const paginatedEvents = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return sortedEvents.slice(startIndex, startIndex + perPage)
  }, [sortedEvents, page, perPage])

  const totalPages = Math.ceil(sortedEvents.length / perPage)

  const startEdit = (eventId, field, currentValue, secondValue = null) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    setEditingField(`${eventId}-${field}`)
    setEditValue(currentValue || '')
    if (secondValue !== null) {
      setEditingField(`${eventId}-${field}-time`)
    }
  }

  const saveEdit = (eventId, field, additionalData = {}) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    updateMutation.mutate({ id: eventId, data: { [field]: editValue, ...additionalData } })
  }

  const handleBlur = (eventId, field, additionalData = {}) => {
    blurTimeoutRef.current = setTimeout(() => {
      saveEdit(eventId, field, additionalData)
      blurTimeoutRef.current = null
    }, 150)
  }

  const handleKeyDown = (e, eventId, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit(eventId, field)
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  const toggleImportant = event => {
    updateMutation.mutate({ id: event.id, data: { important: !event.important } })
  }

  const archiveEvent = event => {
    playAudio('archived')
    updateMutation.mutate({ id: event.id, data: { status: 'archived' } })
  }

  const unarchiveEvent = event => {
    updateMutation.mutate({ id: event.id, data: { status: 'active' } })
  }

  const handleAddNew = () => {
    if (filterType === 'all') {
      setShowCategoryDialog(true)
    } else {
      const minOrder = events.length > 0 ? Math.min(...events.map(e => e.order ?? 999999)) : 0
      const data = {
        title: 'New Event',
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
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
    const minOrder = allEvents.length > 0 ? Math.min(...allEvents.map(e => e.order ?? 999999)) : 0
    const data = {
      title: 'New Event',
      status: 'active',
      category: selectedCategory,
      start_date: new Date().toISOString().split('T')[0],
      order: minOrder === 999999 ? 0 : minOrder - 1
    } as Record<string, any>

    if (selectedBusinessId) {
      data.business_id = selectedBusinessId
    }

    createMutation.mutate(data)
    setShowCategoryDialog(false)
  }

  const toggleSelectAll = () => {
    if (selectedEvents.length === paginatedEvents.length) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(paginatedEvents.map(e => e.id))
    }
  }

  const toggleSelectEvent = eventId => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    )
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedEvents([])
    }
  }

  const toggleExpandEvent = eventId => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }))
  }

  return (
    <>
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose a category</DialogTitle>
            <DialogDescription>Please choose a category for the new event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleCategorySelect('assets')}
            >
              <Wallet className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600" />
              <div className="text-left">
                <div className="font-medium">Assets</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleCategorySelect('health_body')}
            >
              <Heart className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600" />
              <div className="text-left">
                <div className="font-medium">Health</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleCategorySelect('fitness')}
            >
              <Dumbbell className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600" />
              <div className="text-left">
                <div className="font-medium">Fitness</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleCategorySelect('hobbies')}
            >
              <Smile className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600" />
              <div className="text-left">
                <div className="font-medium">Hobbies</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleCategorySelect('learning')}
            >
              <Brain className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600" />
              <div className="text-left">
                <div className="font-medium">Learning</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleCategorySelect('relationships')}
            >
              <Users className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600" />
              <div className="text-left">
                <div className="font-medium">Relationships</div>
              </div>
            </Button>
            {businesses.map(business => (
              <Button
                key={business.id}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => handleCategorySelect('business', business.id)}
              >
                <Briefcase className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600" />
                <div className="text-left">
                  <div className="font-medium">{business.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl overflow-hidden mb-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3 p-4">
            <TabsList className="bg-[#eaecf4] p-1 flex-1 lg:flex-none flex">
              <TabsTrigger
                value="active"
                className="rounded-md bg-transparent text-[#475569] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm flex-1 lg:flex-none lg:px-6"
              >
                Active
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
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-8 h-9 w-48 text-sm"
                />
              </div>
              <UsageLimitGate
                current={allEvents.length}
                max={limit('home_events_limit')}
                label="events"
              >
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
                        localStorage.setItem('eventTableCompactView', JSON.stringify(newValue))
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
            {events.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500 mb-4">No {currentTab} events</p>
                {currentTab === 'active' && (
                  <Button onClick={handleAddNew} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Event
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden [@media(min-width:1130px)]:block overflow-x-auto">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <table className="w-full min-w-[1000px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {!sortBy && (
                            <th className="pl-3 pr-2 py-3 text-left w-10">
                              <GripVertical className="w-4 h-4 text-slate-400 mx-auto" />
                            </th>
                          )}
                          <th className="pl-3 pr-2 py-3 text-left w-8">
                            <button
                              onClick={() => handleSort('important')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              <Star className="w-4 h-4" />
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          {bulkMode && (
                            <th className="px-4 py-3 text-center w-12">
                              <Checkbox
                                checked={
                                  selectedEvents.length === paginatedEvents.length &&
                                  paginatedEvents.length > 0
                                }
                                onCheckedChange={toggleSelectAll}
                              />
                            </th>
                          )}
                          <th className="px-4 py-3 text-left w-64">
                            <button
                              onClick={() => handleSort('title')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              Title
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left">
                            <span className="text-xs font-medium text-slate-700">Description</span>
                          </th>
                          {(filterType === 'all' || filterType === 'important') && (
                            <th className="px-4 py-3 text-left w-32">
                              <span className="text-xs font-medium text-slate-700">Category</span>
                            </th>
                          )}
                          <th className="px-4 py-3 text-left w-40">
                            <button
                              onClick={() => handleSort('start_date')}
                              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                            >
                              Start Date
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left w-40">
                            <span className="text-xs font-medium text-slate-700">End Date</span>
                          </th>
                          <th className="px-4 py-3 text-center w-20">
                            <span className="text-xs font-medium text-slate-700">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <Droppable droppableId="events">
                        {provided => (
                          <tbody {...provided.droppableProps} ref={provided.innerRef}>
                            {paginatedEvents.map((event, index) => (
                              <Draggable
                                key={event.id}
                                draggableId={event.id}
                                index={index}
                                isDragDisabled={!!sortBy}
                              >
                                {(provided, snapshot) => (
                                  <tr
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      'border-b border-slate-100 hover:bg-slate-50',
                                      compactView && 'h-12',
                                      snapshot.isDragging && 'opacity-50'
                                    )}
                                  >
                                    {!sortBy && (
                                      <td
                                        className={cn(
                                          'pl-3 pr-2 w-10 align-middle cursor-grab active:cursor-grabbing',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                        {...provided.dragHandleProps}
                                      >
                                        <GripVertical className="w-4 h-4 text-slate-400" />
                                      </td>
                                    )}
                                    <td
                                      className={cn(
                                        'pl-3 pr-2 w-8 align-middle',
                                        compactView ? 'py-1' : 'py-3'
                                      )}
                                    >
                                      <button onClick={() => toggleImportant(event)}>
                                        <Star
                                          className={cn(
                                            'w-5 h-5',
                                            event.important
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-slate-300 hover:text-slate-400'
                                          )}
                                        />
                                      </button>
                                    </td>
                                    {bulkMode && (
                                      <td
                                        className={cn(
                                          'px-4 text-center w-12 align-middle',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        <Checkbox
                                          checked={selectedEvents.includes(event.id)}
                                          onCheckedChange={() => toggleSelectEvent(event.id)}
                                        />
                                      </td>
                                    )}
                                    <td
                                      className={cn(
                                        'px-4 align-middle w-64',
                                        compactView ? 'py-1' : 'py-3'
                                      )}
                                    >
                                      {editingField === `${event.id}-title` ? (
                                        <Input
                                          value={editValue}
                                          onChange={e => setEditValue(e.target.value)}
                                          onBlur={() => handleBlur(event.id, 'title')}
                                          onKeyDown={e => handleKeyDown(e, event.id, 'title')}
                                          maxLength={200}
                                          autoFocus
                                          className="h-8 w-full"
                                        />
                                      ) : (
                                        <div
                                          onClick={() => startEdit(event.id, 'title', event.title)}
                                          className={cn(
                                            'cursor-text font-medium text-slate-900 hover:bg-slate-100 px-2 py-1 rounded overflow-hidden',
                                            compactView
                                              ? 'line-clamp-1'
                                              : 'line-clamp-2 max-h-[52px]'
                                          )}
                                        >
                                          {event.title}
                                        </div>
                                      )}
                                    </td>
                                    <td
                                      className={cn(
                                        'px-4 align-middle',
                                        compactView ? 'py-1' : 'py-3'
                                      )}
                                    >
                                      {editingField === `${event.id}-description` ? (
                                        <Textarea
                                          value={editValue}
                                          onChange={e => setEditValue(e.target.value)}
                                          onBlur={() => handleBlur(event.id, 'description')}
                                          onKeyDown={e => handleKeyDown(e, event.id, 'description')}
                                          maxLength={5000}
                                          autoFocus
                                          className={cn(
                                            'w-full resize-none -mx-2 -my-1',
                                            compactView
                                              ? 'h-8 min-h-0 line-clamp-1 overflow-hidden'
                                              : 'min-h-[60px]'
                                          )}
                                          style={{ width: 'calc(100% + 16px)' }}
                                        />
                                      ) : (
                                        <div>
                                          <div
                                            onClick={() =>
                                              startEdit(event.id, 'description', event.description)
                                            }
                                            className={cn(
                                              'cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded',
                                              compactView ? 'h-8 line-clamp-1' : 'min-h-[60px]',
                                              !compactView &&
                                                !expandedDescriptions[event.id] &&
                                                'line-clamp-2 overflow-hidden'
                                            )}
                                          >
                                            {event.description || 'Click to add description...'}
                                          </div>
                                          {!compactView &&
                                            event.description &&
                                            event.description.length > 100 && (
                                              <button
                                                onClick={e => {
                                                  e.stopPropagation()
                                                  setExpandedDescriptions(prev => ({
                                                    ...prev,
                                                    [event.id]: !prev[event.id]
                                                  }))
                                                }}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 px-2"
                                              >
                                                {expandedDescriptions[event.id]
                                                  ? 'Show less'
                                                  : 'More'}
                                              </button>
                                            )}
                                        </div>
                                      )}
                                    </td>
                                    {(filterType === 'all' || filterType === 'important') && (
                                      <td
                                        className={cn(
                                          'px-4 w-32 max-w-32 align-middle',
                                          compactView ? 'py-1' : 'py-3'
                                        )}
                                      >
                                        {editingField === `${event.id}-category` ? (
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
                                                id: event.id,
                                                data: updateData
                                              })
                                              setEditingField(null)
                                            }}
                                          >
                                            <SelectTrigger className="h-8 border-0 shadow-none focus:ring-1 focus:ring-indigo-500 bg-transparent hover:bg-slate-100 [&>span]:truncate [&>svg]:flex-shrink-0">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
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
                                        ) : (
                                          <div
                                            onClick={() => {
                                              const currentValue =
                                                event.category === 'business' && event.business_id
                                                  ? `business-${event.business_id}`
                                                  : event.category
                                              startEdit(event.id, 'category', currentValue)
                                            }}
                                            className="cursor-pointer text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                          >
                                            {event.business_id
                                              ? getBusinessName(event.business_id)
                                              : event.category?.startsWith('business-')
                                                ? businesses.find(
                                                    b =>
                                                      String(b.id) ===
                                                      event.category.replace('business-', '')
                                                  )?.name || event.category
                                                : event.category === 'health_body'
                                                  ? 'Health'
                                                  : event.category === 'health_mind'
                                                    ? 'Mind'
                                                    : event.category === 'fitness'
                                                      ? 'Fitness'
                                                      : event.category === 'assets'
                                                        ? 'Assets'
                                                        : event.category === 'hobbies'
                                                          ? 'Hobbies'
                                                          : event.category === 'learning'
                                                            ? 'Learning'
                                                            : event.category === 'relationships'
                                                              ? 'Relationships'
                                                              : event.category}
                                          </div>
                                        )}
                                      </td>
                                    )}
                                    <td
                                      className={cn(
                                        'px-4 w-40 align-middle',
                                        compactView ? 'py-1' : 'py-3'
                                      )}
                                    >
                                      {/* Start date with time and reminders - same as in original MainEvents.js */}
                                      {editingField === `${event.id}-start_date` ? (
                                        <div
                                          className="space-y-1"
                                          onBlur={e => {
                                            if (selectOpen) return
                                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                              const timeInput = document.querySelector(
                                                `input[data-time-for="${event.id}"]`
                                              ) as HTMLInputElement | null
                                              const reminders = reminderValues[event.id] || []
                                              saveEdit(event.id, 'start_date', {
                                                start_time: timeInput?.value || null,
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
                                                  `input[data-time-for="${event.id}"]`
                                                ) as HTMLInputElement | null
                                                const reminders = reminderValues[event.id] || []
                                                saveEdit(event.id, 'start_date', {
                                                  start_time: timeInput?.value || null,
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
                                              defaultValue={event.start_time || ''}
                                              data-time-for={event.id}
                                              className="h-8 text-xs flex-1"
                                              placeholder="Time"
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  const timeInput = document.querySelector(
                                                    `input[data-time-for="${event.id}"]`
                                                  ) as HTMLInputElement | null
                                                  const reminders = reminderValues[event.id] || []
                                                  saveEdit(event.id, 'start_date', {
                                                    start_time: timeInput?.value || null,
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
                                                  [event.id]: !prev[event.id]
                                                }))
                                                if (!reminderValues[event.id]) {
                                                  setReminderValues(prev => ({
                                                    ...prev,
                                                    [event.id]: event.reminders || []
                                                  }))
                                                }
                                              }}
                                            >
                                              <Bell className="w-4 h-4" />
                                            </Button>
                                          </div>
                                          {showReminders[event.id] && (
                                            <div className="space-y-1 mt-2">
                                              <div className="text-xs text-slate-600 font-medium">
                                                Reminders:
                                              </div>
                                              {(reminderValues[event.id] || []).map(
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
                                                            ...(reminderValues[event.id] || [])
                                                          ]
                                                          newReminders[idx] = newMinutes
                                                          setReminderValues(prev => ({
                                                            ...prev,
                                                            [event.id]: newReminders
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
                                                            ...(reminderValues[event.id] || [])
                                                          ]
                                                          newReminders[idx] = newMinutes
                                                          setReminderValues(prev => ({
                                                            ...prev,
                                                            [event.id]: newReminders
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
                                                          <SelectItem value="days">Days</SelectItem>
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
                                                      ...(reminderValues[event.id] || []),
                                                      30
                                                    ]
                                                    setReminderValues(prev => ({
                                                      ...prev,
                                                      [event.id]: newReminders
                                                    }))
                                                  }}
                                                  className="flex-1 text-xs"
                                                >
                                                  Add reminder
                                                </Button>
                                                {(reminderValues[event.id] || []).length > 0 && (
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={e => {
                                                      e.stopPropagation()
                                                      const newReminders = reminderValues[
                                                        event.id
                                                      ].slice(0, -1)
                                                      setReminderValues(prev => ({
                                                        ...prev,
                                                        [event.id]: newReminders
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
                                            startEdit(event.id, 'start_date', event.start_date)
                                            setReminderValues(prev => ({
                                              ...prev,
                                              [event.id]: event.reminders || []
                                            }))
                                          }}
                                          onMouseEnter={() => setHoveredStartDate(event.id)}
                                          onMouseLeave={() => setHoveredStartDate(null)}
                                          className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                        >
                                          {event.start_date ? (
                                            <>
                                              <div>{formatDateMedium(event.start_date)}</div>
                                              {!compactView && event.start_time && (
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                  {event.start_time}
                                                </div>
                                              )}
                                              {!compactView &&
                                                event.reminders &&
                                                event.reminders.length > 0 && (
                                                  <div className="text-xs text-slate-500 mt-0.5">
                                                    🔔 {event.reminders.length}
                                                  </div>
                                                )}
                                              {compactView &&
                                                hoveredStartDate === event.id &&
                                                event.start_time && (
                                                  <div className="text-xs text-slate-500 mt-0.5">
                                                    {event.start_time}
                                                  </div>
                                                )}
                                              {compactView &&
                                                hoveredStartDate === event.id &&
                                                event.reminders &&
                                                event.reminders.length > 0 && (
                                                  <div className="text-xs text-slate-500 mt-0.5">
                                                    🔔 {event.reminders.length}
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
                                        'px-4 w-40 align-middle',
                                        compactView ? 'py-1' : 'py-3'
                                      )}
                                    >
                                      {editingField === `${event.id}-end_date` ? (
                                        <div
                                          className="space-y-1"
                                          onBlur={e => {
                                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                              const timeInput = document.querySelector(
                                                `input[data-end-time-for="${event.id}"]`
                                              ) as HTMLInputElement | null
                                              saveEdit(event.id, 'end_date', {
                                                end_time: timeInput?.value || null
                                              })
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
                                                  `input[data-end-time-for="${event.id}"]`
                                                ) as HTMLInputElement | null
                                                saveEdit(event.id, 'end_date', {
                                                  end_time: timeInput?.value || null
                                                })
                                              } else if (e.key === 'Escape') {
                                                setEditingField(null)
                                              }
                                            }}
                                            autoFocus
                                            className="h-8"
                                          />
                                          <Input
                                            type="time"
                                            defaultValue={event.end_time || ''}
                                            data-end-time-for={event.id}
                                            className="h-8 text-xs"
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') {
                                                const timeInput = document.querySelector(
                                                  `input[data-end-time-for="${event.id}"]`
                                                ) as HTMLInputElement | null
                                                saveEdit(event.id, 'end_date', {
                                                  end_time: timeInput?.value || null
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
                                            startEdit(event.id, 'end_date', event.end_date)
                                          }
                                          onMouseEnter={() => setHoveredEndDate(event.id)}
                                          onMouseLeave={() => setHoveredEndDate(null)}
                                          className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                        >
                                          {event.end_date ? (
                                            <>
                                              <div>{formatDateMedium(event.end_date)}</div>
                                              {!compactView && event.end_time && (
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                  {event.end_time}
                                                </div>
                                              )}
                                              {compactView &&
                                                hoveredEndDate === event.id &&
                                                event.end_time && (
                                                  <div className="text-xs text-slate-500 mt-0.5">
                                                    {event.end_time}
                                                  </div>
                                                )}
                                            </>
                                          ) : (
                                            'Optional...'
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td
                                      className={cn(
                                        'px-4 text-center w-20 align-middle',
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
                                                onClick={() => duplicateMutation.mutate(event)}
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
                                                  onClick={() => archiveEvent(event)}
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
                                                  onClick={() => unarchiveEvent(event)}
                                                >
                                                  <Archive className="h-4 w-4 text-slate-600" />
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
                                                onClick={() => deleteMutation.mutate(event.id)}
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
                            ))}
                            {provided.placeholder}
                          </tbody>
                        )}
                      </Droppable>
                    </table>
                  </DragDropContext>
                </div>

                {/* Mobile Card View */}
                <div className="block [@media(min-width:1130px)]:hidden">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="events-mobile">
                      {provided => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {paginatedEvents.map((event, index) => (
                            <Draggable
                              key={event.id}
                              draggableId={event.id}
                              index={index}
                              isDragDisabled={!!sortBy}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    'p-4 space-y-3 border-b-[10px]',
                                    index === 0 && 'border-t-[10px]',
                                    snapshot.isDragging && 'opacity-50'
                                  )}
                                  style={{
                                    borderBottomColor: '#f5f7fb',
                                    borderTopColor: '#f5f7fb',
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  {/* Top Row: Drag Handle, Checkbox (bulk), Star, Title */}
                                  <div className="flex items-start gap-3">
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
                                        checked={selectedEvents.includes(event.id)}
                                        onCheckedChange={() => toggleSelectEvent(event.id)}
                                        className="flex-shrink-0 mt-1"
                                      />
                                    )}
                                    <button
                                      onClick={() => toggleImportant(event)}
                                      className="flex-shrink-0 mt-1"
                                    >
                                      <Star
                                        className={cn(
                                          'w-5 h-5',
                                          event.important
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-slate-300'
                                        )}
                                      />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <Input
                                        value={
                                          editingField === `${event.id}-title`
                                            ? editValue
                                            : event.title
                                        }
                                        onChange={e => {
                                          setEditValue(e.target.value)
                                          setEditingField(`${event.id}-title`)
                                        }}
                                        onBlur={() => {
                                          if (editingField === `${event.id}-title`) {
                                            handleBlur(event.id, 'title')
                                          }
                                        }}
                                        onFocus={() => startEdit(event.id, 'title', event.title)}
                                        maxLength={200}
                                        className="w-full border-0 shadow-none px-0 py-0 h-auto font-medium text-slate-900 focus-visible:ring-0 bg-transparent"
                                      />
                                    </div>
                                  </div>

                                  {/* Expand/Collapse Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpandEvent(event.id)}
                                    className="w-full justify-center gap-2 text-slate-600"
                                  >
                                    {expandedEvents[event.id] ? (
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

                                  {/* Collapsible Details Section */}
                                  {expandedEvents[event.id] && (
                                    <>
                                      {/* Description */}
                                      <Textarea
                                        value={
                                          editingField === `${event.id}-description`
                                            ? editValue
                                            : event.description || ''
                                        }
                                        onChange={e => {
                                          setEditValue(e.target.value)
                                          setEditingField(`${event.id}-description`)
                                        }}
                                        onBlur={() => {
                                          if (editingField === `${event.id}-description`) {
                                            handleBlur(event.id, 'description')
                                          }
                                        }}
                                        onFocus={() =>
                                          startEdit(event.id, 'description', event.description)
                                        }
                                        placeholder="Add description..."
                                        maxLength={5000}
                                        className="border-0 shadow-none px-0 py-0 min-h-[60px] resize-none text-sm text-slate-600 focus-visible:ring-0 bg-transparent"
                                      />

                                      {/* Meta Info Grid */}
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        {(filterType === 'all' || filterType === 'important') && (
                                          <div>
                                            <label className="text-xs text-slate-500 block mb-1">
                                              Category
                                            </label>
                                            <Select
                                              value={
                                                event.category === 'business' && event.business_id
                                                  ? `business-${event.business_id}`
                                                  : event.category
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
                                                  id: event.id,
                                                  data: updateData
                                                })
                                              }}
                                            >
                                              <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="max-w-[calc(100vw-2rem)]">
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
                                      </div>

                                      {/* Dates & Actions */}
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-xs text-slate-500 block mb-1">
                                              Start Date
                                            </label>
                                            <Input
                                              type="date"
                                              value={
                                                editingField === `${event.id}-start_date`
                                                  ? editValue
                                                  : event.start_date || ''
                                              }
                                              onChange={e => {
                                                setEditValue(e.target.value)
                                                setEditingField(`${event.id}-start_date`)
                                              }}
                                              onBlur={() => {
                                                if (editingField === `${event.id}-start_date`) {
                                                  handleBlur(event.id, 'start_date')
                                                }
                                              }}
                                              onFocus={() =>
                                                startEdit(event.id, 'start_date', event.start_date)
                                              }
                                              className="h-9 text-sm"
                                            />
                                            {event.start_time && (
                                              <div className="text-xs text-slate-500 mt-1">
                                                {event.start_time}
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <label className="text-xs text-slate-500 block mb-1">
                                              End Date
                                            </label>
                                            <Input
                                              type="date"
                                              value={
                                                editingField === `${event.id}-end_date`
                                                  ? editValue
                                                  : event.end_date || ''
                                              }
                                              onChange={e => {
                                                setEditValue(e.target.value)
                                                setEditingField(`${event.id}-end_date`)
                                              }}
                                              onBlur={() => {
                                                if (editingField === `${event.id}-end_date`) {
                                                  handleBlur(event.id, 'end_date')
                                                }
                                              }}
                                              onFocus={() =>
                                                startEdit(event.id, 'end_date', event.end_date)
                                              }
                                              className="h-9 text-sm"
                                            />
                                            {event.end_time && (
                                              <div className="text-xs text-slate-500 mt-1">
                                                {event.end_time}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex justify-end">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9"
                                              >
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              {currentTab === 'active' && (
                                                <DropdownMenuItem
                                                  onClick={() => archiveEvent(event)}
                                                >
                                                  <Archive className="h-4 w-4 mr-2" />
                                                  Archive
                                                </DropdownMenuItem>
                                              )}
                                              {currentTab === 'archived' && (
                                                <DropdownMenuItem
                                                  onClick={() => unarchiveEvent(event)}
                                                >
                                                  <Archive className="h-4 w-4 mr-2" />
                                                  Unarchive
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuItem
                                                onClick={() => duplicateMutation.mutate(event)}
                                              >
                                                <Copy className="h-4 w-4 mr-2" />
                                                Duplicate
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => deleteMutation.mutate(event.id)}
                                                className="text-rose-600"
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
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

                {sortedEvents.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 px-4 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-700">Show</span>
                      <Select
                        value={String(perPage)}
                        onValueChange={value => {
                          setPerPage(Number(value))
                          setPage(1)
                        }}
                      >
                        <SelectTrigger className="w-20 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-slate-700">
                        of {sortedEvents.length} entries
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedEvents.length > 0 && bulkMode && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto bg-slate-900 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-full shadow-lg flex items-center justify-between lg:justify-start gap-2 lg:gap-4 z-50">
          <span className="text-xs lg:text-sm font-medium">{selectedEvents.length} selected</span>
          <div className="flex items-center gap-1 lg:gap-2">
            {currentTab === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedEvents, data: { status: 'archived' } })
                }
              >
                <Archive className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Archive</span>
              </Button>
            )}
            {currentTab === 'archived' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedEvents, data: { status: 'active' } })
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
              onClick={() => bulkDeleteMutation.mutate(selectedEvents)}
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
