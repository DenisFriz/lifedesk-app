import { Tabs } from '@/components/ui/tabs'
import GoalTable from '@/components/sections/GoalTable'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Target } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useEntityTabs } from '@/hooks/useEntityTabs'

type FilterType = 'all' | 'important' | 'category' | 'business'

type TabConfig = {
  value: string
  label: string
  filterType: FilterType
  category?: string
  section?: string
}

const tabs: TabConfig[] = [
  {
    value: 'all',
    label: 'All Goals',
    filterType: 'all'
  },
  {
    value: 'important',
    label: 'Important',
    filterType: 'important'
  },

  {
    value: 'finances',
    label: 'Finance',
    filterType: 'category',
    category: 'finances',
    section: 'Private > Finance'
  },
  {
    value: 'assets',
    label: 'Assets',
    filterType: 'category',
    category: 'assets',
    section: 'Private > Assets'
  },
  {
    value: 'health',
    label: 'Health',
    filterType: 'category',
    category: 'health_body',
    section: 'Private > Health'
  },
  {
    value: 'fitness',
    label: 'Fitness',
    filterType: 'category',
    category: 'fitness',
    section: 'Private > Fitness'
  },
  {
    value: 'hobbies',
    label: 'Hobbies',
    filterType: 'category',
    category: 'hobbies',
    section: 'Private > Hobbies'
  },
  {
    value: 'learning',
    label: 'Learning',
    filterType: 'category',
    category: 'learning',
    section: 'Private > Learning & Development'
  },
  {
    value: 'relationships',
    label: 'Relationships',
    filterType: 'category',
    category: 'relationships',
    section: 'Private > Relationships'
  }
]

export default function MainGoals() {
  const { activeTab, setActiveTab, visibleTabs, overflowTabs, isScrolled, headerRef } =
    useEntityTabs({
      tabs,
      storageKey: 'mainGoalsActiveTab'
    })

  return (
    <>
      <Helmet>
        <title>Main Goals | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen page-bg">
        <div className="max-w-7xl mx-auto !px-4 !sm:px-6 !lg:px-8">
          {/* Page Title - Sticky on mobile when scrolled */}
          {isScrolled && (
            <div className="all-goals-sticky-header lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="maingoals-sticky-title text-sm font-normal text-slate-900 text-center">
                  All Goals
                </h1>
              </div>
            </div>
          )}

          {/* Page Header - Normal position */}
          <div ref={headerRef} className="all-goals-header py-6 sm:py-8">
            <h1 className="maingoals-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <Target className="w-9 h-9 text-black" />
              All Goals
            </h1>
            <p className="all-goals-subtitle text-sm sm:text-base text-slate-600 text-center lg:text-left">
              All your goals across all life areas
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={value => {
              setActiveTab(value)
              localStorage.setItem('mainGoalsActiveTab', value)
            }}
            className="all-goals-tabs space-y-6"
          >
            <div className="all-goals-tab-container tab-container rounded-lg p-1">
              <div className="all-goals-tabs-wrapper flex flex-wrap gap-1">
                {visibleTabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setActiveTab(tab.value)
                      localStorage.setItem('mainGoalsActiveTab', tab.value)
                    }}
                    className={`all-goals-tab-button px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.value
                        ? 'bg-white text-slate-900 shadow-sm all-goals-tab-active'
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
                        className={`all-goals-more-button px-3 py-1.5 h-auto text-sm font-medium rounded-md ${
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
                      className="all-goals-more-menu max-h-[300px] overflow-y-auto"
                    >
                      {overflowTabs.map(tab => (
                        <DropdownMenuItem
                          key={tab.value}
                          onClick={() => {
                            setActiveTab(tab.value)
                            localStorage.setItem('mainGoalsActiveTab', tab.value)
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

            {tabs.map(
              tab =>
                activeTab === tab.value && (
                  <GoalTable key={tab.value} filterType={tab.filterType} category={tab.category} />
                )
            )}
          </Tabs>
        </div>
      </div>
    </>
  )
}
