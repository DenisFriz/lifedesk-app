import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  createContext,
  ReactNode,
  MouseEvent
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DropResult } from '@hello-pangea/dnd'
import { Maximize, Minimize } from 'lucide-react'
import { createPageUrl } from '@/utils'

import NotesPanel from '@/components/notes/NotesPanel'
import QuickCalculatorPanel from '@/components/calculator/QuickCalculatorPanel'
import TimeTrackerPanel from '@/components/time/TimeTrackerPanel'
import AIAssistantPanel from '@/components/ai/AIAssistantPanel'
import EventNotifications from '@/components/calendar/EventNotifications'
import { TimeTrackerProvider } from '@/components/time/TimeTrackerContext'
import type { LayoutContextValue, NavItem as NavItemType } from '@/types'
import LayoutContent from './layouts/default-layout'
import { useAuth } from './lib/AuthContext'
import { useBusinessesQuery } from './hooks/businesses/useBusinessesQuery'
import { BusinessRecord } from './db'

const BUSINESS_SUBMENU_PAGES = [
  'BusinessOverview',
  'BusinessGoals',
  'BusinessTasks',
  'BusinessTransactions',
  'BusinessBudget',
  'Projects',
  'Clients',
  'Marketing'
]

export const LayoutContext = createContext<LayoutContextValue | null>(null)

export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

function findSectionsToExpand(
  items: NavItemType[],
  pathname: string,
  businessId: string | null
): string[] | null {
  for (const item of items) {
    if (item.page) {
      const pathMatches = pathname === createPageUrl(item.page)
      const businessMatches = businessId
        ? String(item.businessId) === String(businessId)
        : !item.businessId
      if (pathMatches && businessMatches) {
        return []
      }
    }
    if (item.children) {
      const result = findSectionsToExpand(item.children, pathname, businessId)
      if (result !== null) {
        return item.expandable && item.section ? [item.section, ...result] : result
      }
    }
  }
  return null
}

