import { useEffect, useRef, memo, ReactNode, Dispatch, SetStateAction, MouseEvent } from 'react'

import { Link, useLocation } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Scrollbars } from 'react-custom-scrollbars-2'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

import {
  Home,
  User as UserIcon,
  Heart,
  Brain,
  Dumbbell,
  Wallet,
  Briefcase,
  Car,
  Activity,
  AlertCircle,
  Target,
  ListTodo,
  DollarSign,
  Package,
  Settings,
  TrendingUp,
  Calendar,
  CalendarCheck,
  Clock,
  Weight,
  Palette,
  Users,
  Handshake,
  Lightbulb,
  Grid3x3,
  Megaphone,
  Camera,
  FileText,
  Landmark,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Coins,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Menu,
  StickyNote,
  Calculator,
  Sparkles,
  Pause,
  Play,
  Square,
  Crown,
  Zap,
  Rocket,
  HelpCircle,
  LucideIcon,
  CircleHelp
} from 'lucide-react'

import { useTimeTracker } from '@/components/time/TimeTrackerContext'
import type { NavItem as NavItemType, User } from '@/types'
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'

const PageContent = memo(({ children }: { children: ReactNode }) => <>{children}</>)

interface Tool {
  id: string
  icon: LucideIcon
  color: string
  bgClass: string
  label: string
  shortcut: string
  onClick: () => void
  badge?: boolean
}

interface NavItemProps {
  item: NavItemType
  level?: number
  parentName?: string | null
  isDragging?: boolean
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  onNavigate?: () => void
  isFirst?: boolean
  isLast?: boolean
}

interface LayoutContentProps {
  children: ReactNode
  collapsed: boolean
  setCollapsed: Dispatch<SetStateAction<boolean>>
  mobileMenuOpen: boolean
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>
  editMode: boolean
  setEditMode: Dispatch<SetStateAction<boolean>>
  notesOpen: boolean
  setNotesOpen: Dispatch<SetStateAction<boolean>>
  calculatorOpen: boolean
  setCalculatorOpen: Dispatch<SetStateAction<boolean>>
  timeTrackerOpen: boolean
  setTimeTrackerOpen: Dispatch<SetStateAction<boolean>>
  aiChatOpen: boolean
  setAiChatOpen: Dispatch<SetStateAction<boolean>>
  hiddenTools: string[]
  toggleToolVisibility: (toolName: string) => void
  hiddenSections: string[]
  expandedSections: Record<string, boolean>
  sectionOrder: string[]
  subsectionOrder: Record<string, string[]>
  toggleSection: (section: string, event?: MouseEvent<HTMLButtonElement>) => void
  toggleVisibility: (itemName: string) => void
  handleDragEnd: (result: DropResult) => void
  getOrderedNavigation: () => NavItemType[]
  getOrderedSubsections: (parentItem: NavItemType) => NavItemType[]
  navRef: React.RefObject<any>
  user: User | undefined
  businesses: any[]
  location: ReturnType<typeof useLocation>
  currentPageName: string
}

const iconMap: Record<string, LucideIcon> = {
  Home,
  UserIcon,
  Heart,
  Brain,
  Dumbbell,
  Wallet,
  Briefcase,
  Car,
  Activity,
  AlertCircle,
  Target,
  ListTodo,
  DollarSign,
  Package,
  Settings,
  TrendingUp,
  Calendar,
  CalendarCheck,
  Clock,
  Weight,
  Palette,
  Users,
  Handshake,
  Lightbulb,
  Columns3: Grid3x3,
  Megaphone,
  Camera,
  FileText,
  Landmark,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Coins,
  HelpCircle
}

