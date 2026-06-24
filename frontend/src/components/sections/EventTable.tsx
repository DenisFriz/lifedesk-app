import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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
import { formatDateMedium } from '@/components/utils/formatters'
import UsageLimitGate from '@/components/subscription/UsageLimitGate'
import { TablePagination } from '../TablePagination'
import { CategorySelectDialog } from '../CategorySelectDialog'
import { useSound } from '@/contexts/SoundContext'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useEventMutations } from '@/hooks/events/useEventMutations'
import { useEventsQuery } from '@/hooks/events/useEventsQuery'
import { EventRecord } from '@/db'
import { useTableState } from '@/hooks/useTableState'
import { useBusinessesQuery } from '@/hooks/businesses/useBusinessesQuery'

type EventTableProps = {
  category?: string
  businessId?: string
  filterType?: 'all' | 'important' | 'business' | 'category'
}

export default function EventTable({ category, businessId, filterType }: EventTableProps) {
  const { table } = useTableState('eventTableCompactView')

  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showReminders, setShowReminders] = useState({})
  const [reminderValues, setReminderValues] = useState({})
  const [selectOpen, setSelectOpen] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState({})
  const [selectedEvents, setSelectedEvents] = useState([])
  const [expandedEvents, setExpandedEvents] = useState({})
  const [hoveredStartDate, setHoveredStartDate] = useState(null)
  const [hoveredEndDate, setHoveredEndDate] = useState(null)
  const queryClient = useQueryClient()

  const { playSound } = useSound()

  const { canCreate } = useUserLimit()

  const {
    updateMutation,
    createMutation,
    deleteMutation,
    duplicateMutation,
    bulkDeleteMutation,
    bulkUpdateMutation
  } = useEventMutations()

  const { data: allEvents = [] } = useEventsQuery()

  const { data: businesses = [] } = useBusinessesQuery()

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
    .filter(e => e.status === table.currentTab)
    .filter(e => {
      if (!table.searchQuery) return true
      const q = table.searchQuery.toLowerCase()
      return (
        (e.title || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
      )
    })

  const getBusinessName = businessId => {
    const business = businesses.find(b => b.id === businessId)
    return business ? business.name : 'Business'
  }

  const handleUpdateEvent = async ({
    id,
    data,
    editFieldKey
  }: {
    id: string
    data: Record<string, any>
    editFieldKey?: string
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      if (editFieldKey !== undefined) {
        table.setEditingField(prev => (prev === editFieldKey ? null : prev))
      } else {
        table.setEditingField(null)
      }
    }
  }

  const handleCreateEvent = async (data: Record<string, any>) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteMutation.mutateAsync(eventId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDuplicateEvent = async (data: Record<string, any>) => {
    if (!canCreate('events')) return
    try {
      await duplicateMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleBulkDeleteEvents = async (eventIds: string[]) => {
    try {
      await bulkDeleteMutation.mutateAsync(eventIds)
    } catch (e) {
      console.error(e)
    } finally {
      setSelectedEvents([])
    }
  }

  const handleBulkUpdateEvents = async ({
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
      setSelectedEvents([])
    }
  }

  const handleSort = field => {
    if (table.sortBy === field) {
      table.setSortOrder(table.sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      table.setSortBy(field)
      table.setSortOrder('asc')
    }
    table.setPage(1)
  }

  const sortedEvents = [...events].sort((a, b) => {
    if (!table.sortBy) {
      // Default sort by order field
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
      handleUpdateEvent({ id: event.id, data: { order: index } })
    })
  }

  const paginatedEvents = useMemo(() => {
    const startIndex = (table.page - 1) * table.perPage
    return sortedEvents.slice(startIndex, startIndex + table.perPage)
  }, [sortedEvents, table.page, table.perPage])

  const totalPages = Math.ceil(sortedEvents.length / table.perPage)

  const startEdit = (eventId, field, currentValue, secondValue = null) => {
    if (table.blurTimeoutRef.current) {
      clearTimeout(table.blurTimeoutRef.current)
      table.blurTimeoutRef.current = null
    }
    table.setEditingField(`${eventId}-${field}`)
    table.setEditValue(currentValue || '')
    if (secondValue !== null) {
      table.setEditingField(`${eventId}-${field}-time`)
    }
  }

  const saveEdit = (eventId, field, additionalData = {}) => {
    if (table.blurTimeoutRef.current) {
      clearTimeout(table.blurTimeoutRef.current)
      table.blurTimeoutRef.current = null
    }
    handleUpdateEvent({
      id: eventId,
      data: { [field]: table.editValue, ...additionalData },
      editFieldKey: `${eventId}-${field}`
    })
  }

  const handleBlur = (eventId, field, additionalData = {}) => {
    table.blurTimeoutRef.current = setTimeout(() => {
      saveEdit(eventId, field, additionalData)
      table.blurTimeoutRef.current = null
    }, 150)
  }

  const handleKeyDown = (e, eventId, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit(eventId, field)
    } else if (e.key === 'Escape') {
      table.setEditingField(null)
    }
  }

  const toggleImportant = event => {
    handleUpdateEvent({ id: event.id, data: { important: !event.important } })
  }

  const archiveEvent = event => {
    playSound('archived')
    handleUpdateEvent({ id: event.id, data: { status: 'archived' } })
  }

  const unarchiveEvent = event => {
    handleUpdateEvent({ id: event.id, data: { status: 'active' } })
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
      handleCreateEvent(data)
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

    handleCreateEvent(data)
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
    table.setBulkMode(!table.bulkMode)
    if (table.bulkMode) {
      setSelectedEvents([])
    }
  }

  const toggleExpandEvent = eventId => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }))
  }

  const getEventId = (event: EventRecord): string => String(event.serverId || event.id || '')

  return (
    <>
      <CategorySelectDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        businesses={businesses}
        onSelect={handleCategorySelect}
        title="Choose a category"
        description="Please choose a category for the new event."
      />

      <div className="bg-white rounded-xl overflow-hidden mb-6">
        <Tabs value={table.currentTab} onValueChange={table.setCurrentTab}>
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
                  id="event-search"
                  name="eventSearch"
                  placeholder="Search events..."
                  value={table.searchQuery}
                  onChange={e => {
                    table.setSearchQuery(e.target.value)
                    table.setPage(1)
                  }}
                  className="pl-8 h-9 w-48 text-sm"
                />
              </div>
              <UsageLimitGate allowed={canCreate('events')} label="goals">
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
                        localStorage.setItem('eventTableCompactView', JSON.stringify(newValue))
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
            {events.length === 0 ? (
              <div className="p-12 text-center">
                {!canCreate('events') ? (
                  <>
                    <p className="text-slate-500 mb-4">You've reached your events limit</p>
                    <Link to="/upgrade">
                      <Button variant="outline">
                        <Lock className="w-4 h-4 mr-2" />
                        Upgrade to add more
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-slate-500 mb-4">No {table.currentTab} events</p>
                    {table.currentTab === 'active' && (
                      <Button onClick={handleAddNew} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Event
                      </Button>
                    )}
                  </>
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
                          {!table.sortBy && (
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
                          {table.bulkMode && (
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
                            {paginatedEvents
                              .filter(e => !!(e.serverId || e.id))
                              .map((event, index) => {
                                const eventId = getEventId(event)
                                return (
                                  <Draggable
                                    key={eventId}
                                    draggableId={eventId}
                                    index={index}
                                    isDragDisabled={!!table.sortBy}
                                  >
                                    {(provided, snapshot) => (
                                      <tr
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={cn(
                                          'border-b border-slate-100 hover:bg-slate-50',
                                          table.compactView && 'h-12',
                                          snapshot.isDragging && 'opacity-50'
                                        )}
                                      >
                                        {!table.sortBy && (
                                          <td
                                            className={cn(
                                              'pl-3 pr-2 w-10 align-middle cursor-grab active:cursor-grabbing',
                                              table.compactView ? 'py-1' : 'py-3'
                                            )}
                                            {...provided.dragHandleProps}
                                          >
                                            <GripVertical className="w-4 h-4 text-slate-400" />
                                          </td>
                                        )}
                                        <td
                                          className={cn(
                                            'pl-3 pr-2 w-8 align-middle',
                                            table.compactView ? 'py-1' : 'py-3'
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
                                        {table.bulkMode && (
                                          <td
                                            className={cn(
                                              'px-4 text-center w-12 align-middle',
                                              table.compactView ? 'py-1' : 'py-3'
                                            )}
                                          >
                                            <Checkbox
                                              checked={selectedEvents.includes(eventId)}
                                              onCheckedChange={() => toggleSelectEvent(eventId)}
                                            />
                                          </td>
                                        )}
                                        <td
                                          className={cn(
                                            'px-4 align-middle w-64',
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          {table.editingField === `${eventId}-title` ? (
                                            <Input
                                              value={table.editValue}
                                              onChange={e => table.setEditValue(e.target.value)}
                                              onBlur={() => handleBlur(eventId, 'title')}
                                              onKeyDown={e => handleKeyDown(e, eventId, 'title')}
                                              maxLength={200}
                                              autoFocus
                                              className="h-8 w-full"
                                            />
                                          ) : (
                                            <div
                                              onClick={() =>
                                                startEdit(eventId, 'title', event.title)
                                              }
                                              className={cn(
                                                'cursor-text font-medium text-slate-900 hover:bg-slate-100 px-2 py-1 rounded overflow-hidden',
                                                table.compactView
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
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          {table.editingField === `${eventId}-description` ? (
                                            <Textarea
                                              value={table.editValue}
                                              onChange={e => table.setEditValue(e.target.value)}
                                              onBlur={() => handleBlur(eventId, 'description')}
                                              onKeyDown={e =>
                                                handleKeyDown(e, eventId, 'description')
                                              }
                                              maxLength={5000}
                                              autoFocus
                                              className={cn(
                                                'w-full resize-none -mx-2 -my-1',
                                                table.compactView
                                                  ? 'h-8 min-h-0 line-clamp-1 overflow-hidden'
                                                  : 'min-h-[60px]'
                                              )}
                                              style={{ width: 'calc(100% + 16px)' }}
                                            />
                                          ) : (
                                            <div>
                                              <div
                                                onClick={() =>
                                                  startEdit(
                                                    eventId,
                                                    'description',
                                                    event.description
                                                  )
                                                }
                                                className={cn(
                                                  'cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded',
                                                  table.compactView
                                                    ? 'h-8 line-clamp-1'
                                                    : 'min-h-[60px]',
                                                  !table.compactView &&
                                                    !expandedDescriptions[eventId] &&
                                                    'line-clamp-2 overflow-hidden'
                                                )}
                                              >
                                                {event.description || 'Click to add description...'}
                                              </div>
                                              {!table.compactView &&
                                                event.description &&
                                                event.description.length > 100 && (
                                                  <button
                                                    onClick={e => {
                                                      e.stopPropagation()
                                                      setExpandedDescriptions(prev => ({
                                                        ...prev,
                                                        [eventId]: !prev[eventId]
                                                      }))
                                                    }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700 px-2"
                                                  >
                                                    {expandedDescriptions[eventId]
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
                                              table.compactView ? 'py-1' : 'py-3'
                                            )}
                                          >
                                            {table.editingField === `${eventId}-category` ? (
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
                                                  handleUpdateEvent({
                                                    id: eventId,
                                                    data: updateData
                                                  })
                                                  table.setEditingField(null)
                                                }}
                                              >
                                                <SelectTrigger className="h-8 border-0 shadow-none focus:ring-1 focus:ring-indigo-500 bg-transparent hover:bg-slate-100 [&>span]:truncate [&>svg]:flex-shrink-0">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
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
                                            ) : (
                                              <div
                                                onClick={() => {
                                                  const currentValue =
                                                    event.category === 'business' &&
                                                    event.business_id
                                                      ? `business-${event.business_id}`
                                                      : event.category
                                                  startEdit(eventId, 'category', currentValue)
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
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          {/* Start date with time and reminders - same as in original MainEvents.js */}
                                          {table.editingField === `${eventId}-start_date` ? (
                                            <div
                                              className="space-y-1"
                                              onBlur={e => {
                                                if (selectOpen) return
                                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                                  const timeInput = document.querySelector(
                                                    `input[data-time-for="${eventId}"]`
                                                  ) as HTMLInputElement | null
                                                  const reminders = reminderValues[eventId] || []
                                                  saveEdit(eventId, 'start_date', {
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
                                                value={table.editValue}
                                                onChange={e => table.setEditValue(e.target.value)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    const timeInput = document.querySelector(
                                                      `input[data-time-for="${eventId}"]`
                                                    ) as HTMLInputElement | null
                                                    const reminders = reminderValues[eventId] || []
                                                    saveEdit(eventId, 'start_date', {
                                                      start_time: timeInput?.value || null,
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
                                                  defaultValue={event.start_time || ''}
                                                  data-time-for={eventId}
                                                  className="h-8 text-xs flex-1"
                                                  placeholder="Time"
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                      const timeInput = document.querySelector(
                                                        `input[data-time-for="${eventId}"]`
                                                      ) as HTMLInputElement | null
                                                      const reminders =
                                                        reminderValues[eventId] || []
                                                      saveEdit(eventId, 'start_date', {
                                                        start_time: timeInput?.value || null,
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
                                                      [eventId]: !prev[eventId]
                                                    }))
                                                    if (!reminderValues[eventId]) {
                                                      setReminderValues(prev => ({
                                                        ...prev,
                                                        [eventId]: event.reminders || []
                                                      }))
                                                    }
                                                  }}
                                                >
                                                  <Bell className="w-4 h-4" />
                                                </Button>
                                              </div>
                                              {showReminders[eventId] && (
                                                <div className="space-y-1 mt-2">
                                                  <div className="text-xs text-slate-600 font-medium">
                                                    Reminders:
                                                  </div>
                                                  {(reminderValues[eventId] || []).map(
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
                                                                ...(reminderValues[eventId] || [])
                                                              ]
                                                              newReminders[idx] = newMinutes
                                                              setReminderValues(prev => ({
                                                                ...prev,
                                                                [eventId]: newReminders
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
                                                                ...(reminderValues[eventId] || [])
                                                              ]
                                                              newReminders[idx] = newMinutes
                                                              setReminderValues(prev => ({
                                                                ...prev,
                                                                [eventId]: newReminders
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
                                                          ...(reminderValues[eventId] || []),
                                                          30
                                                        ]
                                                        setReminderValues(prev => ({
                                                          ...prev,
                                                          [eventId]: newReminders
                                                        }))
                                                      }}
                                                      className="flex-1 text-xs"
                                                    >
                                                      Add reminder
                                                    </Button>
                                                    {(reminderValues[eventId] || []).length > 0 && (
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={e => {
                                                          e.stopPropagation()
                                                          const newReminders = reminderValues[
                                                            eventId
                                                          ].slice(0, -1)
                                                          setReminderValues(prev => ({
                                                            ...prev,
                                                            [eventId]: newReminders
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
                                                startEdit(eventId, 'start_date', event.start_date)
                                                setReminderValues(prev => ({
                                                  ...prev,
                                                  [eventId]: event.reminders || []
                                                }))
                                              }}
                                              onMouseEnter={() => setHoveredStartDate(eventId)}
                                              onMouseLeave={() => setHoveredStartDate(null)}
                                              className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                            >
                                              {event.start_date ? (
                                                <>
                                                  <div>{formatDateMedium(event.start_date)}</div>
                                                  {!table.compactView && event.start_time && (
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                      {event.start_time}
                                                    </div>
                                                  )}
                                                  {!table.compactView &&
                                                    event.reminders &&
                                                    event.reminders.length > 0 && (
                                                      <div className="text-xs text-slate-500 mt-0.5">
                                                        🔔 {event.reminders.length}
                                                      </div>
                                                    )}
                                                  {table.compactView &&
                                                    hoveredStartDate === eventId &&
                                                    event.start_time && (
                                                      <div className="text-xs text-slate-500 mt-0.5">
                                                        {event.start_time}
                                                      </div>
                                                    )}
                                                  {table.compactView &&
                                                    hoveredStartDate === eventId &&
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
                                            table.compactView ? 'py-1' : 'py-3'
                                          )}
                                        >
                                          {table.editingField === `${eventId}-end_date` ? (
                                            <div
                                              className="space-y-1"
                                              onBlur={e => {
                                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                                  const timeInput = document.querySelector(
                                                    `input[data-end-time-for="${eventId}"]`
                                                  ) as HTMLInputElement | null
                                                  saveEdit(eventId, 'end_date', {
                                                    end_time: timeInput?.value || null
                                                  })
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
                                                      `input[data-end-time-for="${eventId}"]`
                                                    ) as HTMLInputElement | null
                                                    saveEdit(eventId, 'end_date', {
                                                      end_time: timeInput?.value || null
                                                    })
                                                  } else if (e.key === 'Escape') {
                                                    table.setEditingField(null)
                                                  }
                                                }}
                                                autoFocus
                                                className="h-8"
                                              />
                                              <Input
                                                type="time"
                                                defaultValue={event.end_time || ''}
                                                data-end-time-for={eventId}
                                                className="h-8 text-xs"
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    const timeInput = document.querySelector(
                                                      `input[data-end-time-for="${eventId}"]`
                                                    ) as HTMLInputElement | null
                                                    saveEdit(eventId, 'end_date', {
                                                      end_time: timeInput?.value || null
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
                                                startEdit(eventId, 'end_date', event.end_date)
                                              }
                                              onMouseEnter={() => setHoveredEndDate(eventId)}
                                              onMouseLeave={() => setHoveredEndDate(null)}
                                              className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                                            >
                                              {event.end_date ? (
                                                <>
                                                  <div>{formatDateMedium(event.end_date)}</div>
                                                  {!table.compactView && event.end_time && (
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                      {event.end_time}
                                                    </div>
                                                  )}
                                                  {table.compactView &&
                                                    hoveredEndDate === eventId &&
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
                                                    onClick={() => handleDuplicateEvent(event)}
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
                                                      onClick={() => archiveEvent(event)}
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
                                                    onClick={() => handleDeleteEvent(eventId)}
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

                {/* Mobile Card View */}
                <div className="block [@media(min-width:1130px)]:hidden">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="events-mobile">
                      {provided => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {paginatedEvents
                            .filter(e => !!(e.serverId || e.id))
                            .map((event, index) => {
                              const eventId = getEventId(event)
                              return (
                                <Draggable
                                  key={eventId}
                                  draggableId={eventId}
                                  index={index}
                                  isDragDisabled={!!table.sortBy}
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
                                            checked={selectedEvents.includes(eventId)}
                                            onCheckedChange={() => toggleSelectEvent(eventId)}
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
                                              table.editingField === `${eventId}-title`
                                                ? table.editValue
                                                : event.title
                                            }
                                            onChange={e => {
                                              table.setEditValue(e.target.value)
                                              table.setEditingField(`${eventId}-title`)
                                            }}
                                            onBlur={() => {
                                              if (table.editingField === `${eventId}-title`) {
                                                handleBlur(eventId, 'title')
                                              }
                                            }}
                                            onFocus={() => startEdit(eventId, 'title', event.title)}
                                            maxLength={200}
                                            className="w-full border-0 shadow-none px-0 py-0 h-auto font-medium text-slate-900 focus-visible:ring-0 bg-transparent"
                                          />
                                        </div>
                                      </div>

                                      {/* Expand/Collapse Button */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpandEvent(eventId)}
                                        className="w-full justify-center gap-2 text-slate-600"
                                      >
                                        {expandedEvents[eventId] ? (
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
                                      {expandedEvents[eventId] && (
                                        <>
                                          {/* Description */}
                                          <Textarea
                                            value={
                                              table.editingField === `${eventId}-description`
                                                ? table.editValue
                                                : event.description || ''
                                            }
                                            onChange={e => {
                                              table.setEditValue(e.target.value)
                                              table.setEditingField(`${eventId}-description`)
                                            }}
                                            onBlur={() => {
                                              if (table.editingField === `${eventId}-description`) {
                                                handleBlur(eventId, 'description')
                                              }
                                            }}
                                            onFocus={() =>
                                              startEdit(eventId, 'description', event.description)
                                            }
                                            placeholder="Add description..."
                                            maxLength={5000}
                                            className="border-0 shadow-none px-0 py-0 min-h-[60px] resize-none text-sm text-slate-600 focus-visible:ring-0 bg-transparent"
                                          />

                                          {/* Meta Info Grid */}
                                          <div className="grid grid-cols-2 gap-2 text-sm">
                                            {(filterType === 'all' ||
                                              filterType === 'important') && (
                                              <div>
                                                <label className="text-xs text-slate-500 block mb-1">
                                                  Category
                                                </label>
                                                <Select
                                                  value={
                                                    event.category === 'business' &&
                                                    event.business_id
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
                                                    handleUpdateEvent({
                                                      id: eventId,
                                                      data: updateData
                                                    })
                                                  }}
                                                >
                                                  <SelectTrigger className="h-9 text-sm">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="max-w-[calc(100vw-2rem)]">
                                                    <SelectItem value="assets">Assets</SelectItem>
                                                    <SelectItem value="health_body">
                                                      Health
                                                    </SelectItem>
                                                    <SelectItem value="fitness">Fitness</SelectItem>
                                                    <SelectItem value="hobbies">Hobbies</SelectItem>
                                                    <SelectItem value="learning">
                                                      Learning
                                                    </SelectItem>
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <div>
                                                <label className="text-xs text-slate-500 block mb-1">
                                                  Start Date
                                                </label>
                                                <Input
                                                  type="date"
                                                  value={
                                                    table.editingField === `${eventId}-start_date`
                                                      ? table.editValue
                                                      : event.start_date || ''
                                                  }
                                                  onChange={e => {
                                                    table.setEditValue(e.target.value)
                                                    table.setEditingField(`${eventId}-start_date`)
                                                  }}
                                                  onBlur={() => {
                                                    if (
                                                      table.editingField === `${eventId}-start_date`
                                                    ) {
                                                      handleBlur(eventId, 'start_date')
                                                    }
                                                  }}
                                                  onFocus={() =>
                                                    startEdit(
                                                      eventId,
                                                      'start_date',
                                                      event.start_date
                                                    )
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
                                                    table.editingField === `${eventId}-end_date`
                                                      ? table.editValue
                                                      : event.end_date || ''
                                                  }
                                                  onChange={e => {
                                                    table.setEditValue(e.target.value)
                                                    table.setEditingField(`${eventId}-end_date`)
                                                  }}
                                                  onBlur={() => {
                                                    if (
                                                      table.editingField === `${eventId}-end_date`
                                                    ) {
                                                      handleBlur(eventId, 'end_date')
                                                    }
                                                  }}
                                                  onFocus={() =>
                                                    startEdit(eventId, 'end_date', event.end_date)
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
                                                  {table.currentTab === 'active' && (
                                                    <DropdownMenuItem
                                                      onClick={() => archiveEvent(event)}
                                                    >
                                                      <Archive className="h-4 w-4 mr-2" />
                                                      Archive
                                                    </DropdownMenuItem>
                                                  )}
                                                  {table.currentTab === 'archived' && (
                                                    <DropdownMenuItem
                                                      onClick={() => unarchiveEvent(event)}
                                                    >
                                                      <Archive className="h-4 w-4 mr-2" />
                                                      Unarchive
                                                    </DropdownMenuItem>
                                                  )}
                                                  <DropdownMenuItem
                                                    onClick={() => handleDuplicateEvent(event)}
                                                  >
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicate
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => handleDeleteEvent(eventId)}
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
                              )
                            })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>

                {sortedEvents.length > 0 && (
                  <TablePagination
                    totalItems={sortedEvents.length}
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

      {selectedEvents.length > 0 && table.bulkMode && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto bg-slate-900 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-full shadow-lg flex items-center justify-between lg:justify-start gap-2 lg:gap-4 z-50">
          <span className="text-xs lg:text-sm font-medium">{selectedEvents.length} selected</span>
          <div className="flex items-center gap-1 lg:gap-2">
            {table.currentTab === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  handleBulkUpdateEvents({ ids: selectedEvents, data: { status: 'archived' } })
                }
              >
                <Archive className="w-4 h-4 lg:mr-1" />
                <span className="hidden lg:inline">Archive</span>
              </Button>
            )}
            {table.currentTab === 'archived' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
                onClick={() =>
                  handleBulkUpdateEvents({ ids: selectedEvents, data: { status: 'active' } })
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
              onClick={() => handleBulkDeleteEvents(selectedEvents)}
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
