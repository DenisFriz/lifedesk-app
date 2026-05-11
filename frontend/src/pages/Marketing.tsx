import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, Target, BarChart2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import StrategyList from '@/components/marketing/StrategyList'
import CampaignList from '@/components/marketing/CampaignList'
import ContentViews from '@/components/marketing/ContentViews'
import { Helmet } from 'react-helmet-async'

const TABS = [
  { id: 'strategy', label: 'Strategy', icon: Target, desc: 'High-level marketing direction' },
  { id: 'campaigns', label: 'Campaigns', icon: BarChart2, desc: 'Plan and track campaigns' },
  {
    id: 'content',
    label: 'Content & Assets',
    icon: FileText,
    desc: 'Content planning and execution'
  }
]

type Business = {
  id: string
  name: string
}

export default function Marketing() {
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const businessId = urlParams.get('businessId')
  const [activeTab, setActiveTab] = useState('strategy')

  const { data: business } = useQuery<Business | null>({
    queryKey: ['business', businessId],
    queryFn: async (): Promise<Business | null> => {
      if (!businessId) return null

      const res = await backend.entities.Business.filter({ id: businessId })

      return (res?.[0] as Business) ?? null
    },
    enabled: !!businessId
  })

  const activeTabInfo = TABS.find(t => t.id === activeTab)

  return (
    <>
      <Helmet>
        <title>Marketing</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3 mb-1">
              <Megaphone className="w-8 h-8 sm:w-9 sm:h-9" />
              {business ? `${business.name} — Marketing` : 'Marketing'}
            </h1>
            <p className="text-slate-500 text-sm">{activeTabInfo?.desc}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200 mb-6 w-full sm:w-auto sm:inline-flex">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'strategy' && <StrategyList businessId={businessId} />}
          {activeTab === 'campaigns' && <CampaignList businessId={businessId} />}
          {activeTab === 'content' && <ContentViews businessId={businessId} />}
        </div>
      </div>
    </>
  )
}
