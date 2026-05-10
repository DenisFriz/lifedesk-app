import { useState, useMemo } from 'react'
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
import { Plus, Trash2, ArrowUpDown, ListChecks } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export default function ContentTable({ businessId }) {
  const [contentValues, setContentValues] = useState({})
  const [sortBy, setSortBy] = useState(null)
  const [sortOrder, setSortOrder] = useState('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [expandedDescriptions, setExpandedDescriptions] = useState({})
  const [selectedContent, setSelectedContent] = useState([])
  const [bulkMode, setBulkMode] = useState(false)
  const queryClient = useQueryClient()

  const { data: allContent = [] } = useQuery<any[]>({
    queryKey: ['content', businessId],
    queryFn: () => {
      if (businessId) {
        return backend.entities.ContentIdea.filter({ business_id: businessId })
      }
      return backend.entities.ContentIdea.list('-created_date')
    }
  })

  const filteredContent = allContent.filter(content => {
    const statusMatch = statusFilter === 'all' || content.status === statusFilter
    const typeMatch = typeFilter === 'all' || content.type === typeFilter
    return statusMatch && typeMatch
  })

  const updateMutation = useMutation<any, any, { id: string; data: Record<string, any> }>({
    mutationFn: ({ id, data }) => backend.entities.ContentIdea.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['content', businessId] })
      const previousContent = queryClient.getQueryData(['content', businessId])
      queryClient.setQueryData(['content', businessId], (old: any) =>
        old.map((content: any) => (content.id === id ? { ...content, ...data } : content))
      )
      return { previousContent }
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['content', businessId], context.previousContent)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', businessId] })
    }
  })

  const createMutation = useMutation<any, any, Record<string, any>>({
    mutationFn: data => backend.entities.ContentIdea.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', businessId] })
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    mutationFn: id => backend.entities.ContentIdea.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', businessId] })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    mutationFn: async ids => {
      await Promise.all(ids.map(id => backend.entities.ContentIdea.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', businessId] })
      setSelectedContent([])
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: Record<string, any> }>({
    mutationFn: async ({ ids, data }) => {
      await Promise.all(ids.map(id => backend.entities.ContentIdea.update(id, data)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', businessId] })
      setSelectedContent([])
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

  const sortedContent = [...filteredContent].sort((a, b) => {
    if (!sortBy) return 0

    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (aVal === bVal) return 0
    const comparison = aVal > bVal ? 1 : -1
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const paginatedContent = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return sortedContent.slice(startIndex, startIndex + perPage)
  }, [sortedContent, page, perPage])

  const totalPages = Math.ceil(sortedContent.length / perPage)

  const getContentValue = (contentId, field, defaultValue) => {
    if (contentValues[`${contentId}-${field}`] !== undefined) {
      return contentValues[`${contentId}-${field}`]
    }
    return defaultValue || ''
  }

  const handleContentChange = (contentId, field, value) => {
    setContentValues(prev => ({ ...prev, [`${contentId}-${field}`]: value }))
  }

  const handleContentBlur = (content, field) => {
    const value = contentValues[`${content.id}-${field}`]
    if (value !== undefined && value !== content[field]) {
      updateMutation.mutate({ id: content.id, data: { [field]: value } })
    }
  }

  const handleKeyDown = (e, content, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.target.blur()
    } else if (e.key === 'Escape') {
      e.target.blur()
    }
  }

  const handleAddNew = () => {
    const data = {
      title: 'New Content Idea',
      status: 'idea',
      type: 'blog'
    } as Record<string, any>
    if (businessId) data.business_id = businessId
    createMutation.mutate(data)
  }

  const toggleSelectAll = () => {
    if (selectedContent.length === paginatedContent.length) {
      setSelectedContent([])
    } else {
      setSelectedContent(paginatedContent.map(c => c.id))
    }
  }

  const toggleSelectContent = contentId => {
    setSelectedContent(prev =>
      prev.includes(contentId) ? prev.filter(id => id !== contentId) : [...prev, contentId]
    )
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedContent([])
    }
  }

  const statusColors = {
    idea: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    published: 'bg-emerald-100 text-emerald-700'
  }

  const typeColors = {
    blog: 'bg-indigo-100 text-indigo-700',
    video: 'bg-rose-100 text-rose-700',
    social: 'bg-purple-100 text-purple-700',
    email: 'bg-amber-100 text-amber-700',
    podcast: 'bg-cyan-100 text-cyan-700',
    other: 'bg-slate-100 text-slate-700'
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddNew} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
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

        {filteredContent.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-4">No content ideas yet</p>
            <Button onClick={handleAddNew} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Content Idea
            </Button>
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
                            selectedContent.length === paginatedContent.length &&
                            paginatedContent.length > 0
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
                    <th className="px-4 py-3 text-left w-32">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Type
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
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
                      <span className="text-xs font-medium text-slate-700">Platform</span>
                    </th>
                    <th className="px-4 py-3 text-left w-32">
                      <button
                        onClick={() => handleSort('publish_date')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Publish Date
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center w-12">
                      <span className="text-xs font-medium text-slate-700">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContent.map(content => (
                    <tr key={content.id} className="border-b border-slate-100 hover:bg-slate-50">
                      {bulkMode && (
                        <td className="px-4 py-3 text-center w-12 align-top">
                          <Checkbox
                            checked={selectedContent.includes(content.id)}
                            onCheckedChange={() => toggleSelectContent(content.id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 align-top w-64">
                        <Input
                          value={getContentValue(content.id, 'title', content.title)}
                          onChange={e => handleContentChange(content.id, 'title', e.target.value)}
                          onBlur={() => handleContentBlur(content, 'title')}
                          onKeyDown={e => handleKeyDown(e, content, 'title')}
                          maxLength={200}
                          className="border-0 shadow-none px-2 py-1 h-auto font-medium text-slate-900 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>
                          <Textarea
                            value={getContentValue(content.id, 'description', content.description)}
                            onChange={e =>
                              handleContentChange(content.id, 'description', e.target.value)
                            }
                            onBlur={() => handleContentBlur(content, 'description')}
                            onKeyDown={e => handleKeyDown(e, content, 'description')}
                            placeholder="Add description..."
                            maxLength={5000}
                            className={cn(
                              'w-full resize-none border-0 shadow-none px-2 py-1 text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                              !expandedDescriptions[content.id] && 'line-clamp-2 overflow-hidden'
                            )}
                          />
                          {content.description && content.description.length > 100 && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setExpandedDescriptions(prev => ({
                                  ...prev,
                                  [content.id]: !prev[content.id]
                                }))
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-700 px-2"
                            >
                              {expandedDescriptions[content.id] ? 'Show less' : 'More'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 w-32 align-top">
                        <Select
                          value={getContentValue(content.id, 'type', content.type)}
                          onValueChange={value => {
                            handleContentChange(content.id, 'type', value)
                            updateMutation.mutate({ id: content.id, data: { type: value } })
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-1 focus:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white [&>span]:truncate [&>svg]:flex-shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blog">Blog</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="podcast">Podcast</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 w-32 align-top">
                        <Select
                          value={getContentValue(content.id, 'status', content.status)}
                          onValueChange={value => {
                            handleContentChange(content.id, 'status', value)
                            updateMutation.mutate({ id: content.id, data: { status: value } })
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-1 focus:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white [&>span]:truncate [&>svg]:flex-shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="idea">Idea</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 align-top w-40">
                        <Input
                          value={getContentValue(content.id, 'platform', content.platform)}
                          onChange={e =>
                            handleContentChange(content.id, 'platform', e.target.value)
                          }
                          onBlur={() => handleContentBlur(content, 'platform')}
                          onKeyDown={e => handleKeyDown(e, content, 'platform')}
                          placeholder="Add platform..."
                          className="border-0 shadow-none px-2 py-1 h-auto text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 w-32 align-top">
                        <Input
                          type="date"
                          value={getContentValue(content.id, 'publish_date', content.publish_date)}
                          onChange={e =>
                            handleContentChange(content.id, 'publish_date', e.target.value)
                          }
                          onBlur={() => handleContentBlur(content, 'publish_date')}
                          onKeyDown={e => handleKeyDown(e, content, 'publish_date')}
                          className="border-0 shadow-none px-2 py-1 h-auto text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-center w-12 align-top">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteMutation.mutate(content.id)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedContent.length > 0 && (
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
                  <span className="text-sm text-slate-700">of {sortedContent.length} entries</span>
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

      {selectedContent.length > 0 && bulkMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedContent.length} selected</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-slate-800 h-8"
              onClick={() =>
                bulkUpdateMutation.mutate({ ids: selectedContent, data: { status: 'published' } })
              }
            >
              Mark Published
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-300 hover:bg-rose-900/30 h-8"
              onClick={() => bulkDeleteMutation.mutate(selectedContent)}
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
