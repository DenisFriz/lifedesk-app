import React, { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { useSubscription } from '@/hooks/useSubscription'

interface ClientTableProps {
  businessId?: string
}

type Client = {
  id: string
  business_id?: string
  name: string
  company?: string
  email?: string
  phone?: string
  status?: string
  notes?: string
  is_deleted?: boolean
  created_date?: string
}

export default function ClientTable({ businessId }: ClientTableProps) {
  const { limit } = useSubscription()
  const clientLimit = limit('business_clients_limit')
  const [clientValues, setClientValues] = useState<Record<string, any>>({})
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(20)
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState<boolean>(false)
  const queryClient = useQueryClient()

  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ['clients', businessId],
    queryFn: async (): Promise<Client[]> => {
      if (businessId) {
        const data = (await backend.entities.Client.filter({
          business_id: businessId
        })) as Client[]

        return data.filter(r => !r.is_deleted)
      }

      const data = (await backend.entities.Client.list('-created_date')) as Client[]

      return data.filter(r => !r.is_deleted)
    }
  })

  const filteredClients = allClients.filter((client: any) => {
    return statusFilter === 'all' || client.status === statusFilter
  })

  const updateMutation = useMutation<any, any, { id: string; data: any }>({
    mutationFn: ({ id, data }) => backend.entities.Client.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['clients', businessId] })
      const previousClients = queryClient.getQueryData(['clients', businessId])
      queryClient.setQueryData(['clients', businessId], (old: any) =>
        old.map((client: any) => (client.id === id ? { ...client, ...data } : client))
      )
      return { previousClients }
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['clients', businessId], context.previousClients)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] })
    }
  })

  const createMutation = useMutation<any, any, any>({
    mutationFn: data => backend.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] })
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: id => backend.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    mutationFn: async ids => {
      await Promise.all(ids.map(id => backend.entities.Client.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] })
      setSelectedClients([])
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: any }>({
    mutationFn: async ({ ids, data }) => {
      await Promise.all(ids.map(id => backend.entities.Client.update(id, data)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] })
      setSelectedClients([])
    }
  })

  const handleSort = (field: string): void => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const sortedClients = [...filteredClients].sort((a: any, b: any) => {
    if (!sortBy) return 0

    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (aVal === bVal) return 0
    const comparison = aVal > bVal ? 1 : -1
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const paginatedClients = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return sortedClients.slice(startIndex, startIndex + perPage)
  }, [sortedClients, page, perPage])

  const totalPages = Math.ceil(sortedClients.length / perPage)

  const getClientValue = (clientId: string, field: string, defaultValue?: any): any => {
    if (clientValues[`${clientId}-${field}`] !== undefined) {
      return clientValues[`${clientId}-${field}`]
    }
    return defaultValue || ''
  }

  const handleClientChange = (clientId: string, field: string, value: any): void => {
    setClientValues(prev => ({ ...prev, [`${clientId}-${field}`]: value }))
  }

  const handleClientBlur = (client: any, field: string): void => {
    const value = clientValues[`${client.id}-${field}`]
    if (value !== undefined && value !== client[field]) {
      updateMutation.mutate({ id: client.id, data: { [field]: value } })
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    client: any,
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
      name: 'New Client',
      status: 'lead'
    }
    if (businessId) data.business_id = businessId
    createMutation.mutate(data)
  }

  const toggleSelectAll = (): void => {
    if (selectedClients.length === paginatedClients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(paginatedClients.map((c: any) => c.id))
    }
  }

  const toggleSelectClient = (clientId: string): void => {
    setSelectedClients(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    )
  }

  const toggleBulkMode = (): void => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedClients([])
    }
  }

  const statusColors = {
    lead: 'bg-slate-100 text-slate-700',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-amber-100 text-amber-700',
    past: 'bg-rose-100 text-rose-700'
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            {clientLimit !== Infinity && allClients.length >= clientLimit ? (
              <Link to="/Upgrade">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-1" />
                  Limit ({allClients.length}/{clientLimit})
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

        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-4">No clients found</p>
            {clientLimit !== Infinity && allClients.length >= clientLimit ? (
              <Link to="/Upgrade">
                <Button variant="outline">
                  <Lock className="w-4 h-4 mr-2" />
                  Upgrade to add more
                </Button>
              </Link>
            ) : (
              <Button onClick={handleAddNew} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
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
                            selectedClients.length === paginatedClients.length &&
                            paginatedClients.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left w-48">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Name
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left w-48">
                      <span className="text-xs font-medium text-slate-700">Company</span>
                    </th>
                    <th className="px-4 py-3 text-left w-48">
                      <span className="text-xs font-medium text-slate-700">Email</span>
                    </th>
                    <th className="px-4 py-3 text-left w-32">
                      <span className="text-xs font-medium text-slate-700">Phone</span>
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
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-medium text-slate-700">Notes</span>
                    </th>
                    <th className="px-4 py-3 text-center w-12">
                      <span className="text-xs font-medium text-slate-700">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map(client => (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                      {bulkMode && (
                        <td className="px-4 py-3 text-center w-12 align-top">
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={() => toggleSelectClient(client.id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 align-top w-48">
                        <Input
                          value={getClientValue(client.id, 'name', client.name)}
                          onChange={e => handleClientChange(client.id, 'name', e.target.value)}
                          onBlur={() => handleClientBlur(client, 'name')}
                          onKeyDown={e => handleKeyDown(e, client, 'name')}
                          maxLength={200}
                          className="border-0 shadow-none px-2 py-1 h-auto font-medium text-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 align-top w-48">
                        <Input
                          value={getClientValue(client.id, 'company', client.company)}
                          onChange={e => handleClientChange(client.id, 'company', e.target.value)}
                          onBlur={() => handleClientBlur(client, 'company')}
                          onKeyDown={e => handleKeyDown(e, client, 'company')}
                          placeholder="Add company..."
                          className="border-0 shadow-none px-2 py-1 h-auto text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 align-top w-48">
                        <Input
                          type="email"
                          value={getClientValue(client.id, 'email', client.email)}
                          onChange={e => handleClientChange(client.id, 'email', e.target.value)}
                          onBlur={() => handleClientBlur(client, 'email')}
                          onKeyDown={e => handleKeyDown(e, client, 'email')}
                          placeholder="Add email..."
                          className="border-0 shadow-none px-2 py-1 h-auto text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 align-top w-32">
                        <Input
                          type="tel"
                          value={getClientValue(client.id, 'phone', client.phone)}
                          onChange={e => handleClientChange(client.id, 'phone', e.target.value)}
                          onBlur={() => handleClientBlur(client, 'phone')}
                          onKeyDown={e => handleKeyDown(e, client, 'phone')}
                          placeholder="Add phone..."
                          className="border-0 shadow-none px-2 py-1 h-auto text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 w-32 align-top">
                        <Select
                          value={getClientValue(client.id, 'status', client.status)}
                          onValueChange={value => {
                            handleClientChange(client.id, 'status', value)
                            updateMutation.mutate({ id: client.id, data: { status: value } })
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'h-8 text-xs font-medium border-0 shadow-none px-2 rounded-md',
                              statusColors[client.status]
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="past">Past</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>
                          <Textarea
                            value={getClientValue(client.id, 'notes', client.notes)}
                            onChange={e => handleClientChange(client.id, 'notes', e.target.value)}
                            onBlur={() => handleClientBlur(client, 'notes')}
                            onKeyDown={e => handleKeyDown(e, client, 'notes')}
                            placeholder="Add notes..."
                            maxLength={5000}
                            className={cn(
                              'w-full resize-none border-0 shadow-none px-2 py-1 text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                              !expandedNotes[client.id] && 'line-clamp-2 overflow-hidden'
                            )}
                          />
                          {client.notes && client.notes.length > 100 && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setExpandedNotes(prev => ({
                                  ...prev,
                                  [client.id]: !prev[client.id]
                                }))
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-700 px-2"
                            >
                              {expandedNotes[client.id] ? 'Show less' : 'More'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center w-12 align-top">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => deleteMutation.mutate(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedClients.length > 0 && (
              <div className="flex items-center justify-between mt-4 px-4 pb-4">
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
                  <span className="text-sm text-slate-700">of {sortedClients.length} entries</span>
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

      {selectedClients.length > 0 && bulkMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedClients.length} selected</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-slate-800 h-8"
              onClick={() =>
                bulkUpdateMutation.mutate({ ids: selectedClients, data: { status: 'active' } })
              }
            >
              Mark Active
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-300 hover:bg-rose-900/30 h-8"
              onClick={() => bulkDeleteMutation.mutate(selectedClients)}
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
