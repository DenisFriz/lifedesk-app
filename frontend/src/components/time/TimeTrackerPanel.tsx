import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, X, Trash2, Edit2, Check, Info, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useTimeTracker } from './TimeTrackerContext'
import { useLayout } from '../../Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubscription } from '@/hooks/useSubscription'
import { Link } from 'react-router-dom'
import { TimeEntry } from '@/types/entities'

interface TimeTrackerPanelProps {
  collapsed: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

interface Section {
  id: string
  label: string
  sectionPath: string
  businessId?: string
}

interface Business {
  id: string
  name: string
  order?: number
}

export default function TimeTrackerPanel({ collapsed, isOpen, setIsOpen }: TimeTrackerPanelProps) {
  const {
    runningEntry: contextRunningEntry,
    stopTimerMutation,
    isPaused,
    elapsedTime,
    handlePause,
    handleResume
  } = useTimeTracker()

  const [description, setDescription] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState<string>('')
  const [editSection, setEditSection] = useState<string>('')
  const [editClient, setEditClient] = useState<string>('')
  const [editProject, setEditProject] = useState<string>('')
  const [editNotes, setEditNotes] = useState<string>('')
  const [editDate, setEditDate] = useState<string>('')
  const [editStartTime, setEditStartTime] = useState<string>('')
  const [editEndTime, setEditEndTime] = useState<string>('')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('')
  const [filterProject, setFilterProject] = useState<string>('')
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('timeTrackerPanelWidth')
    return saved ? parseInt(saved) : 320
  })
  const panelRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const originalTitleRef = useRef<string>(document.title)
  const originalFaviconRef = useRef<string | null>(null)

  const { isHidden } = useLayout()
  const { limit } = useSubscription()

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => backend.entities.Client.list('-updated_date')
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => backend.entities.Project.list('-updated_date')
  })

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order')
  })

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => backend.entities.TimeEntry.filter({ is_running: false }, '-created_date', 50)
  })

  // Refresh clients, projects, and businesses when panel opens
  useEffect(() => {
    if (isOpen) {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    }
  }, [isOpen, queryClient])

  const runningEntry = contextRunningEntry

  const createEntryMutation = useMutation({
    mutationFn: (data: Record<string, any>) => backend.entities.TimeEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runningTimeEntry'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    }
  })

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      backend.entities.TimeEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setEditingEntryId(null)
      toast.success('Entry updated')
    }
  })

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => backend.entities.TimeEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      toast.success('Entry deleted')
    }
  })

  const resumeEntryMutation = useMutation({
    mutationFn: (entry: any) => {
      const now = new Date()
      return backend.entities.TimeEntry.update(entry.id, {
        date: format(now, 'yyyy-MM-dd'),
        start_time: format(now, 'HH:mm:ss'),
        end_time: null,
        is_running: true
      })
    },
    onSuccess: (_, entry) => {
      queryClient.invalidateQueries({ queryKey: ['runningTimeEntry'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setDescription(entry.description || '')
      setSelectedSection(entry.section_id || '')
      setSelectedClient(entry.client_id || '')
      setSelectedProject(entry.project_id || '')
      toast.success('Timer resumed')
    }
  })

  // Load last used client/project from localStorage
  useEffect(() => {
    const lastClient = localStorage.getItem('lastUsedClient')
    const lastProject = localStorage.getItem('lastUsedProject')
    if (lastClient) setSelectedClient(lastClient)
    if (lastProject) setSelectedProject(lastProject)
  }, [])

  useEffect(() => {
    if (runningEntry) {
      setDescription(runningEntry.description || '')
      setNotes(runningEntry.notes || '')
      setSelectedClient(runningEntry.client_id || '')
      setSelectedProject(runningEntry.project_id || '')
    }
  }, [runningEntry])

  useEffect(() => {
    // Capture the current favicon URL so we can restore it later
    const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null

    originalFaviconRef.current = existingLink
      ? existingLink.href
      : 'https://data.lifedesk.me/images/lifedesk-task-finance-health-business-manager-favicon.webp?v=4'

    // Capture clean title without any timer prefix
    const currentTitle = document.title
    if (currentTitle.startsWith('⏱️')) {
      // Extract clean title from timer format "⏱️ 00:00:00 - Original Title"
      const parts = currentTitle.split(' - ')
      originalTitleRef.current = parts.slice(1).join(' - ') || 'LifeOS'
    } else {
      originalTitleRef.current = currentTitle
    }

    return () => {
      // Reset title and favicon on unmount
      document.title = originalTitleRef.current
      if (originalFaviconRef.current) {
        const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
        if (faviconLink) faviconLink.href = originalFaviconRef.current
      }
    }
  }, [])

  // Update browser tab title and favicon when timer is running
  useEffect(() => {
    if (runningEntry && !isPaused) {
      // Always use the stored clean title
      document.title = `⏱️ ${formatTime(elapsedTime)} - ${originalTitleRef.current}`

      // Change favicon to green dot
      const link = (document.querySelector("link[rel*='icon']") ||
        document.createElement('link')) as HTMLLinkElement
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href =
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%2310b981"/></svg>'
      document.getElementsByTagName('head')[0].appendChild(link)
    } else {
      document.title = originalTitleRef.current

      // Reset favicon
      if (originalFaviconRef.current) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
        if (link) {
          link.href = originalFaviconRef.current
        }
      }
    }
  }, [runningEntry, isPaused, elapsedTime])

  const handleStart = (): void => {
    const now = new Date()
    const timeString = format(now, 'HH:mm:ss')
    const dateString = format(now, 'yyyy-MM-dd')

    localStorage.setItem('lastUsedClient', selectedClient)
    localStorage.setItem('lastUsedProject', selectedProject)

    createEntryMutation.mutate({
      date: dateString,
      start_time: timeString,
      description: description,
      notes: notes || null,
      section_id: selectedSection || null,
      client_id: selectedClient || null,
      project_id: selectedProject || null,
      is_running: true
    })

    // Show toast notification
    toast.success('⏱️ Time tracker started', {
      description: description || 'Tracking time...'
    })
  }

  const handleStop = (): void => {
    if (!runningEntry) return

    stopTimerMutation.mutate(runningEntry.id)
    setDescription('')
    setNotes('')

    // Show toast notification
    toast.success('⏹️ Time tracker stopped', {
      description: `Tracked ${formatTime(elapsedTime)}`
    })
  }

  // Get sidebar width - use collapsed prop directly for reactivity

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get available sections (same as notes tabs)
  const getOrderedCategories = (): Section[] => {
    const categories = [
      { id: 'assets', label: 'Assets', sectionPath: 'Private > Assets' },
      { id: 'health_body', label: 'Health', sectionPath: 'Private > Health' },
      { id: 'fitness', label: 'Fitness', sectionPath: 'Private > Fitness' },
      { id: 'hobbies', label: 'Hobbies', sectionPath: 'Private > Hobbies' },
      { id: 'learning', label: 'Learning', sectionPath: 'Private > Learning & Development' },
      { id: 'relationships', label: 'Relationships', sectionPath: 'Private > Relationships' }
    ]

    const saved = localStorage.getItem('subsectionOrder')
    const subsectionOrder = saved ? JSON.parse(saved) : {}
    const privateOrder = subsectionOrder['Private'] || []

    if (privateOrder.length === 0) return categories

    return [...categories].sort((a, b) => {
      const nameA = a.sectionPath.replace('Private > ', '')
      const nameB = b.sectionPath.replace('Private > ', '')
      const indexA = privateOrder.indexOf(nameA)
      const indexB = privateOrder.indexOf(nameB)

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })
  }

  const getOrderedBusinesses = (): Business[] => {
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

  // Determine order of Business vs Private based on sidebar section order
  const getSectionOrder = (): string[] => {
    const saved = localStorage.getItem('sectionOrder')
    return saved ? JSON.parse(saved) : []
  }

  const sectionOrder = getSectionOrder()
  const businessIndex = sectionOrder.indexOf('Business')
  const privateIndex = sectionOrder.indexOf('Private')
  const businessBeforePrivate =
    businessIndex !== -1 && privateIndex !== -1 && businessIndex < privateIndex

  const privateSections = orderedCategories
  const businessSections = orderedBusinesses.map(b => ({
    id: `business-${b.id}`,
    label: b.name,
    sectionPath: `Business > ${b.name}`,
    businessId: b.id
  }))

  const allSections = [
    { id: 'general', label: 'General', sectionPath: 'Home' },
    ...(businessBeforePrivate
      ? [...businessSections, ...privateSections]
      : [...privateSections, ...businessSections])
  ].filter(section => !isHidden(section.sectionPath))

  // Determine if selected section is a business
  const selectedSectionData = allSections.find(s => s.id === selectedSection)
  const isBusinessSelected = selectedSectionData?.businessId
  const selectedBusinessId = selectedSectionData?.businessId

  // Filter clients and projects by selected business
  const filteredClients = isBusinessSelected
    ? clients.filter(c => c.business_id === selectedBusinessId)
    : []

  const filteredProjects =
    isBusinessSelected && selectedClient
      ? projects.filter(p => p.business_id === selectedBusinessId && p.client_id === selectedClient)
      : isBusinessSelected
        ? projects.filter(p => p.business_id === selectedBusinessId)
        : []

  const handleEditEntry = (entry: TimeEntry): void => {
    setEditingEntryId(entry.id)
    setEditDescription(entry.description || '')
    setEditNotes(entry.notes || '')
    setEditSection(entry.section_id || '')
    setEditClient(entry.client_id || '')
    setEditProject(entry.project_id || '')
    setEditDate(entry.date || '')
    setEditStartTime(entry.start_time || '')
    setEditEndTime(entry.end_time || '')
  }

  const handleSaveEdit = (entryId: string): void => {
    // Calculate duration from start and end times
    let duration = null
    if (editStartTime && editEndTime) {
      const [startH, startM, startS] = editStartTime.split(':').map(Number)
      const [endH, endM, endS] = editEndTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM + (startS || 0) / 60
      const endMinutes = endH * 60 + endM + (endS || 0) / 60
      duration = Math.round(endMinutes - startMinutes)
    }

    updateEntryMutation.mutate({
      id: entryId,
      data: {
        description: editDescription,
        notes: editNotes || null,
        section_id: editSection || null,
        client_id: editClient || null,
        project_id: editProject || null,
        date: editDate,
        start_time: editStartTime,
        end_time: editEndTime,
        duration: duration
      }
    })
  }

  const handleDeleteEntry = (entryId: string): void => {
    if (confirm('Delete this time entry?')) {
      deleteEntryMutation.mutate(entryId)
    }
  }

  const handleResumeEntry = (entry: TimeEntry): void => {
    resumeEntryMutation.mutate(entry)
  }

  const getClientName = (clientId: string | undefined): string => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || ''
  }

  const getProjectName = (projectId: string | undefined): string => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || ''
  }

  const getSectionName = (sectionId: string | undefined): string => {
    const section = allSections.find(s => s.id === sectionId)
    return section?.label || ''
  }

  const formatDuration = (duration: number | undefined): string => {
    if (!duration) return '00:00'
    const hours = Math.floor(duration / 60)
    const minutes = Math.round(duration % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Determine if filtered section is a business
  const filterSectionData = allSections.find(s => s.id === filterSection)
  const isFilterBusinessSelected = filterSectionData?.businessId
  const filterBusinessId = filterSectionData?.businessId

  // Determine if edit section is a business
  const editSectionData = allSections.find(s => s.id === editSection)
  const isEditBusinessSelected = editSectionData?.businessId
  const editBusinessId = editSectionData?.businessId

  // Filter clients and projects by edit section business
  const editSectionClients = isEditBusinessSelected
    ? clients.filter(c => c.business_id === editBusinessId)
    : []

  const editSectionProjects =
    isEditBusinessSelected && editClient
      ? projects.filter(p => p.business_id === editBusinessId && p.client_id === editClient)
      : isEditBusinessSelected
        ? projects.filter(p => p.business_id === editBusinessId)
        : []

  // Filter clients and projects by filter section business
  const filterSectionClients = isFilterBusinessSelected
    ? clients.filter(c => c.business_id === filterBusinessId)
    : []

  const filterSectionProjects =
    isFilterBusinessSelected && filterClient
      ? projects.filter(p => p.business_id === filterBusinessId && p.client_id === filterClient)
      : isFilterBusinessSelected
        ? projects.filter(p => p.business_id === filterBusinessId)
        : []

  // Filter time entries based on selected options
  const filteredTimeEntries = timeEntries.filter(entry => {
    // Filter by section
    if (filterSection !== 'all') {
      if (entry.section_id !== filterSection) return false
    }

    // Filter by client (only if business section selected)
    if (isFilterBusinessSelected && filterClient && filterClient !== '_none') {
      if (entry.client_id !== filterClient) return false
    }

    // Filter by project (only if business section selected)
    if (isFilterBusinessSelected && filterProject && filterProject !== '_none') {
      if (entry.project_id !== filterProject) return false
    }

    return true
  })

  const sidebarWidth = collapsed ? 64 : 256

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-30 hidden lg:block"
            style={{ left: `${sidebarWidth}px` }}
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: -panelWidth, left: sidebarWidth }}
            animate={{ x: 0, left: sidebarWidth }}
            exit={{ x: -panelWidth }}
            transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
            className="fixed top-0 h-full bg-white shadow-2xl z-40 flex flex-col border-r border-slate-200 p-4 hidden lg:flex"
            style={{ width: `${panelWidth}px` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Time Tracker</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {runningEntry && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg space-y-2">
                <div className="text-2xl font-mono font-bold text-slate-900 text-center">
                  {formatTime(elapsedTime)}
                </div>
                <div className="flex gap-2">
                  {!isPaused ? (
                    <Button onClick={handlePause} size="sm" variant="outline" className="flex-1">
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={handleResume} size="sm" variant="outline" className="flex-1">
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  <Button onClick={handleStop} size="sm" variant="destructive" className="flex-1">
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Input
                placeholder="What are you working on?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={!!runningEntry}
              />
              <Textarea
                placeholder="Notes / tasks completed..."
                value={notes}
                onChange={e => {
                  setNotes(e.target.value)
                  if (runningEntry) {
                    backend.entities.TimeEntry.update(runningEntry.id, { notes: e.target.value })
                  }
                }}
                className="text-xs resize-none h-16"
              />

              <Select
                value={selectedSection}
                onValueChange={value => {
                  setSelectedSection(value)
                  // Reset client and project when section changes
                  setSelectedClient('')
                  setSelectedProject('')
                }}
                disabled={!!runningEntry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {allSections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isBusinessSelected && (
                <>
                  <Select
                    value={selectedClient}
                    onValueChange={value => {
                      setSelectedClient(value)
                      // Reset project when client changes
                      setSelectedProject('')
                    }}
                    disabled={!!runningEntry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No client</SelectItem>
                      {filteredClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                    disabled={!!runningEntry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No project</SelectItem>
                      {filteredProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {!runningEntry &&
                (() => {
                  const entriesLimit = limit('time_tracker_entries_limit')
                  const totalEntries = timeEntries.length
                  const isAtLimit = entriesLimit !== Infinity && totalEntries >= entriesLimit
                  return isAtLimit ? (
                    <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span>Limit of {entriesLimit} entries reached. </span>
                      <Link
                        to="/Upgrade"
                        onClick={() => setIsOpen(false)}
                        className="underline text-amber-700 whitespace-nowrap"
                      >
                        Upgrade
                      </Link>
                    </div>
                  ) : (
                    <>
                      {entriesLimit !== Infinity && (
                        <p className="text-xs text-slate-400 text-right">
                          {totalEntries} / {entriesLimit} entries
                        </p>
                      )}
                      <Button
                        onClick={handleStart}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Timer
                      </Button>
                    </>
                  )
                })()}
            </div>

            {/* Recent Time Entries */}
            <div className="mt-4 border-t border-slate-200 pt-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-700">Recent Entries</h4>
                <Select
                  value={filterSection}
                  onValueChange={value => {
                    setFilterSection(value)
                    setFilterClient('')
                    setFilterProject('')
                  }}
                >
                  <SelectTrigger className="h-6 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {allSections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isFilterBusinessSelected && (
                <div className="space-y-2 mb-2">
                  <Select
                    value={filterClient}
                    onValueChange={value => {
                      setFilterClient(value)
                      setFilterProject('')
                    }}
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue placeholder="Filter by client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">All clients</SelectItem>
                      {filterSectionClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue placeholder="Filter by project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">All projects</SelectItem>
                      {filterSectionProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {filteredTimeEntries.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No time entries yet</p>
                  ) : (
                    filteredTimeEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="bg-slate-50 rounded-lg p-2 text-xs space-y-1 overflow-hidden"
                      >
                        {editingEntryId === entry.id ? (
                          <div className="space-y-2 flex-1">
                            <Input
                              value={editDescription}
                              onChange={e => setEditDescription(e.target.value)}
                              className="h-6 text-xs"
                              placeholder="Description"
                              autoFocus
                            />
                            <Textarea
                              value={editNotes}
                              onChange={e => setEditNotes(e.target.value)}
                              className="text-xs resize-none h-14"
                              placeholder="Notes..."
                            />
                            <Input
                              type="date"
                              value={editDate}
                              onChange={e => setEditDate(e.target.value)}
                              className="h-6 text-xs w-full"
                            />
                            <Input
                              type="time"
                              value={editStartTime}
                              onChange={e => setEditStartTime(e.target.value)}
                              className="h-6 text-xs w-full"
                              placeholder="Start time"
                            />
                            <Input
                              type="time"
                              value={editEndTime}
                              onChange={e => setEditEndTime(e.target.value)}
                              className="h-6 text-xs w-full"
                              placeholder="End time"
                            />
                            <Select
                              value={editSection}
                              onValueChange={value => {
                                setEditSection(value)
                                setEditClient('')
                                setEditProject('')
                              }}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                              <SelectContent>
                                {allSections.map(section => (
                                  <SelectItem key={section.id} value={section.id}>
                                    {section.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isEditBusinessSelected && (
                              <>
                                <Select
                                  value={editClient}
                                  onValueChange={value => {
                                    setEditClient(value)
                                    setEditProject('')
                                  }}
                                >
                                  <SelectTrigger className="h-6 text-xs">
                                    <SelectValue placeholder="Select client" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">No client</SelectItem>
                                    {editSectionClients.map(client => (
                                      <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select value={editProject} onValueChange={setEditProject}>
                                  <SelectTrigger className="h-6 text-xs">
                                    <SelectValue placeholder="Select project" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">No project</SelectItem>
                                    {editSectionProjects.map(project => (
                                      <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => setEditingEntryId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => handleSaveEdit(entry.id)}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2" style={{ width: '100%' }}>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="font-medium text-slate-900 truncate leading-tight">
                                {entry.description || 'No description'}
                              </p>
                              {entry.notes && (
                                <p className="text-slate-500 truncate text-[10px] mt-0.5">
                                  {entry.notes}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-slate-600 mt-0.5">
                                <span>{format(new Date(entry.date), 'MMM d')}</span>
                                <span>•</span>
                                <span>{formatDuration(entry.duration)}</span>
                              </div>
                              {entry.section_id &&
                                (filterSection === 'all' || filterSection !== entry.section_id) && (
                                  <div className="text-slate-500 mt-0.5 text-[10px] truncate">
                                    {getSectionName(entry.section_id)}
                                  </div>
                                )}
                              {(entry.client_id || entry.project_id) && (
                                <div className="text-slate-500 mt-0.5 truncate text-[10px]">
                                  {getClientName(entry.client_id)}
                                  {entry.client_id && entry.project_id && ' / '}
                                  {getProjectName(entry.project_id)}
                                </div>
                              )}
                            </div>
                            <div
                              className="flex gap-1 flex-shrink-0 items-start"
                              style={{ opacity: 1, visibility: 'visible' }}
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                style={{ opacity: 1, visibility: 'visible' }}
                                onClick={() => handleResumeEntry(entry)}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                style={{ opacity: 1, visibility: 'visible' }}
                                onClick={() => handleEditEntry(entry)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-red-600 hover:text-red-700"
                                style={{ opacity: 1, visibility: 'visible' }}
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total Duration */}
              {filteredTimeEntries.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">Total</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Time format: HH:MM (hours:minutes)</p>
                          <p className="text-xs mt-1">
                            Duration is stored in minutes and rounded to the nearest minute. Entries
                            shorter than 1 minute are saved as 1 minute.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatDuration(
                      filteredTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
                    )}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
