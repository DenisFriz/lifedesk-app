import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '../utils'
import { useLayout } from '../Layout'
import { Button } from '@/components/ui/button'
import {
  Heart,
  Wallet,
  Briefcase,
  ArrowRight,
  Plus,
  X,
  Settings,
  GripVertical,
  DollarSign,
  Dumbbell,
  Palette,
  Brain,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import RecentTransactionsWidget from '@/components/widgets/RecentTransactionsWidget'
import UpcomingTasksWidget from '@/components/widgets/UpcomingTasksWidget'
import HealthScoreTrendWidget from '@/components/widgets/HealthScoreTrendWidget'
import AssetSummaryWidget from '@/components/widgets/AssetSummaryWidget'
import BusinessTasksWidget from '@/components/widgets/BusinessTasksWidget'
import QuickWorkoutWidget from '@/components/widgets/QuickWorkoutWidget'
import QuickMeasurementWidget from '@/components/widgets/QuickMeasurementWidget'
import TimeTrackerWidget from '@/components/widgets/TimeTrackerWidget'
import LearningProgressWidget from '@/components/widgets/LearningProgressWidget'
import FitnessSummaryWidget from '@/components/widgets/FitnessSummaryWidget'
import MonthlyFinanceWidget from '@/components/widgets/MonthlyFinanceWidget'
import ActiveGoalsWidget from '@/components/widgets/ActiveGoalsWidget'
import WhatsNewWidget from '@/components/widgets/WhatsNewWidget'

const AVAILABLE_WIDGETS = [
  { id: 'upcoming-tasks', name: 'All Tasks & Events', component: UpcomingTasksWidget },
  { id: 'active-goals', name: 'Active Goals', component: ActiveGoalsWidget },
  { id: 'monthly-finance', name: 'Monthly Finances', component: MonthlyFinanceWidget },
  { id: 'recent-transactions', name: 'Recent Transactions', component: RecentTransactionsWidget },
  { id: 'asset-summary', name: 'Asset Summary', component: AssetSummaryWidget },
  { id: 'health-score', name: 'Health Overview', component: HealthScoreTrendWidget },
  { id: 'fitness-summary', name: 'Fitness Summary', component: FitnessSummaryWidget },
  { id: 'quick-workout', name: 'Quick Log Workout', component: QuickWorkoutWidget },
  { id: 'quick-measurement', name: 'Quick Log Measurement', component: QuickMeasurementWidget },
  { id: 'learning-progress', name: 'Learning Progress', component: LearningProgressWidget },
  { id: 'time-tracker', name: 'Time Tracker Summary', component: TimeTrackerWidget },
  { id: 'business-tasks', name: 'Business Tasks', component: BusinessTasksWidget }
]

export default function Home() {
  const { isHidden } = useLayout()
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('homeWidgets')
    return saved ? JSON.parse(saved) : ['upcoming-tasks', 'active-goals', 'monthly-finance']
  })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('homeExpandedSections')
    return saved ? JSON.parse(saved) : { whatsnew: true, widgets: true, sections: true }
  })
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

  const addWidget = (widgetId: string) => {
    if (!widgets.includes(widgetId)) {
      const newWidgets = [...widgets, widgetId]
      setWidgets(newWidgets)
      localStorage.setItem('homeWidgets', JSON.stringify(newWidgets))
      setShowAddDialog(false)
    }
  }

  const removeWidget = (widgetId: string) => {
    const newWidgets = widgets.filter(id => id !== widgetId)
    setWidgets(newWidgets)
    localStorage.setItem('homeWidgets', JSON.stringify(newWidgets))
  }

  const handleDragEnd = result => {
    if (!result.destination) return
    const newWidgets = Array.from(widgets)
    const [moved] = newWidgets.splice(result.source.index, 1)
    newWidgets.splice(result.destination.index, 0, moved)
    setWidgets(newWidgets)
    localStorage.setItem('homeWidgets', JSON.stringify(newWidgets))
  }

  const toggleSection = section => {
    const newExpanded = { ...expandedSections, [section]: !expandedSections[section] }
    setExpandedSections(newExpanded)
    localStorage.setItem('homeExpandedSections', JSON.stringify(newExpanded))
  }

  const allCards = [
    {
      title: 'Finance',
      description: 'Track income, expenses, and manage budgets',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      page: 'Finances',
      sectionName: 'Finance'
    },
    {
      title: 'Assets',
      description: 'Manage vehicles, estates, and other assets',
      icon: Wallet,
      color: 'from-teal-500 to-cyan-500',
      page: 'Overview',
      sectionName: 'Assets'
    },
    {
      title: 'Health',
      description: 'Track physical and mental wellness',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      page: 'HealthBody',
      sectionName: 'Health'
    },
    {
      title: 'Fitness',
      description: 'Log workouts, measurements, and progress',
      icon: Dumbbell,
      color: 'from-orange-500 to-red-500',
      page: 'Fitness',
      sectionName: 'Fitness'
    },
    {
      title: 'Hobbies',
      description: 'Organize and track your hobbies and interests',
      icon: Palette,
      color: 'from-purple-500 to-pink-500',
      page: 'Hobbies',
      sectionName: 'Hobbies'
    },
    {
      title: 'Learning & Development',
      description: 'Manage your learning goals and progress',
      icon: Brain,
      color: 'from-blue-500 to-indigo-500',
      page: 'Learning',
      sectionName: 'Learning & Development'
    },
    {
      title: 'Relationships',
      description: 'Track and nurture your relationships',
      icon: Users,
      color: 'from-yellow-500 to-orange-500',
      page: 'Relationships',
      sectionName: 'Relationships'
    },
    {
      title: 'Business',
      description: 'Manage projects, clients, and business tasks',
      icon: Briefcase,
      color: 'from-indigo-500 to-blue-500',
      page: 'ManageBusinesses',
      sectionName: 'Business'
    }
  ]

  const cards = allCards.filter(card => !isHidden(card.sectionName))

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isScrolled && (
          <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="py-3">
              <h1 className="home-sticky-title text-sm font-normal text-slate-900 text-center">
                Home
              </h1>
            </div>
          </div>
        )}
        {/* Hero */}
        <div ref={headerRef} className="text-center py-6 sm:py-12">
          <h1 className="home-hero-title text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Welcome to lifedesk
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Organize every aspect of your life in one place. Track your health, manage your assets,
            and grow your business.
          </p>
        </div>

        {/* What's New */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">What's New</h2>
            <button
              onClick={() => toggleSection('whatsnew')}
              className="hover:opacity-70 transition-opacity"
            >
              {expandedSections.whatsnew ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
          {expandedSections.whatsnew && (
            <div className="mt-6">
              <WhatsNewWidget />
            </div>
          )}
          {!expandedSections.whatsnew && <div className="h-0" />}
        </div>

        {/* Customizable Widgets */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="home-widgets-title text-2xl font-bold text-slate-900">
              Dashboard Widgets
            </h2>
            <div className="flex items-center gap-3">
              {expandedSections.widgets && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Widget
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Widget</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 mt-4">
                      {AVAILABLE_WIDGETS.filter(w => !widgets.includes(w.id)).map(widget => (
                        <button
                          key={widget.id}
                          onClick={() => addWidget(widget.id)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-medium text-slate-900">{widget.name}</span>
                        </button>
                      ))}
                      {AVAILABLE_WIDGETS.filter(w => !widgets.includes(w.id)).length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">
                          All widgets are already added
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <button
                onClick={() => toggleSection('widgets')}
                className="hover:opacity-70 transition-opacity"
              >
                {expandedSections.widgets ? (
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>
          {expandedSections.widgets && (
            <>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="widgets" direction="horizontal">
                  {provided => (
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {widgets.map((widgetId, index) => {
                        const widgetConfig = AVAILABLE_WIDGETS.find(w => w.id === widgetId)
                        if (!widgetConfig) return null
                        const WidgetComponent = widgetConfig.component
                        return (
                          <Draggable key={widgetId} draggableId={widgetId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative bg-slate-50 rounded-xl p-6 border border-slate-200 transition-shadow ${snapshot.isDragging ? 'shadow-xl' : ''}`}
                              >
                                <div
                                  className="absolute top-3 left-3"
                                  {...provided.dragHandleProps}
                                >
                                  <GripVertical className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing" />
                                </div>
                                <button
                                  onClick={() => removeWidget(widgetId)}
                                  className="absolute top-3 right-3 p-1 rounded-md hover:bg-slate-200 transition-colors"
                                >
                                  <X className="w-4 h-4 text-slate-500" />
                                </button>
                                <div className="mt-4">
                                  <WidgetComponent />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              {widgets.length === 0 && (
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No widgets added yet</p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Widget
                  </Button>
                </div>
              )}
            </>
          )}
          {!expandedSections.widgets && <div className="h-0" />}
        </div>

        {/* Sections */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Life Areas</h2>
            <button
              onClick={() => toggleSection('sections')}
              className="hover:opacity-70 transition-opacity"
            >
              {expandedSections.sections ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
          {expandedSections.sections && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map(card => (
                <Link key={card.title} to={createPageUrl(card.page)} className="group">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 h-full">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="home-card-title text-xl font-bold text-slate-900 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-slate-600 mb-4">{card.description}</p>
                    <div className="flex items-center text-indigo-600 font-medium group-hover:gap-2 transition-all">
                      Get started
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
