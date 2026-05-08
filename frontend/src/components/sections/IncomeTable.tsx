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
import { Plus, MoreHorizontal, Trash2, ArrowUpDown, ListChecks } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function IncomeTable({ businessId }) {
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [selectedIncome, setSelectedIncome] = useState([])
  const [bulkMode, setBulkMode] = useState(false)
  const queryClient = useQueryClient()
  const blurTimeoutRef = React.useRef(null)

  const { data: allIncome = [] } = useQuery({
    queryKey: ['income', businessId],
    queryFn: () => {
      if (businessId) {
        return backend.entities.Income.filter({ business_id: businessId })
      }
      return backend.entities.Income.list('-date')
    }
  })

  const categories = [...new Set(allIncome.map(i => i.category).filter(Boolean))]

  const filteredIncome = allIncome.filter(income => {
    return categoryFilter === 'all' || income.category === categoryFilter
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => backend.entities.Income.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['income', businessId] })
      const previousIncome = queryClient.getQueryData(['income', businessId])
      queryClient.setQueryData(['income', businessId], old =>
        old.map(income => (income.id === id ? { ...income, ...data } : income))
      )
      return { previousIncome }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['income', businessId], context.previousIncome)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', businessId] })
      setEditingField(null)
    }
  })

  const createMutation = useMutation({
    mutationFn: data => backend.entities.Income.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', businessId] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: id => backend.entities.Income.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', businessId] })
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async ids => {
      await Promise.all(ids.map(id => backend.entities.Income.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', businessId] })
      setSelectedIncome([])
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

  const sortedIncome = [...filteredIncome].sort((a, b) => {
    if (!sortBy) return 0

    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (aVal === bVal) return 0
    const comparison = aVal > bVal ? 1 : -1
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const paginatedIncome = useMemo(() => {
    const startIndex = (page - 1) * perPage
    return sortedIncome.slice(startIndex, startIndex + perPage)
  }, [sortedIncome, page, perPage])

  const totalPages = Math.ceil(sortedIncome.length / perPage)
  const totalRevenue = filteredIncome.reduce((sum, i) => sum + (i.amount || 0), 0)

  const startEdit = (incomeId, field, currentValue) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    setEditingField(`${incomeId}-${field}`)
    setEditValue(currentValue || '')
  }

  const saveEdit = (incomeId, field) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    const value = field === 'amount' ? parseFloat(editValue) || 0 : editValue
    updateMutation.mutate({ id: incomeId, data: { [field]: value } })
  }

  const handleBlur = (incomeId, field) => {
    blurTimeoutRef.current = setTimeout(() => {
      saveEdit(incomeId, field)
      blurTimeoutRef.current = null
    }, 150)
  }

  const handleKeyDown = (e, incomeId, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit(incomeId, field)
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  const handleAddNew = () => {
    const data = {
      title: 'New Income',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    }
    if (businessId) data.business_id = businessId
    createMutation.mutate(data)
  }

  const toggleSelectAll = () => {
    if (selectedIncome.length === paginatedIncome.length) {
      setSelectedIncome([])
    } else {
      setSelectedIncome(paginatedIncome.map(i => i.id))
    }
  }

  const toggleSelectIncome = incomeId => {
    setSelectedIncome(prev =>
      prev.includes(incomeId) ? prev.filter(id => id !== incomeId) : [...prev, incomeId]
    )
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedIncome([])
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 mb-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600 mb-1">Total Entries</p>
            <p className="text-3xl font-bold text-slate-900">{filteredIncome.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {filteredIncome.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-4">No income recorded</p>
            <Button onClick={handleAddNew} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Income
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
                            selectedIncome.length === paginatedIncome.length &&
                            paginatedIncome.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left w-32">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Date
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left w-64">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Title
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left w-40">
                      <span className="text-xs font-medium text-slate-700">Category</span>
                    </th>
                    <th className="px-4 py-3 text-left w-32">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-medium text-slate-700">Notes</span>
                    </th>
                    <th className="px-4 py-3 text-center w-12">
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
                  {paginatedIncome.map(income => (
                    <tr key={income.id} className="border-b border-slate-100 hover:bg-slate-50">
                      {bulkMode && (
                        <td className="px-4 py-3 text-center w-12 align-top">
                          <Checkbox
                            checked={selectedIncome.includes(income.id)}
                            onCheckedChange={() => toggleSelectIncome(income.id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 align-top w-32">
                        {editingField === `${income.id}-date` ? (
                          <Input
                            type="date"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleBlur(income.id, 'date')}
                            onKeyDown={e => handleKeyDown(e, income.id, 'date')}
                            autoFocus
                            className="h-8"
                          />
                        ) : (
                          <div
                            onClick={() => startEdit(income.id, 'date', income.date)}
                            className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                          >
                            {income.date
                              ? format(new Date(income.date), 'MMM d, yyyy')
                              : 'Set date...'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top w-64">
                        {editingField === `${income.id}-title` ? (
                          <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleBlur(income.id, 'title')}
                            onKeyDown={e => handleKeyDown(e, income.id, 'title')}
                            autoFocus
                            className="h-8 w-full"
                          />
                        ) : (
                          <div
                            onClick={() => startEdit(income.id, 'title', income.title)}
                            className="cursor-text font-medium text-slate-900 hover:bg-slate-100 px-2 py-1 rounded"
                          >
                            {income.title}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top w-40">
                        {editingField === `${income.id}-category` ? (
                          <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleBlur(income.id, 'category')}
                            onKeyDown={e => handleKeyDown(e, income.id, 'category')}
                            autoFocus
                            className="h-8 w-full"
                          />
                        ) : (
                          <div
                            onClick={() => startEdit(income.id, 'category', income.category)}
                            className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
                          >
                            {income.category || 'Add category...'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top w-32">
                        {editingField === `${income.id}-amount` ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleBlur(income.id, 'amount')}
                            onKeyDown={e => handleKeyDown(e, income.id, 'amount')}
                            autoFocus
                            className="h-8"
                          />
                        ) : (
                          <div
                            onClick={() => startEdit(income.id, 'amount', income.amount)}
                            className="cursor-text font-semibold text-emerald-600 hover:bg-slate-100 px-2 py-1 rounded"
                          >
                            ${parseFloat(income.amount || 0).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {editingField === `${income.id}-notes` ? (
                          <Textarea
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleBlur(income.id, 'notes')}
                            onKeyDown={e => handleKeyDown(e, income.id, 'notes')}
                            autoFocus
                            className="w-full resize-none -mx-2 -my-1 min-h-[60px]"
                            style={{ width: 'calc(100% + 16px)' }}
                          />
                        ) : (
                          <div>
                            <div
                              onClick={() => startEdit(income.id, 'notes', income.notes)}
                              className={cn(
                                'cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded',
                                !expandedNotes[income.id] && 'line-clamp-2 overflow-hidden'
                              )}
                            >
                              {income.notes || 'Add notes...'}
                            </div>
                            {income.notes && income.notes.length > 100 && (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  setExpandedNotes(prev => ({
                                    ...prev,
                                    [income.id]: !prev[income.id]
                                  }))
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-700 px-2"
                              >
                                {expandedNotes[income.id] ? 'Show less' : 'More'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center w-12 align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(income.id)}
                              className="text-rose-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedIncome.length > 0 && (
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
                  <span className="text-sm text-slate-700">of {sortedIncome.length} entries</span>
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

      {selectedIncome.length > 0 && bulkMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedIncome.length} selected</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-300 hover:bg-rose-900/30 h-8"
              onClick={() => bulkDeleteMutation.mutate(selectedIncome)}
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
