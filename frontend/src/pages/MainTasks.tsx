import React, { useState, useEffect, useRef } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import TaskTable from '@/components/sections/TaskTable'
import { useLayout } from '@/Layout'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ChevronDown, ListTodo } from 'lucide-react'

export default function MainTasks() {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('mainTasksActiveTab')
    return saved || 'all'
  })
  const { isHidden } = useLayout()
  const [visibleTabs, setVisibleTabs] = useState([])
  const [overflowTabs, setOverflowTabs] = useState([])
  const [isScrolled, setIsScrolled] = useState(false)
  const tabsRef = useRef(null)
  const headerRef = useRef(null)

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.filter({ is_deleted: false }, 'order')
  })

  const getOrderedCategories = () => {
    const categories = [
      { key: 'finances', name: 'Finance', section: 'Private > Finance' },
      { key: 'assets', name: 'Assets', section: 'Private > Assets' },
      { key: 'health', name: 'Health', section: 'Private > Health' },
      { key: 'fitness', name: 'Fitness', section: 'Private > Fitness' },
      { key: 'hobbies', name: 'Hobbies', section: 'Private > Hobbies' },
      { key: 'learning', name: 'Learning', section: 'Private > Learning & Development' },
      { key: 'relationships', name: 'Relationships', section: 'Private > Relationships' }
    ]

    const saved = localStorage.getItem('subsectionOrder')
    const subsectionOrder = saved ? JSON.parse(saved) : {}
    const privateOrder = subsectionOrder['Private'] || []

    if (privateOrder.length === 0) return categories

    return [...categories].sort((a, b) => {
      const nameA = a.section.replace('Private > ', '')
      const nameB = b.section.replace('Private > ', '')
      const indexA = privateOrder.indexOf(nameA)
      const indexB = privateOrder.indexOf(nameB)

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })
  }

  const getOrderedBusinesses = () => {
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
  const getSectionOrder = () => {
    const saved = localStorage.getItem('sectionOrder')
    return saved ? JSON.parse(saved) : []
  }

  const sectionOrder = getSectionOrder()
  const businessIndex = sectionOrder.indexOf('Business')
  const privateIndex = sectionOrder.indexOf('Private')
  const businessBeforePrivate =
    businessIndex !== -1 && privateIndex !== -1 && businessIndex < privateIndex

  const privateTabs = orderedCategories.map(cat => ({
    value: cat.key,
    label: cat.name,
    section: cat.section
  }))
  const businessTabs = orderedBusinesses.map(business => ({
    value: `business-${business.id}`,
    label: business.name,
    section: `Business > ${business.name}`
  }))

  const allTabs = React.useMemo(() => {
    return [
      { value: 'all', label: 'All Tasks' },
      { value: 'important', label: 'Important' },
      ...(businessBeforePrivate
        ? [...businessTabs, ...privateTabs]
        : [...privateTabs, ...businessTabs])
    ].filter(tab => !('section' in tab) || !isHidden((tab as any).section))
  }, [businesses.length])

  useEffect(() => {
    const calculateVisibleTabs = () => {
      // On mobile/tablet, show first 12 tabs (roughly 3 rows), rest in dropdown
      const maxVisible = window.innerWidth < 640 ? 6 : window.innerWidth < 1024 ? 9 : 12
      setVisibleTabs(allTabs.slice(0, maxVisible))
      setOverflowTabs(allTabs.slice(maxVisible))
    }

    calculateVisibleTabs()
    window.addEventListener('resize', calculateVisibleTabs)
    return () => window.removeEventListener('resize', calculateVisibleTabs)
  }, [allTabs])

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

  return (
    <div className="all-tasks-page min-h-screen page-bg">
      <div className="all-tasks-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title - Sticky on mobile when scrolled */}
        {isScrolled && (
          <div className="all-tasks-sticky-header lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="py-3">
              <h1 className="all-tasks-sticky-title text-sm font-normal text-slate-900 text-center">
                All Tasks
              </h1>
            </div>
          </div>
        )}

        {/* Page Header - Normal position */}
        <div ref={headerRef} className="all-tasks-header py-6 sm:py-8">
          <h1 className="all-tasks-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
            <ListTodo className="w-9 h-9 text-black" />
            All Tasks
          </h1>
          <p className="all-tasks-subtitle text-sm sm:text-base text-slate-600 text-center lg:text-left">
            All your tasks across all categories and life areas
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={value => {
            setActiveTab(value)
            localStorage.setItem('mainTasksActiveTab', value)
          }}
          className="all-tasks-tabs space-y-6"
        >
          <div ref={tabsRef} className="all-tasks-tab-container tab-container rounded-lg p-1">
            <div className="all-tasks-tabs-wrapper flex flex-wrap gap-1">
              {visibleTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setActiveTab(tab.value)
                    localStorage.setItem('mainTasksActiveTab', tab.value)
                  }}
                  className={`all-tasks-tab-button px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.value
                      ? 'bg-white text-slate-900 shadow-sm all-tasks-tab-active'
                      : 'bg-transparent text-[#475569] hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {overflowTabs.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`all-tasks-more-button px-3 py-1.5 h-auto text-sm font-medium rounded-md ${
                        overflowTabs.some(t => t.value === activeTab)
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'bg-transparent text-[#475569] hover:bg-white/50'
                      }`}
                    >
                      More <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="all-tasks-more-menu max-h-[300px] overflow-y-auto"
                  >
                    {overflowTabs.map(tab => (
                      <DropdownMenuItem
                        key={tab.value}
                        onClick={() => {
                          setActiveTab(tab.value)
                          localStorage.setItem('mainTasksActiveTab', tab.value)
                        }}
                        className={activeTab === tab.value ? 'bg-slate-100' : ''}
                      >
                        {tab.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <TabsContent value="all" className="all-tasks-content-all">
            <TaskTable filterType="all" isActive={activeTab === 'all'} />
          </TabsContent>

          <TabsContent value="important" className="all-tasks-content-important">
            <TaskTable filterType="important" isActive={activeTab === 'important'} />
          </TabsContent>

          <TabsContent value="finances" className="all-tasks-content-finances">
            <TaskTable
              filterType="category"
              category="finances"
              isActive={activeTab === 'finances'}
            />
          </TabsContent>

          <TabsContent value="assets" className="all-tasks-content-assets">
            <TaskTable filterType="category" category="assets" isActive={activeTab === 'assets'} />
          </TabsContent>

          <TabsContent value="health" className="all-tasks-content-health">
            <TaskTable
              filterType="category"
              category="health_body"
              isActive={activeTab === 'health'}
            />
          </TabsContent>

          <TabsContent value="fitness" className="all-tasks-content-fitness">
            <TaskTable
              filterType="category"
              category="fitness"
              isActive={activeTab === 'fitness'}
            />
          </TabsContent>

          <TabsContent value="hobbies" className="all-tasks-content-hobbies">
            <TaskTable
              filterType="category"
              category="hobbies"
              isActive={activeTab === 'hobbies'}
            />
          </TabsContent>

          <TabsContent value="learning" className="all-tasks-content-learning">
            <TaskTable
              filterType="category"
              category="learning"
              isActive={activeTab === 'learning'}
            />
          </TabsContent>

          <TabsContent value="relationships" className="all-tasks-content-relationships">
            <TaskTable
              filterType="category"
              category="relationships"
              isActive={activeTab === 'relationships'}
            />
          </TabsContent>

          {orderedBusinesses.map(business => (
            <TabsContent
              key={business.id}
              value={`business-${business.id}`}
              className={`all-tasks-content-business-${business.id}`}
            >
              <TaskTable
                filterType="business"
                businessId={business.id}
                isActive={activeTab === `business-${business.id}`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
