import React, { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
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
import { Plus, Trash2, ArrowUpDown, ListChecks, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useProjectsQuery } from '@/hooks/projects/useProjectsQuery'
import { useProjectMutations } from '@/hooks/projects/useProjectMutations'
import { ProjectRecord } from '@/db'
import { CreateProjectInput } from '@/repositories/project.repository'
import { useUserLimit } from '@/contexts/UserLimitContext'

const statusColors = {
  planning: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700'
} as const

type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'

interface ProjectTableProps {
  businessId?: string
}

export default function ProjectTable({ businessId }: ProjectTableProps) {
  const [projectValues, setProjectValues] = useState<Record<string, any>>({})
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)

  const { canCreate, data: userLimits } = useUserLimit()

  const isOverLimit = !canCreate('projects')

  const { data: allProjects = [] } = useProjectsQuery({ businessId })

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: () => backend.entities.Client.filter({ is_deleted: false }, 'name')
  })

  const filteredProjects = allProjects.filter((project: any) => {
    return statusFilter === 'all' || project.status === statusFilter
  })

  const { updateMutation, createMutation, deleteMutation, bulkDeleteMutation, bulkUpdateMutation } =
    useProjectMutations(businessId)

  const handleUpdateProject = async ({
    id,
    data
  }: {
    id: string
    data: Partial<ProjectRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateProject = async (data: CreateProjectInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleBulkDeleteProject = async (ids: string[]) => {
    try {
      await bulkDeleteMutation.mutateAsync(ids)
    } catch (e) {
      console.error(e)
    } finally {
      setSelectedProjects([])
    }
  }

  const handleBulkUpdateProject = async ({
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
      setSelectedProjects([])
    }
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

  const sortedProjects = [...filteredProjects].sort((a: any, b: any) => {
    if (!sortBy) return 0

    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (aVal === bVal) return 0
    const comparison = aVal > bVal ? 1 : -1
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const paginatedProjects = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return sortedProjects.slice(startIndex, startIndex + perPage)
  }, [sortedProjects, page, perPage])

  const totalPages = Math.ceil(sortedProjects.length / perPage)

  const getProjectValue = (projectId: string, field: string, defaultValue?: any): any => {
    if (projectValues[`${projectId}-${field}`] !== undefined) {
      return projectValues[`${projectId}-${field}`]
    }
    return defaultValue || ''
  }

  const handleProjectChange = (projectId: string, field: string, value: any): void => {
    setProjectValues(prev => ({ ...prev, [`${projectId}-${field}`]: value }))
  }

  const handleProjectBlur = (project: any, field: string): void => {
    const value = projectValues[`${project.id}-${field}`]
    if (value !== undefined && value !== project[field]) {
      handleUpdateProject({ id: project.id, data: { [field]: value } })
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    project: any,
    field: string
  ): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ;(e.target as HTMLElement).blur()
    } else if (e.key === 'Escape') {
      ;(e.target as HTMLElement).blur()
    }
  }

  const handleAddNew = (): void => {
    const data: any = {
      name: 'New Project',
      status: 'planning'
    }
    if (businessId) data.business_id = businessId
    handleCreateProject(data)
  }

  const toggleSelectAll = (): void => {
    if (selectedProjects.length === paginatedProjects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(paginatedProjects.map((p: any) => p.id))
    }
  }

  const toggleSelectProject = (projectId: string): void => {
    setSelectedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    )
  }

  const toggleBulkMode = (): void => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedProjects([])
    }
  }

  const getClientName = (clientId: string): string => {
    const client = clients.find((c: any) => c.id === clientId)
    return client ? client.name : ''
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center flex-col min-[480px]:flex-row justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {isOverLimit ? (
              <Link to="/upgrade">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-1" />
                  Limit ({userLimits?.usage?.projects || 0}/{userLimits?.limits?.projects})
                </Button>
              </Link>
            ) : (
              <Button
                onClick={handleAddNew}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleBulkMode}
                    className={cn('h-9 w-9', bulkMode && 'bg-slate-200')}
                  >
                    <ListChecks className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle bulk selection</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-4">No projects found</p>
            {isOverLimit ? (
              <Link to="/upgrade">
                <Button variant="outline">
                  <Lock className="w-4 h-4 mr-2" />
                  Upgrade to add more
                </Button>
              </Link>
            ) : (
              <Button onClick={handleAddNew} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Project
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {bulkMode && (
                      <th className="px-4 py-3 text-center w-12">
                        <Checkbox
                          checked={
                            selectedProjects.length === paginatedProjects.length &&
                            paginatedProjects.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left w-64">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Name
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-medium text-slate-700">Description</span>
                    </th>
                    <th className="px-4 py-3 text-left w-32">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Status
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left w-40">
                      <span className="text-xs font-medium text-slate-700">Client</span>
                    </th>
                    <th className="px-4 py-3 text-left w-32">
                      <button
                        onClick={() => handleSort('start_date')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Start Date
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left w-32">
                      <button
                        onClick={() => handleSort('deadline')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Deadline
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center w-12">
                      <span className="text-xs font-medium text-slate-700">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map(project => (
                    <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50">
                      {bulkMode && (
                        <td className="px-4 py-3 text-center w-12 align-top">
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={() => toggleSelectProject(project.id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 align-top w-64">
                        <Input
                          value={getProjectValue(project.id, 'name', project.name)}
                          onChange={e => handleProjectChange(project.id, 'name', e.target.value)}
                          onBlur={() => handleProjectBlur(project, 'name')}
                          onKeyDown={e => handleKeyDown(e, project, 'name')}
                          maxLength={200}
                          className="border-0 shadow-none px-2 py-1 h-auto font-medium text-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>
                          <Textarea
                            value={getProjectValue(project.id, 'description', project.description)}
                            onChange={e =>
                              handleProjectChange(project.id, 'description', e.target.value)
                            }
                            onBlur={() => handleProjectBlur(project, 'description')}
                            onKeyDown={e => handleKeyDown(e, project, 'description')}
                            placeholder="Add description..."
                            maxLength={5000}
                            className={cn(
                              'w-full resize-none border-0 shadow-none px-2 py-1 text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                              !expandedDescriptions[project.id] && 'line-clamp-2 overflow-hidden'
                            )}
                          />
                          {project.description && project.description.length > 100 && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setExpandedDescriptions(prev => ({
                                  ...prev,
                                  [project.id]: !prev[project.id]
                                }))
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-700 px-2"
                            >
                              {expandedDescriptions[project.id] ? 'Show less' : 'More'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 w-32 align-top">
                        <Select
                          value={getProjectValue(project.id, 'status', project.status)}
                          onValueChange={value => {
                            handleProjectChange(project.id, 'status', value)
                            handleUpdateProject({
                              id: project.id,
                              data: { status: value as ProjectStatus }
                            })
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'h-8 text-xs font-medium border-0 shadow-none px-2 rounded-md',
                              statusColors[project.status]
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 w-40 align-top">
                        <Select
                          value={getProjectValue(
                            project.id,
                            'client_id',
                            project.client_id || 'none'
                          )}
                          onValueChange={value => {
                            handleProjectChange(project.id, 'client_id', value)
                            handleUpdateProject({
                              id: project.id,
                              data: { client_id: value === 'none' ? null : value }
                            })
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-1 focus:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white [&>span]:truncate [&>svg]:flex-shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 w-32 align-top">
                        <Input
                          type="date"
                          value={getProjectValue(project.id, 'start_date', project.start_date)}
                          onChange={e =>
                            handleProjectChange(project.id, 'start_date', e.target.value)
                          }
                          onBlur={() => handleProjectBlur(project, 'start_date')}
                          onKeyDown={e => handleKeyDown(e, project, 'start_date')}
                          className="border-0 shadow-none px-2 py-1 h-auto text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 w-32 align-top">
                        <Input
                          type="date"
                          value={getProjectValue(project.id, 'deadline', project.deadline)}
                          onChange={e =>
                            handleProjectChange(project.id, 'deadline', e.target.value)
                          }
                          onBlur={() => handleProjectBlur(project, 'deadline')}
                          onKeyDown={e => handleKeyDown(e, project, 'deadline')}
                          className="border-0 shadow-none px-2 py-1 h-auto text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-center w-12 align-top">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedProjects.length > 0 && (
              <div className="flex flex-col min-[480px]:flex-row items-center justify-between mt-4 px-4 pb-4">
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
                  <span className="text-sm text-slate-700">of {sortedProjects.length} entries</span>
                </div>
                <div className="flex items-center gap-2">
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
      </div>

      {selectedProjects.length > 0 && bulkMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedProjects.length} selected</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-slate-800 h-8"
              onClick={() =>
                handleBulkUpdateProject({ ids: selectedProjects, data: { status: 'completed' } })
              }
            >
              Mark Complete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-300 hover:bg-rose-900/30 h-8"
              onClick={() => handleBulkDeleteProject(selectedProjects)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