interface LayoutProps {
  children: ReactNode
  currentPageName: string
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const prevBusinessesRef = useRef<any[]>([])
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [timeTrackerOpen, setTimeTrackerOpen] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)

  const [aiChatMessages, setAiChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('aiChatMessages')
    return saved ? JSON.parse(saved) : []
  })

  const [hiddenTools, setHiddenTools] = useState<string[]>(() => {
    const saved = localStorage.getItem('hiddenTools')
    return saved ? JSON.parse(saved) : []
  })
  const navRef = useRef<any>(null)

  useEffect(() => {
    const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice()) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase()
      const isEditable = (document.activeElement as HTMLElement)?.isContentEditable
      if (tag === 'input' || tag === 'textarea' || isEditable) return

      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modifier = isMac ? e.ctrlKey : e.altKey
      if (!modifier) return

      if (e.key === '1') {
        e.preventDefault()
        setNotesOpen(o => {
          if (!o) {
            setCalculatorOpen(false)
            setTimeTrackerOpen(false)
            setAiChatOpen(false)
          }
          return !o
        })
      }
      if (e.key === '2') {
        e.preventDefault()
        setTimeTrackerOpen(o => {
          if (!o) {
            setNotesOpen(false)
            setCalculatorOpen(false)
            setAiChatOpen(false)
          }
          return !o
        })
      }
      if (e.key === '3') {
        e.preventDefault()
        setCalculatorOpen(o => {
          if (!o) {
            setNotesOpen(false)
            setTimeTrackerOpen(false)
            setAiChatOpen(false)
          }
          return !o
        })
      }
      if (e.key === '4') {
        e.preventDefault()
        setAiChatOpen(o => {
          if (!o) {
            setNotesOpen(false)
            setCalculatorOpen(false)
            setTimeTrackerOpen(false)
          }
          return !o
        })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    localStorage.setItem('aiChatMessages', JSON.stringify(aiChatMessages))
  }, [aiChatMessages])

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://data.lifedesk.me/CSS/app-styles 2.css'
    document.head.appendChild(link)

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.head.removeChild(link)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    const saved = localStorage.getItem('hiddenSections')
    return saved ? JSON.parse(saved) : []
  })
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('sectionOrder')
    return saved ? JSON.parse(saved) : []
  })
  const [subsectionOrder, setSubsectionOrder] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('subsectionOrder')
    return saved ? JSON.parse(saved) : {}
  })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('expandedSections')
    return saved ? JSON.parse(saved) : {}
  })

  const { data: businesses = [] } = useBusinessesQuery()

  const { user } = useAuth()

  console.log(businesses, 'businesses in Layout')
  useEffect(() => {
    const prevBusinesses = prevBusinessesRef.current
    prevBusinessesRef.current = businesses as any[]

    if (prevBusinesses.length === 0) return

    // URL migration: if current ?businessId is stale, swap it to the new server id
    const urlParams = new URLSearchParams(location.search)
    const currentBusinessId = urlParams.get('businessId')
    if (currentBusinessId) {
      const businessExists = businesses.some(b => String(b.id) === String(currentBusinessId))
      if (!businessExists) {
        const oldBusiness = prevBusinesses.find(b => String(b.id) === String(currentBusinessId))
        if (oldBusiness) {
          const newBusiness = businesses.find(b => b.name === oldBusiness.name)
          if (newBusiness) {
            urlParams.set('businessId', newBusiness.id)
            navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true })
          }
        }
      }
    }

    // expandedSections migration: for every business whose id changed, rename its key
    setExpandedSections(prev => {
      let updated = { ...prev }
      let changed = false
      for (const prevBusiness of prevBusinesses) {
        const newBusiness = businesses.find(b => b.name === prevBusiness.name)

        if (!newBusiness || String(prevBusiness.id) === String(newBusiness.id)) continue
        const oldKey = `business-${prevBusiness.id}`
        const newKey = `business-${newBusiness.id}`
        console.log('Migrating expandedSections key', oldKey, 'to', newKey)
        if (updated[oldKey]) {
          updated[newKey] = true
          delete updated[oldKey]
          changed = true
        }
      }
      if (!changed) return prev

      localStorage.setItem('expandedSections', JSON.stringify(updated))
      return updated
    })
  }, [businesses, location.search, location.pathname, navigate])

  // On a business submenu route with no businessId, inject the currently-open business's id
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    if (urlParams.get('businessId')) return

    const onBusinessPage = BUSINESS_SUBMENU_PAGES.some(
      page => location.pathname === createPageUrl(page)
    )
    if (!onBusinessPage) return

    // Extract businessId from the expanded section key (e.g., 'business-<id>')
    const activeEntry = Object.entries(expandedSections).find(
      ([key, val]) => val === true && key.startsWith('business-') && key !== 'business'
    )
    if (!activeEntry) return

    const businessId = activeEntry[0].slice('business-'.length)
    if (!businessId || businessId === 'undefined') return

    urlParams.set('businessId', businessId)
    navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true })
  }, [location.pathname, location.search, expandedSections, navigate])

  const getBusinessId = (business: BusinessRecord): string =>
    business.id || business.serverId || (business as any)._id || ''

  const getDefaultNavigation = useCallback(
    (): NavItemType[] => [
      {
        name: 'Home',
        page: 'Home',
        iconName: 'Home',
        section: 'main',
        expandable: true,
        children: [
          {
            name: 'Dashboard',
            page: 'Home',
            iconName: 'Home',
            section: 'main'
          },
          {
            name: 'All Goals',
            page: 'MainGoals',
            iconName: 'Target',
            section: 'main'
          },
          {
            name: 'All Tasks',
            page: 'MainTasks',
            iconName: 'ListTodo',
            section: 'main'
          },
          {
            name: 'Calendar',
            page: 'Calendar',
            iconName: 'Calendar',
            section: 'main'
          },
          {
            name: 'Events',
            page: 'MainEvents',
            iconName: 'Clock',
            section: 'main'
          }
        ]
      },
      {
        name: 'Private',
        iconName: 'User',
        section: 'private',
        expandable: true,
        children: [
          {
            name: 'Finance',
            iconName: 'DollarSign',
            section: 'finance',
            expandable: true,
            children: [
              {
                name: 'Accounts',
                page: 'Accounts',
                iconName: 'Landmark',
                section: 'finance'
              },
              {
                name: 'Transactions',
                page: 'Transactions',
                iconName: 'ArrowLeftRight',
                section: 'finance'
              },
              {
                name: 'Analytics',
                page: 'Analytics',
                iconName: 'ChartNoAxesCombined',
                section: 'finance'
              },
              {
                name: 'Budget',
                page: 'Budget',
                iconName: 'Coins',
                section: 'finance'
              },
              {
                name: 'Goals',
                page: 'FinancesGoals',
                iconName: 'Target',
                section: 'finance'
              },
              {
                name: 'Tasks',
                page: 'FinancesTasks',
                iconName: 'ListTodo',
                section: 'finance'
              }
            ]
          },
          {
            name: 'Assets',
            iconName: 'Wallet',
            section: 'assets',
            expandable: true,
            children: [
              {
                name: 'Overview',
                page: 'Overview',
                iconName: 'Home',
                section: 'assets'
              },
              {
                name: 'Vehicles',
                page: 'AssetsCars',
                iconName: 'Car',
                section: 'assets'
              },
              {
                name: 'Estates',
                page: 'AssetsEstates',
                iconName: 'Home',
                section: 'assets'
              },
              {
                name: 'Other Assets',
                page: 'AssetsOther',
                iconName: 'Package',
                section: 'assets'
              },
              {
                name: 'Goals',
                page: 'AssetsGoals',
                iconName: 'Target',
                section: 'assets'
              },
              {
                name: 'Tasks',
                page: 'AssetsTasks',
                iconName: 'ListTodo',
                section: 'assets'
              }
            ]
          },
          {
            name: 'Health',
            iconName: 'Heart',
            section: 'health',
            expandable: true,
            children: [
              {
                name: 'Overview',
                page: 'HealthBody',
                iconName: 'Home',
                section: 'health'
              },
              {
                name: 'Tracking',
                page: 'BodyProblems',
                iconName: 'Activity',
                section: 'health'
              },
              {
                name: 'Medical Documents',
                page: 'HealthDocuments',
                iconName: 'FileText',
                section: 'health'
              },
              {
                name: 'Goals',
                page: 'BodyGoals',
                iconName: 'Target',
                section: 'health'
              },
              {
                name: 'Tasks',
                page: 'BodyTasks',
                iconName: 'ListTodo',
                section: 'health'
              }
            ]
          },
          {
            name: 'Fitness',
            iconName: 'Dumbbell',
            section: 'fitness',
            expandable: true,
            children: [
              {
                name: 'Overview',
                page: 'Fitness',
                iconName: 'Home',
                section: 'fitness'
              },
              {
                name: 'Workouts',
                page: 'Workouts',
                iconName: 'Dumbbell',
                section: 'fitness'
              },
              {
                name: 'Workout Plans',
                page: 'WorkoutPlans',
                iconName: 'Calendar',
                section: 'fitness'
              },
              {
                name: 'Measurements',
                page: 'BodyMeasurements',
                iconName: 'Weight',
                section: 'fitness'
              },
              {
                name: 'Progress Photos',
                page: 'ProgressPhotos',
                iconName: 'Camera',
                section: 'fitness'
              },
              {
                name: 'Goals',
                page: 'FitnessGoals',
                iconName: 'Target',
                section: 'fitness'
              },
              {
                name: 'Tasks',
                page: 'FitnessTasks',
                iconName: 'ListTodo',
                section: 'fitness'
              }
            ]
          },
          {
            name: 'Hobbies',
            iconName: 'Palette',
            section: 'hobbies',
            expandable: true,
            children: [
              {
                name: 'Overview',
                page: 'Hobbies',
                iconName: 'Home',
                section: 'hobbies'
              },
              {
                name: 'Goals',
                page: 'HobbiesGoals',
                iconName: 'Target',
                section: 'hobbies'
              },
              {
                name: 'Tasks',
                page: 'HobbiesTasks',
                iconName: 'ListTodo',
                section: 'hobbies'
              }
            ]
          },
          {
            name: 'Learning & Development',
            iconName: 'Brain',
            section: 'learning',
            expandable: true,
            children: [
              {
                name: 'Overview',
                page: 'Learning',
                iconName: 'Home',
                section: 'learning'
              },
              {
                name: 'Goals',
                page: 'LearningGoals',
                iconName: 'Target',
                section: 'learning'
              },
              {
                name: 'Tasks',
                page: 'LearningTasks',
                iconName: 'ListTodo',
                section: 'learning'
              }
            ]
          },
          {
            name: 'Relationships',
            iconName: 'Users',
            section: 'relationships',
            expandable: true,
            children: [
              {
                name: 'Overview',
                page: 'Relationships',
                iconName: 'Home',
                section: 'relationships'
              },
              {
                name: 'Goals',
                page: 'RelationshipsGoals',
                iconName: 'Target',
                section: 'relationships'
              },
              {
                name: 'Tasks',
                page: 'RelationshipsTasks',
                iconName: 'ListTodo',
                section: 'relationships'
              }
            ]
          }
        ]
      },
      {
        name: 'Business',
        iconName: 'Briefcase',
        section: 'business',
        expandable: true,
        children: [
          ...businesses.map(business => ({
            name: business.name,
            iconName: 'Briefcase',
            section: `business-${getBusinessId(business)}`,
            expandable: true,
            businessId: getBusinessId(business),
            children: [
              {
                name: 'Overview',
                page: 'BusinessOverview',
                iconName: 'Home',
                businessId: getBusinessId(business),
                section: `business-${getBusinessId(business)}`
              },
              {
                name: 'Goals',
                page: 'BusinessGoals',
                iconName: 'Target',
                businessId: getBusinessId(business),
                section: `business-${getBusinessId(business)}`
              },
              {
                name: 'Tasks',
                page: 'BusinessTasks',
                iconName: 'ListTodo',
                businessId: getBusinessId(business),
                section: `business-${getBusinessId(business)}`
              },
              {
                name: 'Transactions',
                page: 'BusinessTransactions',
                iconName: 'DollarSign',
                businessId: getBusinessId(business),
                section: `business-${getBusinessId(business)}`
              },
              {
                name: 'Budget',
                page: 'BusinessBudget',
                iconName: 'TrendingUp',
                businessId: getBusinessId(business),
                section: `business-${getBusinessId(business)}`
              },
              {
                name: 'Projects',
                page: 'Projects',
                iconName: 'Briefcase',
                businessId: getBusinessId(business),
                section: `business-${getBusinessId(business)}`
              },
              {
                name: 'Clients',
                page: 'Clients',
                iconName: 'Handshake',
                businessId: getBusinessId(business),
                section: `business-${getBusinessId(business)}`
              },
              {
                name: 'Marketing',
                page: 'Marketing',
                iconName: 'Megaphone',
                businessId: getBusinessId(business),
                section: `business-${getBusinessId(business)}`
              }
            ]
          })),
          {
            name: 'Manage Businesses',
            page: 'ManageBusinesses',
            iconName: 'Settings',
            section: 'business'
          }
        ]
      },
      {
        name: 'Community Hub',
        page: 'CommunityHub',
        iconName: 'Lightbulb',
        section: 'community',
        expandable: false
      },
      {
        name: 'Help / FAQ',
        url: '#',
        iconName: 'HelpCircle',
        section: 'help',
        expandable: false,
        comingSoon: true
      }
    ],
    [businesses]
  )

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const currentBusinessId = urlParams.get('businessId')
    const navigation = getDefaultNavigation()
    const sectionsToExpand = findSectionsToExpand(navigation, location.pathname, currentBusinessId)

    if (!sectionsToExpand) return

    setExpandedSections(prev => {
      const allAlreadySet = sectionsToExpand.every(s => prev[s])
      if (allAlreadySet) return prev
      const newExpanded = { ...prev }
      sectionsToExpand.forEach(section => {
        newExpanded[section] = true
      })
      localStorage.setItem('expandedSections', JSON.stringify(newExpanded))
      return newExpanded
    })
  }, [location.pathname, location.search, getDefaultNavigation])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed))
  }, [collapsed])

  const toggleSection = useCallback((section: string, event?: MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (!section || /undefined|null/.test(section)) return

    setExpandedSections(prev => {
      const newExpanded = {
        ...prev,
        [section]: !prev[section]
      }
      localStorage.setItem('expandedSections', JSON.stringify(newExpanded))
      return newExpanded
    })
  }, [])

  const toggleVisibility = useCallback((itemName: string) => {
    setHiddenSections(prev => {
      const newHidden = prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
      localStorage.setItem('hiddenSections', JSON.stringify(newHidden))
      return newHidden
    })
  }, [])

  const toggleToolVisibility = useCallback((toolName: string) => {
    setHiddenTools(prev => {
      const newHidden = prev.includes(toolName)
        ? prev.filter(name => name !== toolName)
        : [...prev, toolName]
      localStorage.setItem('hiddenTools', JSON.stringify(newHidden))
      return newHidden
    })
  }, [])

  const getOrderedSubsections = useCallback(
    (parentItem: NavItemType): NavItemType[] => {
      if (!parentItem.children) return []
      const parentOrder = subsectionOrder[parentItem.name] || []

      if (parentOrder.length === 0) return parentItem.children

      const ordered = [...parentItem.children].sort((a, b) => {
        const indexA = parentOrder.indexOf(a.name)
        const indexB = parentOrder.indexOf(b.name)

        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })

      if (parentItem.name === 'Business') {
        const manageBusinessesIndex = ordered.findIndex(item => item.name === 'Manage Businesses')
        if (manageBusinessesIndex !== -1 && manageBusinessesIndex !== ordered.length - 1) {
          const [manageBusinesses] = ordered.splice(manageBusinessesIndex, 1)
          ordered.push(manageBusinesses)
        }
      }

      return ordered
    },
    [subsectionOrder]
  )

  const getOrderedNavigation = useCallback((): NavItemType[] => {
    const navigation = getDefaultNavigation()

    if (sectionOrder.length === 0) return navigation

    const ordered = [...navigation].sort((a, b) => {
      const indexA = sectionOrder.indexOf(a.name)
      const indexB = sectionOrder.indexOf(b.name)

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })

    return ordered
  }, [sectionOrder, getDefaultNavigation])

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      if (result.type === 'main') {
        const items = Array.from(getOrderedNavigation())
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        const newOrder = items.map(item => item.name)
        setSectionOrder(newOrder)
        localStorage.setItem('sectionOrder', JSON.stringify(newOrder))
      }

      if (result.type.startsWith('subsection-')) {
        const parentName = result.type.replace('subsection-', '')
        const parentItem = getOrderedNavigation().find(item => item.name === parentName)

        if (!parentItem || !parentItem.children) return

        const items = Array.from(getOrderedSubsections(parentItem))
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        const newOrder = items.map(item => item.name)
        const newSubsectionOrder = {
          ...subsectionOrder,
          [parentName]: newOrder
        }
        setSubsectionOrder(newSubsectionOrder)
        localStorage.setItem('subsectionOrder', JSON.stringify(newSubsectionOrder))
      }
    },
    [subsectionOrder, sectionOrder, getOrderedNavigation, getOrderedSubsections]
  )

  return (
    <TimeTrackerProvider>
      <LayoutContext.Provider
        value={{
          hiddenSections,
          isHidden: name => {
            if (hiddenSections.includes(name)) return true
            const parts = name.split(' > ')
            for (let i = 1; i < parts.length; i++) {
              const parentPath = parts.slice(0, i).join(' > ')
              if (hiddenSections.includes(parentPath)) return true
            }
            return false
          }
        }}
      >
        <EventNotifications />
        <NotesPanel collapsed={collapsed} isOpen={notesOpen} setIsOpen={setNotesOpen} />
        <QuickCalculatorPanel
          collapsed={collapsed}
          isOpen={calculatorOpen}
          setIsOpen={setCalculatorOpen}
        />
        <TimeTrackerPanel
          collapsed={collapsed}
          isOpen={timeTrackerOpen}
          setIsOpen={setTimeTrackerOpen}
        />
        <AIAssistantPanel
          isOpen={aiChatOpen}
          setIsOpen={setAiChatOpen}
          messages={aiChatMessages}
          setMessages={setAiChatMessages}
          collapsed={collapsed}
        />

        <Button
          onClick={toggleFullscreen}
          size="icon"
          variant="ghost"
          className="fullscreen-toggle-btn fullscreen-button hidden lg:flex fixed top-0 right-4 z-50 h-10 w-10 rounded-lg shadow-lg bg-white hover:bg-slate-100 border border-slate-200"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </Button>

        <LayoutContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          editMode={editMode}
          setEditMode={setEditMode}
          notesOpen={notesOpen}
          setNotesOpen={setNotesOpen}
          calculatorOpen={calculatorOpen}
          setCalculatorOpen={setCalculatorOpen}
          timeTrackerOpen={timeTrackerOpen}
          setTimeTrackerOpen={setTimeTrackerOpen}
          aiChatOpen={aiChatOpen}
          setAiChatOpen={setAiChatOpen}
          hiddenTools={hiddenTools}
          toggleToolVisibility={toggleToolVisibility}
          hiddenSections={hiddenSections}
          expandedSections={expandedSections}
          sectionOrder={sectionOrder}
          subsectionOrder={subsectionOrder}
          toggleSection={toggleSection}
          toggleVisibility={toggleVisibility}
          handleDragEnd={handleDragEnd}
          getOrderedNavigation={getOrderedNavigation}
          getOrderedSubsections={getOrderedSubsections}
          navRef={navRef}
          user={user}
          businesses={businesses}
          location={location}
          currentPageName={currentPageName}
        >
          {children}
        </LayoutContent>
      </LayoutContext.Provider>
    </TimeTrackerProvider>
  )
}