const LayoutContent = memo(
  ({
    children,
    collapsed,
    setCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    editMode,
    setEditMode,
    notesOpen,
    setNotesOpen,
    calculatorOpen,
    setCalculatorOpen,
    timeTrackerOpen,
    setTimeTrackerOpen,
    aiChatOpen,
    setAiChatOpen,
    hiddenTools,
    toggleToolVisibility,
    hiddenSections,
    expandedSections,
    sectionOrder,
    subsectionOrder,
    toggleSection,
    toggleVisibility,
    handleDragEnd,
    getOrderedNavigation,
    getOrderedSubsections,
    navRef,
    user,
    businesses,
    location,
    currentPageName
  }: LayoutContentProps) => {
    const { runningEntry, stopTimerMutation, isPaused, elapsedTime, handlePause, handleResume } =
      useTimeTracker()
    const runningEntryRef = useRef(runningEntry)

    useEffect(() => {
      runningEntryRef.current = runningEntry
    }, [runningEntry])

    const handleStop = () => {
      if (!runningEntry) return
      stopTimerMutation.mutate(runningEntry.id)
    }

    const formatTime = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    useEffect(() => {
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if ((runningEntryRef.current as any)?.is_running) {
          event.preventDefault()
          event.returnValue = ''
        }
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [])

    const isHidden = (itemName: string): boolean => {
      if (hiddenSections.includes(itemName)) return true
      const parts = itemName.split(' > ')
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join(' > ')
        if (hiddenSections.includes(parentPath)) return true
      }
      return false
    }

    const NavItem = ({
      item,
      level = 0,
      parentName = null,
      isDragging = false,
      dragHandleProps = null,
      onNavigate = null,
      isFirst = false,
      isLast = false
    }: NavItemProps) => {
      const isExpanded = expandedSections[item.section]
      const urlParams = new URLSearchParams(location.search)
      const currentBusinessId = urlParams.get('businessId')
      const itemPath = createPageUrl(item.page)

      const isActive =
        location.pathname === itemPath &&
        String(item.businessId ?? '') === String(currentBusinessId ?? '')

      const hasChildren = item.children && item.children.length > 0
      const uniqueName = parentName ? `${parentName} > ${item.name}` : item.name
      const hidden = isHidden(uniqueName)
      const IconComponent = iconMap[item.iconName] || CircleHelp
      const canRearrange = (level === 0 || level === 1) && editMode && !collapsed

      if (hidden && !editMode) return null
      if (!IconComponent) return null

      if (collapsed) {
        if (item.expandable && hasChildren) {
          const children = getOrderedSubsections(item)

          if (level === 0) {
            const roundedHeader = isExpanded && children.length > 0 ? 'rounded-t-lg' : 'rounded-lg'
            return (
              <div className="mb-1">
                <Tooltip delayDuration={800}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={e => toggleSection(item.section, e)}
                      className={cn(
                        'flex items-center justify-center w-full h-10 transition-all nav-level-0 text-slate-700',
                        roundedHeader
                      )}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="z-[99999]">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
                {isExpanded && (
                  <div>
                    {children.map((child, idx) => (
                      <NavItem
                        key={child.name}
                        item={child}
                        level={level + 1}
                        parentName={uniqueName}
                        onNavigate={onNavigate}
                        isFirst={false}
                        isLast={idx === children.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div>
              <Tooltip delayDuration={800}>
                <TooltipTrigger asChild>
                  <button
                    onClick={e => toggleSection(item.section, e)}
                    className={cn(
                      'flex items-center justify-center w-full h-10 transition-all nav-level-1 text-slate-600',
                      isLast && !isExpanded ? 'rounded-b-lg' : 'rounded-none'
                    )}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="z-[99999]">
                  {item.name}
                </TooltipContent>
              </Tooltip>
              {isExpanded && (
                <div>
                  {children.map((child, idx) => (
                    <NavItem
                      key={child.name}
                      item={child}
                      level={level + 1}
                      parentName={uniqueName}
                      onNavigate={onNavigate}
                      isFirst={false}
                      isLast={idx === children.length - 1 && isLast}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        }

        const linkUrl =
          item.url ||
          (item.businessId
            ? `${createPageUrl(item.page)}?businessId=${item.businessId}`
            : createPageUrl(item.page))
        const handleLinkClick = () => {
          if (onNavigate) onNavigate()
        }

        const roundedClass = isLast ? 'rounded-b-lg' : 'rounded-none'

        return (
          <Tooltip delayDuration={800}>
            <TooltipTrigger asChild>
              <Link
                to={linkUrl}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center justify-center w-full h-9 transition-all nav-level-2',
                  roundedClass,
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                )}
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="z-[99999]">
              {item.name}
            </TooltipContent>
          </Tooltip>
        )
      }

      if (item.expandable) {
        return (
          <div
            className={cn(
              editMode && hidden && 'opacity-40',
              isDragging && 'opacity-50',
              level === 0 && 'mb-3 rounded-lg overflow-hidden'
            )}
          >
            <div className="flex items-center">
              {editMode && !collapsed && (
                <>
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    {canRearrange && dragHandleProps && (
                      <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-slate-200 flex-shrink-0"
                    onClick={e => {
                      e.stopPropagation()
                      toggleVisibility(uniqueName)
                    }}
                  >
                    {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </>
              )}
              <button
                onClick={e => toggleSection(item.section, e)}
                className={cn(
                  'flex-1 flex items-center gap-3 px-3 py-2.5 transition-all group',
                  level === 0
                    ? 'text-slate-900 font-semibold nav-level-0'
                    : level === 1
                      ? 'text-slate-700 nav-level-1'
                      : 'text-slate-700 nav-level-2'
                )}
                style={{ paddingLeft: `${12 + level * 16}px` }}
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left text-sm font-medium">{item.name}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
            {isExpanded && hasChildren && (
              <div>
                {editMode && level === 0 ? (
                  <Droppable
                    droppableId={`subsection-${item.name}`}
                    type={`subsection-${item.name}`}
                  >
                    {provided => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {getOrderedSubsections(item).map((child, index) => (
                          <Draggable
                            key={child.name}
                            draggableId={`${item.name}-${child.name}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}>
                                <NavItem
                                  item={child}
                                  level={level + 1}
                                  parentName={uniqueName}
                                  isDragging={snapshot.isDragging}
                                  dragHandleProps={provided.dragHandleProps}
                                  onNavigate={onNavigate}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ) : (
                  <>
                    {getOrderedSubsections(item).map(child => (
                      <NavItem
                        key={child.name}
                        item={child}
                        level={level + 1}
                        parentName={uniqueName}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )
      }

      const linkUrl =
        item.url ||
        (item.businessId
          ? `${createPageUrl(item.page)}?businessId=${item.businessId}`
          : createPageUrl(item.page))
      const handleLinkClick = () => {
        if (onNavigate) onNavigate()
      }

      return (
        <div
          className={cn(
            'flex items-center',
            editMode && hidden && 'opacity-40',
            level === 0 && 'mb-3 rounded-lg overflow-hidden'
          )}
        >
          {editMode && !collapsed && (
            <>
              <div className="w-6 flex items-center justify-center flex-shrink-0">
                {canRearrange && dragHandleProps && (
                  <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-slate-200 flex-shrink-0"
                onClick={e => {
                  e.stopPropagation()
                  toggleVisibility(uniqueName)
                }}
              >
                {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </>
          )}
          {item.comingSoon ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex-1 flex items-center gap-3 px-3 py-2.5 transition-all group opacity-50 cursor-not-allowed',
                    level === 0
                      ? 'text-slate-900 nav-level-0'
                      : level === 1
                        ? 'text-slate-700 nav-level-1'
                        : 'nav-level-2 text-slate-700'
                  )}
                  style={{ paddingLeft: `${12 + level * 16}px` }}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[99999]">
                Coming soon
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to={linkUrl}
              onClick={handleLinkClick}
              className={cn(
                'flex-1 flex items-center gap-3 px-3 py-2.5 transition-all group',
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : level === 0
                    ? 'text-slate-900 nav-level-0'
                    : level === 1
                      ? 'text-slate-700 nav-level-1'
                      : 'nav-level-2 text-slate-700'
              )}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <IconComponent className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          )}
        </div>
      )
    }

    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const modKey = isMac ? 'Ctrl' : 'Alt'
    const tools: Tool[] = [
      {
        id: 'notes',
        icon: StickyNote,
        color: 'text-amber-600',
        bgClass: 'bg-white',
        label: 'Notes',
        shortcut: `${modKey}+1`,
        onClick: () => {
          setNotesOpen(!notesOpen)
          if (!notesOpen) {
            setCalculatorOpen(false)
            setTimeTrackerOpen(false)
            setAiChatOpen(false)
          }
        }
      },
      {
        id: 'timeTracker',
        icon: Clock,
        color: runningEntry && !isPaused ? 'text-green-600' : 'text-blue-600',
        bgClass: runningEntry && !isPaused ? 'bg-green-50 hover:bg-green-100' : 'bg-white',
        badge: runningEntry && !isPaused,
        label: 'Time Tracker',
        shortcut: `${modKey}+2`,
        onClick: () => {
          setTimeTrackerOpen(!timeTrackerOpen)
          if (!timeTrackerOpen) {
            setNotesOpen(false)
            setCalculatorOpen(false)
            setAiChatOpen(false)
          }
        }
      },
      {
        id: 'calculator',
        icon: Calculator,
        color: 'text-indigo-600',
        bgClass: 'bg-white',
        label: 'Calculator',
        shortcut: `${modKey}+3`,
        onClick: () => {
          setCalculatorOpen(!calculatorOpen)
          if (!calculatorOpen) {
            setNotesOpen(false)
            setTimeTrackerOpen(false)
            setAiChatOpen(false)
          }
        }
      },
      {
        id: 'aiChat',
        icon: Sparkles,
        color: 'text-purple-600',
        bgClass: 'bg-white',
        label: 'AI Chat',
        shortcut: `${modKey}+4`,
        onClick: () => {
          setAiChatOpen(!aiChatOpen)
          if (!aiChatOpen) {
            setNotesOpen(false)
            setCalculatorOpen(false)
            setTimeTrackerOpen(false)
          }
        }
      }
    ]
    const visibleTools = tools.filter(tool => !hiddenTools.includes(tool.id))

    return (
      <TooltipProvider>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          <aside
            className={cn(
              'sidebar transition-all duration-300 flex flex-col z-50',
              'fixed lg:relative inset-y-0 left-0',
              collapsed ? 'w-16' : 'w-full lg:w-64',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
              {!collapsed && (
                <Link to="/">
                  <img src="logo.webp" alt="lifedesk" className="h-8" />
                </Link>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(!collapsed)}
                  className="h-8 w-8 hover:bg-slate-100 hidden lg:flex"
                >
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-12 w-12 hover:bg-slate-100 lg:hidden"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {user && ['free', 'plus'].includes(user?.subscription_tier ?? 'free') && !collapsed && (
              <Link
                to="/upgrade"
                onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                className="mx-3 my-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(90deg, #f97316, #a855f7)'
                }}
              >
                {user?.subscription_tier === 'plus' ? (
                  <Rocket className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <Crown className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span>
                  {user?.subscription_tier === 'plus' ? 'Upgrade to Pro' : 'Upgrade to Plus / Pro'}
                </span>
              </Link>
            )}

            {(visibleTools.length > 0 || editMode) && (
              <div className="p-3 border-b border-slate-200" style={{ background: '#fff0e8' }}>
                <div
                  className={cn(
                    'flex gap-2',
                    collapsed ? 'flex-col' : 'flex-row',
                    !editMode && visibleTools.length > 0 && 'justify-between'
                  )}
                >
                  {tools.map(tool => {
                    const Icon = tool.icon
                    const toolHidden = hiddenTools.includes(tool.id)
                    if (toolHidden && !editMode) return null
                    return (
                      <div
                        key={tool.id}
                        className={cn(
                          'flex items-center gap-1 flex-1',
                          toolHidden && editMode && 'opacity-40'
                        )}
                      >
                        {editMode && !collapsed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-slate-200 flex-shrink-0"
                            onClick={() => toggleToolVisibility(tool.id)}
                          >
                            {toolHidden ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                        <div className="relative group/tool flex-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={tool.onClick}
                            className={cn(
                              'w-full h-10 shadow-lg hover:bg-slate-100 relative',
                              tool.bgClass
                            )}
                          >
                            <Icon className={cn('w-[1.2rem] h-[1.2rem]', tool.color)} />
                            {tool.badge && (
                              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </Button>
                          <div className="absolute bottom-full left-0 mb-2 flex flex-col items-start pointer-events-none z-50 opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 [transition-delay:0s] group-hover/tool:[transition-delay:1.5s]">
                            <div className="bg-slate-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-lg">
                              <span className="font-medium">{tool.label}</span>
                              <span className="ml-1.5 text-slate-400">{tool.shortcut}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {runningEntry && !collapsed && (
                  <div className="mt-3 p-2 rounded-lg" style={{ backgroundColor: '#fde8da' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-base font-mono font-bold text-slate-900">
                        {formatTime(elapsedTime)}
                      </div>
                      {!isPaused ? (
                        <Button
                          onClick={handlePause}
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleResume}
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        onClick={handleStop}
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                      >
                        <Square className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <nav className={cn('flex-1', collapsed ? 'overflow-hidden' : 'overflow-hidden')}>
              {collapsed ? (
                <Scrollbars
                  autoHide
                  autoHideTimeout={1000}
                  autoHideDuration={200}
                  renderThumbVertical={({ style, ...props }) => (
                    <div {...props} style={{ ...style, display: 'none' }} />
                  )}
                >
                  <div className="p-2 overflow-x-hidden">
                    {getOrderedNavigation().map(item => (
                      <NavItem
                        key={item.name}
                        item={item}
                        onNavigate={() => setMobileMenuOpen(false)}
                      />
                    ))}
                  </div>
                </Scrollbars>
              ) : (
                <Scrollbars
                  ref={navRef}
                  autoHide
                  autoHideTimeout={1000}
                  autoHideDuration={200}
                  renderThumbVertical={({ style, ...props }) => (
                    <div {...props} style={{ ...style, display: 'none' }} />
                  )}
                >
                  <div className="p-3">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      {editMode ? (
                        <Droppable droppableId="navigation" type="main">
                          {provided => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                              {getOrderedNavigation().map((item, index) => (
                                <Draggable key={item.name} draggableId={item.name} index={index}>
                                  {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps}>
                                      <NavItem
                                        item={item}
                                        isDragging={snapshot.isDragging}
                                        dragHandleProps={provided.dragHandleProps}
                                        onNavigate={() => setMobileMenuOpen(false)}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ) : (
                        <div>
                          {getOrderedNavigation().map(item => (
                            <NavItem
                              key={item.name}
                              item={item}
                              onNavigate={() => setMobileMenuOpen(false)}
                            />
                          ))}
                        </div>
                      )}
                    </DragDropContext>
                  </div>
                </Scrollbars>
              )}
            </nav>

            <div className="p-3 border-t border-slate-200">
              {!collapsed ? (
                <div className="space-y-2">
                  <Button
                    variant={editMode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    className="w-full justify-start gap-2"
                  >
                    {editMode ? <X className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
                    <span>{editMode ? 'Exit Edit' : 'Edit Sections'}</span>
                  </Button>
                  <Link
                    to={createPageUrl('Profile')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user?.profile_image || user?.google_avatar_url ? (
                        <img
                          src={user.profile_image || user.google_avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={e => {
                            const target = e.currentTarget
                            if (user.google_avatar_url && target.src !== user.google_avatar_url) {
                              target.src = user.google_avatar_url
                            } else {
                              target.style.display = 'none'
                            }
                          }}
                        />
                      ) : (
                        <UserIcon className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user?.full_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <div className="flex items-center gap-1">
                        {user?.subscription_tier === 'pro' && (
                          <Rocket className="w-3 h-3 text-orange-500" />
                        )}
                        {user?.subscription_tier === 'plus' && (
                          <Crown className="w-3 h-3 text-indigo-600" />
                        )}
                        {(!user?.subscription_tier || user?.subscription_tier === 'free') && (
                          <Zap className="w-3 h-3 text-slate-400" />
                        )}
                        <p className="text-xs text-slate-500 capitalize">
                          {user?.subscription_tier || 'free'}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to={createPageUrl('Profile')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200 transition-colors overflow-hidden">
                      {user?.profile_image || user?.google_avatar_url ? (
                        <img
                          src={user.profile_image || user.google_avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={e => {
                            const target = e.currentTarget
                            if (user.google_avatar_url && target.src !== user.google_avatar_url) {
                              target.src = user.google_avatar_url
                            } else {
                              target.style.display = 'none'
                            }
                          }}
                        />
                      ) : (
                        <UserIcon className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 w-full page-bg min-w-0 overflow-x-hidden overflow-y-hidden">
            <Scrollbars
              autoHide
              autoHideTimeout={1000}
              autoHideDuration={200}
              renderView={({ style, ...props }) => (
                <div
                  {...props}
                  style={{
                    ...style,
                    overflowX: 'hidden',
                    overflowY: 'auto'
                  }}
                />
              )}
              renderThumbVertical={({ style, ...props }) => (
                <div {...props} style={{ ...style, display: 'none' }} />
              )}
            >
              <div className="lg:hidden sticky top-0 z-30 bg-white px-4 py-3 flex items-center justify-between ">
                <div className="w-12" />
                <Link to="/">
                  <img src="logo.webp" alt="lifedesk" className="h-8" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-12 w-12"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </div>
              <PageContent>{children}</PageContent>
            </Scrollbars>
          </main>
        </div>
      </TooltipProvider>
    )
  }
)

LayoutContent.displayName = 'LayoutContent'

export default LayoutContent
