import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Briefcase } from 'lucide-react'
import ProjectTable from '@/components/sections/ProjectTable'
import { Helmet } from 'react-helmet-async'

type Business = {
  id: string
  name: string
}

export default function Projects() {
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

      const res = (await backend.entities.Business.filter({ id: businessId })) as Business[]
      return res?.[0] ?? null
    },
    enabled: !!businessId
  })

  return (
    <>
      <Helmet>
        <title>Projects | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="projects-sticky-title text-sm font-normal text-slate-900 text-center">
                  {business ? `${business.name} - Projects` : 'Projects'}
                </h1>
              </div>
            </div>
          )}
          <div ref={headerRef} className="py-6 sm:py-8">
            <h1 className="projects-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <Briefcase className="w-8 h-8 sm:w-9 sm:h-9" />
              {business ? `${business.name} - Projects` : 'Projects'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left">
              {business ? 'Manage business projects' : 'Manage your business projects'}
            </p>
          </div>

          <ProjectTable businessId={businessId} />
        </div>
      </div>
    </>
  )
}
