import { useRef, useState } from 'react'

export function useTableState(storageKey: string) {
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')

  const [sortBy, setSortBy] = useState(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [currentTab, setCurrentTab] = useState('active')

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  const [searchQuery, setSearchQuery] = useState('')

  const [bulkMode, setBulkMode] = useState(false)

  const [compactView, setCompactView] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : false
  })

  const blurTimeoutRef = useRef<any>(null)
  const tableRef = useRef<HTMLDivElement | null>(null)

  return {
    table: {
      editingField,
      setEditingField,

      editValue,
      setEditValue,

      sortBy,
      setSortBy,

      sortOrder,
      setSortOrder,

      currentTab,
      setCurrentTab,

      page,
      setPage,

      perPage,
      setPerPage,

      searchQuery,
      setSearchQuery,

      bulkMode,
      setBulkMode,

      compactView,
      setCompactView,

      blurTimeoutRef,
      tableRef
    }
  }
}
