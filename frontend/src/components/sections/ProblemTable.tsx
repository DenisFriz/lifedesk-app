import React, { useState, useMemo, useRef } from 'react'
import { backend } from '@/api/backend'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Star, Archive, Trash2, ArrowUpDown, ListChecks, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useProblemsQuery } from '@/hooks/problems/useProblemsQuery'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useProblemMutations } from '@/hooks/problems/useProblemMutations'
import { ProblemRecord } from '@/db'
import { CreateProblemInput } from '@/repositories/problem.repository'

const problemTypes = [
  { value: 'health_problem', label: 'Health Problems' },
  { value: 'medication', label: 'Medication' },
  { value: 'measurement', label: 'Measurements' },
  { value: 'activity', label: 'Activity' },
  { value: 'food', label: 'Food' },
  { value: 'mental_state', label: 'Mental State' },
  { value: 'medical_event', label: 'Medical Event' }
] as const

interface ProblemTableProps {
  category: string
}

export default function ProblemTable({ category }: ProblemTableProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentType, setCurrentType] = useState<string>('health_problem')
  const [currentTab, setCurrentTab] = useState<'active' | 'archived'>('active')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState<boolean>(false)
  const queryClient = useQueryClient()
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { canCreate, data: userLimits } = useUserLimit()

  const isOverLimit = !canCreate('problems')

  const { data: allProblems = [] } = useProblemsQuery({ category })

  const problems = allProblems.filter(
    (p: ProblemRecord) => p.problem_type === currentType && p.status === currentTab
  )

  const { updateMutation, createMutation, deleteMutation } = useProblemMutations()

  const handleUpdateProblem = async ({
    id,
    data
  }: {
    id: string
    data: Partial<ProblemRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setEditingField(null)
    }
  }

  const handleCreateProblem = async (data: CreateProblemInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteProblem = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    }
  }

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    mutationFn: async ids => {
      await Promise.all(ids.map(id => backend.entities.Problem.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', category] })
      setSelectedProblems([])
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: any }>({
    mutationFn: async ({ ids, data }) => {
      await Promise.all(ids.map(id => backend.entities.Problem.update(id, data)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', category] })
      setSelectedProblems([])
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

  const sortedProblems = [...problems].sort((a: any, b: any) => {
    if (!sortBy) return 0

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

  const paginatedProblems = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return sortedProblems.slice(startIndex, startIndex + perPage)
  }, [sortedProblems, page, perPage])

  const totalPages = Math.ceil(sortedProblems.length / perPage)

  const startEdit = (problemId: string, field: string, currentValue: any): void => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    setEditingField(`${problemId}-${field}`)
    setEditValue(currentValue || '')
  }

  const saveEdit = (problemId: string, field: string): void => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    handleUpdateProblem({ id: problemId, data: { [field]: editValue } })
  }

  const handleBlur = (problemId: string, field: string): void => {
    blurTimeoutRef.current = setTimeout(() => {
      saveEdit(problemId, field)
      blurTimeoutRef.current = null
    }, 150)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    problemId: string,
    field: string
  ): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit(problemId, field)
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  const toggleImportant = (problem: any): void => {
    handleUpdateProblem({ id: problem.id, data: { important: !problem.important } })
  }

  const archiveProblem = (problem: any): void => {
    handleUpdateProblem({ id: problem.id, data: { status: 'archived' } })
  }

  const unarchiveProblem = (problem: any): void => {
    handleUpdateProblem({ id: problem.id, data: { status: 'active' } })
  }

  const handleAddNew = (): void => {
    handleCreateProblem({
      title: 'New Entry',
      description: '',
      category,
      problem_type: currentType,
      status: 'active',
      priority: 'medium',
      resolved: false,
      important: false,
      show_in_timeline: true
    })
  }

  const toggleSelectAll = (): void => {
    if (selectedProblems.length === paginatedProblems.length) {
      setSelectedProblems([])
    } else {
      setSelectedProblems(paginatedProblems.map((p: any) => p.id))
    }
  }

  const toggleSelectProblem = (problemId: string): void => {
    setSelectedProblems(prev =>
      prev.includes(problemId) ? prev.filter(id => id !== problemId) : [...prev, problemId]
    )
  }

  const toggleBulkMode = (): void => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedProblems([])
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Health Tracking</h2>
          <span className="text-sm text-slate-500">
            {allProblems.length}
            {isOverLimit ? `/${userLimits?.limits?.problems}` : ''} used
          </span>
        </div>
        {isOverLimit ? (
          <Link to="/upgrade">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Lock className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          </Link>
        ) : (
          <Button onClick={handleAddNew} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      <div className="flex gap-1 p-3 border-b border-slate-200 bg-slate-50 overflow-x-auto">
        {problemTypes.map(type => (
          <Button
            key={type.value}
            variant={currentType === type.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentType(type.value)}
            className="text-xs whitespace-nowrap"
          >
            {type.label} ({allProblems.filter(p => p.problem_type === type.value).length})
          </Button>
        ))}
      </div>

      <div className="flex gap-1 p-3 border-b border-slate-200 bg-slate-50">
        <Button
          variant={currentTab === 'active' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentTab('active')}
          className="text-xs"
        >
          Active (
          {allProblems.filter(p => p.problem_type === currentType && p.status === 'active').length})
        </Button>
        <Button
          variant={currentTab === 'archived' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentTab('archived')}
          className="text-xs"
        >
          Archived (
          {
            allProblems.filter(p => p.problem_type === currentType && p.status === 'archived')
              .length
          }
          )
        </Button>
      </div>

      {problems.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-500 mb-4">No {currentTab} entries</p>
          {currentTab === 'active' &&
            (isOverLimit ? (
              <Link to="/upgrade">
                <Button
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Upgrade to Add More
                </Button>
              </Link>
            ) : (
              <Button onClick={handleAddNew} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Entry
              </Button>
            ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {bulkMode && (
                  <th className="px-4 py-3 text-center w-12">
                    <Checkbox
                      checked={
                        selectedProblems.length === paginatedProblems.length &&
                        paginatedProblems.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left w-16">
                  <button
                    onClick={() => handleSort('important')}
                    className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Star className="w-4 h-4" />
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center w-16">
                  <span className="text-xs font-medium text-slate-700">Timeline</span>
                </th>
                <th className="px-4 py-3 text-left w-56">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    Title
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left w-96">
                  <span className="text-xs font-medium text-slate-700">Description</span>
                </th>
                <th className="px-4 py-3 text-left w-40">
                  <button
                    onClick={() => handleSort('date_occurred')}
                    className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    Date Occurred
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left w-40">
                  <button
                    onClick={() => handleSort('date_ended')}
                    className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    Date Ended
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center w-16">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleBulkMode}
                          className={cn('h-7 w-7', bulkMode && 'bg-slate-200')}
                        >
                          <ListChecks className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Toggle bulk selection</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedProblems.map(problem => (
                <tr key={problem.id} className="border-b border-slate-100 hover:bg-slate-50">
                  {bulkMode && (
                    <td className="px-4 py-3 text-center w-12 align-top">
                      <Checkbox
                        checked={selectedProblems.includes(problem.id)}
                        onCheckedChange={() => toggleSelectProblem(problem.id)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 w-16 align-top">
                    <button onClick={() => toggleImportant(problem)}>
                      <Star
                        className={cn(
                          'w-5 h-5',
                          problem.important
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 hover:text-slate-400'
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 w-16 text-center align-top">
                    <Checkbox
                      checked={problem.show_in_timeline}
                      onCheckedChange={checked =>
                        handleUpdateProblem({
                          id: problem.id,
                          data: { show_in_timeline: Boolean(checked) }
                        })
                      }
                    />
                  </td>
                  <td className="px-4 py-3 w-56 align-top">
                    {editingField === `${problem.id}-title` ? (
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleBlur(problem.id, 'title')}
                        onKeyDown={e => handleKeyDown(e, problem.id, 'title')}
                        maxLength={200}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <div
                        onClick={() => startEdit(problem.id, 'title', problem.title)}
                        className="cursor-text font-medium text-slate-900 hover:bg-slate-100 px-2 py-1 rounded line-clamp-2"
                      >
                        {problem.title}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 w-96 align-top">
                    {editingField === `${problem.id}-description` ? (
                      <Textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleBlur(problem.id, 'description')}
                        onKeyDown={e => handleKeyDown(e, problem.id, 'description')}
                        maxLength={5000}
                        autoFocus
                        className="min-h-[60px]"
                      />
                    ) : (
                      <div
                        onClick={() => startEdit(problem.id, 'description', problem.description)}
                        className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded line-clamp-2"
                      >
                        {problem.description || 'Click to add description...'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 w-40 align-top">
                    {editingField === `${problem.id}-date_occurred` ? (
                      <Input
                        type="date"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(problem.id, 'date_occurred')}
                        onKeyDown={e => handleKeyDown(e, problem.id, 'date_occurred')}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <div
                        onClick={() =>
                          startEdit(problem.id, 'date_occurred', problem.date_occurred)
                        }
                        className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                      >
                        {problem.date_occurred
                          ? format(new Date(problem.date_occurred), 'MMM d, yyyy')
                          : 'Set date...'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 w-40 align-top">
                    {editingField === `${problem.id}-date_ended` ? (
                      <Input
                        type="date"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(problem.id, 'date_ended')}
                        onKeyDown={e => handleKeyDown(e, problem.id, 'date_ended')}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <div
                        onClick={() => startEdit(problem.id, 'date_ended', problem.date_ended)}
                        className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                      >
                        {problem.date_ended
                          ? format(new Date(problem.date_ended), 'MMM d, yyyy')
                          : 'Set date...'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center w-20 align-top">
                    <div className="flex items-center gap-0.5">
                      {currentTab === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => archiveProblem(problem)}
                        >
                          <Archive className="h-4 w-4 text-slate-500" />
                        </Button>
                      )}
                      {currentTab === 'archived' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => unarchiveProblem(problem)}
                        >
                          <Archive className="h-4 w-4 text-slate-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteProblem(problem.id)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedProblems.length > 0 && (
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
                <span className="text-sm text-slate-700">of {sortedProblems.length} entries</span>
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
        </div>
      )}

      {selectedProblems.length > 0 && bulkMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedProblems.length} selected</span>
          <div className="flex items-center gap-2">
            {currentTab === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedProblems, data: { status: 'archived' } })
                }
              >
                <Archive className="w-4 h-4 mr-1" />
                Archive
              </Button>
            )}
            {currentTab === 'archived' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-800 h-8"
                onClick={() =>
                  bulkUpdateMutation.mutate({ ids: selectedProblems, data: { status: 'active' } })
                }
              >
                <Archive className="w-4 h-4 mr-1" />
                Unarchive
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-300 hover:bg-rose-900/30 h-8"
              onClick={() => bulkDeleteMutation.mutate(selectedProblems)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
