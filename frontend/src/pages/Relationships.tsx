import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Users, Plus, Search, Gift, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { differenceInDays, parseISO, addYears, isAfter, format } from 'date-fns'
import RelationshipStats from '@/components/relationships/RelationshipStats'
import ContactCard from '@/components/relationships/ContactCard'
import ContactForm from '@/components/relationships/ContactForm'
import OverLimitItem from '@/components/subscription/OverLimitItem'
import { Helmet } from 'react-helmet-async'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useRelationShipMutations } from '@/hooks/relationships/useRelationShipMutations'
import { CreateRelationShipInput } from '@/repositories/relationships.repository'
import { RelationShipRecord } from '@/db'
import { useRelationShipsQuery } from '@/hooks/relationships/useRelationShipsQuery'

const FREQUENCY_DAYS = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  twice_a_year: 180,
  yearly: 365
} as const

const REL_TABS = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: '⚠ Needs Check-in' },
  { value: 'family', label: 'Family' },
  { value: 'close_friend', label: 'Close Friends' },
  { value: 'friend', label: 'Friends' },
  { value: 'colleague', label: 'Colleagues' }
] as const

type Contact = {
  id: string
  name: string
  relationship?: 'family' | 'friend' | 'close_friend' | 'colleague' | string
  status?: 'active' | 'inactive' | string
  is_deleted?: boolean
  last_contact_date?: string
  check_in_frequency?:
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'twice_a_year'
    | 'yearly'
    | string
  birthday?: string
}

export default function Relationships() {
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [relFilter, setRelFilter] = useState('all')
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

  const { canCreate, data } = useUserLimit()

  const { data: relationships } = useRelationShipsQuery()

  const atLimit = canCreate('relationships')

  const { createMutation, updateMutation, deleteMutation } = useRelationShipMutations()

  const handleCreateRelationship = async (data: CreateRelationShipInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
    }
  }

  const handleUpdateRelationship = async ({
    id,
    data
  }: {
    id: string
    data: Partial<RelationShipRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingContact(null)
    }
  }

  const handleDeleteRelationship = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingContact(null)
    }
  }

  const handleSubmit = (data: CreateRelationShipInput) => {
    if (editingContact) {
      handleUpdateRelationship({ id: editingContact.id, data })
    } else {
      handleCreateRelationship(data)
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setShowForm(true)
  }

  const handleCheckedIn = (contact: any) => {
    handleUpdateRelationship({
      id: contact.id,
      data: { ...contact, last_contact_date: format(new Date(), 'yyyy-MM-dd') }
    })
  }

  const isOverdue = (c: Contact) => {
    if (!c.check_in_frequency || !c.last_contact_date) return false
    return (
      differenceInDays(new Date(), parseISO(c.last_contact_date)) >=
      FREQUENCY_DAYS[c.check_in_frequency]
    )
  }

  const filtered =
    relationships?.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (relFilter === 'overdue') return isOverdue(c)
      if (relFilter !== 'all') return c.relationship === relFilter
      return true
    }) || []

  // Sort: overdue first, then by name
  const sorted = [...filtered].sort((a, b) => {
    const aOver = isOverdue(a) ? 0 : 1
    const bOver = isOverdue(b) ? 0 : 1
    if (aOver !== bOver) return aOver - bOver
    return a.name.localeCompare(b.name)
  })

  // Upcoming birthdays in next 30 days
  const upcomingBirthdays = relationships
    ?.filter(c => {
      if (!c.birthday) return false
      const bday = parseISO(c.birthday)
      const today = new Date()
      let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
      if (!isAfter(next, today)) next = addYears(next, 1)
      return differenceInDays(next, today) <= 30
    })
    .sort((a, b) => {
      const today = new Date()

      const getNext = (c: Contact) => {
        if (!c.birthday) return new Date(0)

        const bday = parseISO(c.birthday)
        let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())

        if (!isAfter(next, today)) {
          next = addYears(next, 1)
        }

        return next
      }

      return getNext(a).getTime() - getNext(b).getTime()
    })

  const overdueCount = relationships?.filter(isOverdue).length

  return (
    <>
      <Helmet>
        <title>Relationships | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="text-sm font-normal text-slate-900 text-center">
                  Relationships & Friends
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
                <Users className="w-8 h-8 sm:w-9 sm:h-9" />
                Relationships & Friends
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Stay connected with the people who matter most
              </p>
            </div>
            {atLimit ? (
              <Link to="/upgrade" className="w-full lg:w-auto">
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Limit reached ({data?.usage?.relationships}/{data?.limits?.relationships}),
                  Upgrade to Add More
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  setEditingContact(null)
                  setShowForm(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-700 w-full lg:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>

          <RelationshipStats contacts={relationships} />

          {/* Upcoming Birthdays Banner */}
          {upcomingBirthdays?.length > 0 && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <Gift className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-pink-800 mb-1">Upcoming Birthdays 🎂</p>
                <div className="flex flex-wrap gap-2">
                  {upcomingBirthdays?.map(c => {
                    const today = new Date()
                    const bday = parseISO(c.birthday)
                    let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
                    if (!isAfter(next, today)) next = addYears(next, 1)
                    const days = differenceInDays(next, today)
                    return (
                      <span
                        key={c.id}
                        className="text-xs bg-white border border-pink-200 text-pink-700 px-2 py-0.5 rounded-full"
                      >
                        {c.name} —{' '}
                        {days === 0 ? 'Today! 🎉' : `in ${days}d (${format(next, 'MMM d')})`}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {REL_TABS.map(tab => {
              const count =
                tab.value === 'all'
                  ? relationships?.length
                  : tab.value === 'overdue'
                    ? overdueCount
                    : relationships?.filter(c => c.relationship === tab.value).length
              return (
                <button
                  key={tab.value}
                  onClick={() => setRelFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    relFilter === tab.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Contact List */}
          {sorted.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">
                {relationships?.length === 0
                  ? 'Add your first contact to get started'
                  : 'No contacts match your filters'}
              </p>
              {relationships?.length === 0 && !atLimit && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Contact
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {sorted.map(contact => {
                const overLimit = canCreate('relationships')
                return overLimit ? (
                  <OverLimitItem key={contact.id}>
                    <ContactCard
                      contact={contact}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onCheckedIn={() => {}}
                    />
                  </OverLimitItem>
                ) : (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEdit={handleEdit}
                    onDelete={id => handleDeleteRelationship(id)}
                    onCheckedIn={handleCheckedIn}
                  />
                )
              })}
            </div>
          )}

          <ContactForm
            open={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingContact(null)
            }}
            onSubmit={handleSubmit}
            contact={editingContact}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      </div>
    </>
  )
}
