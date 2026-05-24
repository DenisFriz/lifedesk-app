import { Tabs, TabsContent } from '@/components/ui/tabs'
import TaskTable from '@/components/sections/TaskTable'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ChevronDown, ListTodo } from 'lucide-react'
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

export default function MainTasks() {
  const { activeTab, setActiveTab, visibleTabs, overflowTabs, isScrolled, headerRef } =
    useEntityTabs({
      tabs,
      storageKey: 'mainTasksActiveTab'
    })

  return (
    <>
      <Helmet>
        <title>Main Tasks</title>
      </Helmet>
      <div className="all-tasks-page min-h-screen page-bg">
        <div className="all-tasks-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="all-tasks-sticky-header lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="all-tasks-sticky-title text-sm font-normal text-slate-900 text-center">
                  All Tasks
                </h1>
              </div>
            </div>
          )}

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
            <div ref={headerRef} className="all-tasks-tab-container tab-container rounded-lg p-1">
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

            {tabs.map(
              tab =>
                activeTab === tab.value && (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className={`all-tasks-content-${tab.value}`}
                  >
                    <TaskTable filterType={tab.filterType} category={tab.category} />
                  </TabsContent>
                )
            )}
          </Tabs>
        </div>
      </div>
    </>
  )
}
