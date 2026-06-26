import { useState, useEffect, useRef } from 'react'
import { Palette as PaletteIcon, Plus, Search, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Link } from 'react-router-dom'
import HobbyCard from '@/components/hobbies/HobbyCard'
import HobbyForm from '@/components/hobbies/HobbyForm'
import OverLimitItem from '@/components/subscription/OverLimitItem'
import { Helmet } from 'react-helmet-async'
import { useHobbiesQuery } from '@/hooks/hobbies/useHobbieQuery'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useHobbyMutations } from '@/hooks/hobbies/useHobbyMutations'
import { CreateHobbyInput } from '@/repositories/hobby.repository'
import { HobbyRecord } from '@/db'

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'music', label: '🎵 Music' },
  { value: 'arts_crafts', label: '🎨 Arts & Crafts' },
  { value: 'sports_outdoor', label: '🏃 Sports & Outdoor' },
  { value: 'gaming', label: '🎮 Gaming' },
  { value: 'cooking_food', label: '🍳 Cooking & Food' },
  { value: 'reading_writing', label: '📚 Reading & Writing' },
  { value: 'technology', label: '💻 Technology' },
  { value: 'collecting', label: '🪙 Collecting' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'other', label: '⭐ Other' }
] as const

type Hobby = {
  id: string
  name: string
  description?: string
  category?: string
  status?: string
  is_deleted: boolean
  created_date: string
}

export default function Hobbies() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingHobby, setEditingHobby] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const headerRef = useRef(null)

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

  const { canCreate, data } = useUserLimit()

  const { data: hobbies = [] } = useHobbiesQuery()

  const atLimit = !canCreate('hobbies')

  const { createMutation, updateMutation, deleteMutation } = useHobbyMutations()

  const handleCreateHobby = async (data: CreateHobbyInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
    }
  }

  const handleUpdateHobby = async ({ id, data }: { id: string; data: Partial<HobbyRecord> }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingHobby(null)
    }
  }

  const handleDeleteHobby = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingHobby(null)
    }
  }

  const handleSubmit = (data: CreateHobbyInput) => {
    if (editingHobby) {
      handleUpdateHobby({ id: editingHobby.id, data })
    } else {
      handleCreateHobby(data)
    }
  }

  const handleEdit = (hobby: Hobby) => {
    setEditingHobby(hobby)
    setShowForm(true)
  }

  const filtered = hobbies.filter(h => {
    const matchSearch =
      !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || h.category === filterCategory
    const matchStatus = filterStatus === 'all' || h.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const activeCount = hobbies.filter(h => h.status === 'active').length

  return (
    <>
      <Helmet>
        <title>Hobbies | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto !pb-4 !px-4 !sm:px-6 !lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="text-sm font-normal text-slate-900 text-center">
                  Hobbies & Interests
                </h1>
              </div>
            </div>
          )}

          <div
            ref={headerRef}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-6 sm:py-8"
          >
            <div className="text-center lg:text-left w-full lg:w-auto">
              <h1 className="text-3xl sm:text-4xl flex-col min-[480px]:flex-row font-bold text-slate-900 mb-2 flex items-center gap-3">
                <PaletteIcon className="w-8 h-8" />
                Hobbies & Interests
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {activeCount > 0
                  ? `${activeCount} active ${activeCount === 1 ? 'hobby' : 'hobbies'}`
                  : 'Track your leisure activities and passions'}
              </p>
            </div>
            {atLimit ? (
              <Link to="/upgrade" className="w-full lg:w-auto">
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Limit reached ({data?.usage?.hobbies || 0}/{data?.limits?.hobbies})
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  setEditingHobby(null)
                  setShowForm(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-700 w-full lg:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Hobby
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search hobbies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-44 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_pause">On Pause</SelectItem>
                <SelectItem value="want_to_start">Want to Start</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {hobbies.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <PaletteIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">No hobbies added yet</p>
              <p className="text-slate-500 mb-6">
                Add your hobbies to track your passions and leisure activities
              </p>
              {!atLimit && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Hobby
                </Button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No hobbies match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(hobby => {
                /* return atLimit ? (
                  <OverLimitItem key={hobby.id}>
                    <HobbyCard hobby={hobby} onEdit={() => {}} onDelete={() => {}} />
                  </OverLimitItem>
                ) : (
                  <HobbyCard
                    key={hobby.id}
                    hobby={hobby}
                    onEdit={handleEdit}
                    onDelete={id => handleDeleteHobby(id)}
                  />
                ) */

                return (
                  <HobbyCard
                    key={hobby.id}
                    hobby={hobby}
                    onEdit={handleEdit}
                    onDelete={id => handleDeleteHobby(id)}
                  />
                )
              })}
            </div>
          )}

          <HobbyForm
            open={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingHobby(null)
            }}
            onSubmit={handleSubmit}
            hobby={editingHobby}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      </div>
    </>
  )
}
