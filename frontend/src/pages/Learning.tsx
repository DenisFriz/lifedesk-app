import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Brain, Plus, Search, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import LearningStats from '@/components/learning/LearningStats'
import LearningItemCard from '@/components/learning/LearningItemCard'
import LearningItemForm from '@/components/learning/LearningItemForm'
import OverLimitItem from '@/components/subscription/OverLimitItem'
import { Helmet } from 'react-helmet-async'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useLearningMutations } from '@/hooks/learning/useLearningMutations'
import { LearningRecord } from '@/db'
import { CreateLearningInput } from '@/repositories/learning.repository'
import { useLearningQuery } from '@/hooks/learning/useLearningQuery'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'want_to_learn', label: 'Want to Learn' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' }
] as const

export default function Learning() {
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
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

  const { canCreate, data: userLimits } = useUserLimit()

  const { data: learningItems = [] } = useLearningQuery()

  const isOverLimit = !canCreate('learning')

  const { createMutation, updateMutation, deleteMutation } = useLearningMutations()

  const handleCreateLearning = async (data: CreateLearningInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
    }
  }

  const handleUpdateLearning = async ({
    id,
    data
  }: {
    id: string
    data: Partial<LearningRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingItem(null)
    }
  }

  const handleDeleteLearning = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingItem(null)
    }
  }

  const handleSubmit = (data: CreateLearningInput) => {
    if (editingItem) {
      handleUpdateLearning({ id: editingItem.id, data })
    } else {
      handleCreateLearning(data)
    }
  }

  const handleEdit = (item: LearningRecord) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const filtered = learningItems?.filter(item => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    const matchType = typeFilter === 'all' || item.type === typeFilter
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.author || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchType && matchSearch
  })

  // Sort: in_progress first, then by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const statusOrder = { in_progress: 0, want_to_learn: 1, on_hold: 2, completed: 3 }
  const sorted = [...filtered].sort((a, b) => {
    const sA = statusOrder[a.status] ?? 99
    const sB = statusOrder[b.status] ?? 99
    if (sA !== sB) return sA - sB
    return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
  })

  return (
    <>
      <Helmet>
        <title>Learning | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="text-sm font-normal text-slate-900 text-center">
                  Learning & Development
                </h1>
              </div>
            </div>
          )}

          <div
            ref={headerRef}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-6 sm:py-8"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <Brain className="w-8 h-8 sm:w-9 sm:h-9" />
                Learning & Development
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Track courses, books, skills and everything you're learning
              </p>
            </div>
            {isOverLimit ? (
              <Link to="/upgrade" className="w-full lg:w-auto">
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Limit reached ({userLimits?.usage?.learning || 0}/{userLimits?.limits?.learning})
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  setEditingItem(null)
                  setShowForm(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-700 w-full lg:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>

          <LearningStats items={learningItems} />

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                name="search"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="skill">Skill</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {STATUS_TABS.map(tab => {
              const count =
                tab.value === 'all'
                  ? learningItems?.length
                  : learningItems?.filter(i => i.status === tab.value).length
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === tab.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              )
            })}
          </div>

          {sorted.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">
                {learningItems?.length === 0
                  ? 'Start tracking your learning journey'
                  : 'No items match your filters'}
              </p>
              {learningItems?.length === 0 && !isOverLimit && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {sorted.map(item => {
                return (
                  <LearningItemCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={id => handleDeleteLearning(id)}
                  />
                )
              })}
            </div>
          )}

          <LearningItemForm
            open={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingItem(null)
            }}
            onSubmit={handleSubmit}
            item={editingItem}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      </div>
    </>
  )
}
