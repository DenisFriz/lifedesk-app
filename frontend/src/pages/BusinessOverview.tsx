import { useState, useEffect, useRef } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Briefcase, DollarSign, Users, TrendingUp } from 'lucide-react'
import { Briefcase as BriefcaseIcon } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/components/utils/formatters'

type Business = {
  id: string
  name: string
  description?: string
}

type Project = {
  id: string
  name: string
  status: 'new' | 'in_progress' | 'completed' | string
  revenue_target?: number
  created_date?: string
  business_id?: string
  is_deleted?: boolean
}

type Client = {
  id: string
  name: string
  status: 'active' | 'inactive' | string
  business_id?: string
  is_deleted?: boolean
}

type Task = {
  id: string
  name?: string
  status: 'pending' | 'in_progress' | 'completed' | string
  category?: 'business' | string
  business_id?: string
  is_deleted?: boolean
  created_date?: string
}

export default function BusinessOverview() {
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const businessId = urlParams.get('businessId')
  const [isScrolled, setIsScrolled] = useState(false)
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

  const { data: business } = useQuery<Business | null>({
    queryKey: ['business', businessId],
    queryFn: async (): Promise<Business | null> => {
      if (!businessId) return null

      const businesses = (await backend.entities.Business.filter({
        is_deleted: false
      })) as Business[]

      return businesses.find(b => b.id === businessId) ?? null
    },
    enabled: !!businessId
  })

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', businessId],
    queryFn: async (): Promise<Project[]> => {
      if (!businessId) {
        return backend.entities.Project.filter({ is_deleted: false }, '-created_date') as Promise<
          Project[]
        >
      }

      return backend.entities.Project.filter({
        business_id: businessId,
        is_deleted: false
      }) as Promise<Project[]>
    }
  })

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients', businessId],
    queryFn: async (): Promise<Client[]> => {
      if (!businessId) {
        return backend.entities.Client.filter({ is_deleted: false }, '-created_date') as Promise<
          Client[]
        >
      }

      return backend.entities.Client.filter({
        business_id: businessId,
        is_deleted: false
      }) as Promise<Client[]>
    }
  })

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['business-tasks', businessId],
    queryFn: async (): Promise<Task[]> => {
      if (!businessId) {
        return backend.entities.Task.filter({ category: 'business', is_deleted: false }) as Promise<
          Task[]
        >
      }

      return backend.entities.Task.filter({
        category: 'business',
        business_id: businessId,
        is_deleted: false
      }) as Promise<Task[]>
    }
  })

  const activeProjects = projects.filter(p => p.status === 'in_progress').length
  const activeClients = clients.filter(c => c.status === 'active').length
  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue_target || 0), 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isScrolled && (
          <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="py-3">
              <h1 className="businessoverview-sticky-title text-sm font-normal text-slate-900 text-center">
                {business?.name || 'Business'} - Overview
              </h1>
            </div>
          </div>
        )}
        <div ref={headerRef} className="py-6 sm:py-8">
          <h1 className="businessoverview-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
            <BriefcaseIcon className="w-8 h-8 sm:w-9 sm:h-9" />
            {business?.name || 'Business'} - Overview
          </h1>
          <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left">
            {business?.description || 'Your solopreneur command center'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm text-slate-600">Active Projects</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(activeProjects)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600">Active Clients</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(activeClients)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-rose-600" />
              </div>
              <span className="text-sm text-slate-600">Pending Tasks</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(pendingTasks)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-600">Revenue Target</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="businessoverview-projects-title font-semibold text-slate-900 mb-4">
              Recent Projects
            </h3>
            {projects.slice(0, 5).length === 0 ? (
              <p className="text-slate-500 text-sm">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map(project => (
                  <div key={project.id} className="border-b border-slate-100 pb-3 last:border-0">
                    <p className="font-medium text-slate-900">{project.name}</p>
                    <p className="text-xs text-slate-500">{project.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="businessoverview-clients-title font-semibold text-slate-900 mb-4">
              Recent Clients
            </h3>
            {clients.slice(0, 5).length === 0 ? (
              <p className="text-slate-500 text-sm">No clients yet</p>
            ) : (
              <div className="space-y-3">
                {clients.slice(0, 5).map(client => (
                  <div key={client.id} className="border-b border-slate-100 pb-3 last:border-0">
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-500">{client.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
