import { useState, useEffect, useRef } from 'react'
import { Activity } from 'lucide-react'
import HealthTimelineChart from '@/components/sections/HealthTimelineChart'
import ProblemTable from '@/components/sections/ProblemTable'
import { Helmet } from 'react-helmet-async'

export default function BodyProblems() {
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

  return (
    <>
      <Helmet>
        <title>Body Problems</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="text-sm font-normal text-slate-900 text-center">
                  Health - Tracking
                </h1>
              </div>
            </div>
          )}
          <div ref={headerRef} className="py-6 sm:py-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <Activity className="w-8 h-8 sm:w-9 sm:h-9" />
              Health - Tracking
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left">
              Track health problems, medication, measurements, and more
            </p>
          </div>

          <HealthTimelineChart category="health_body" />
          <ProblemTable category="health_body" />
        </div>
      </div>
    </>
  )
}
