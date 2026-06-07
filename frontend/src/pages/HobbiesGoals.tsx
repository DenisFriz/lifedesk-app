import { useState, useEffect, useRef } from 'react'
import { Target } from 'lucide-react'
import GoalTable from '@/components/sections/GoalTable'
import { Helmet } from 'react-helmet-async'

export default function HobbiesGoals() {
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
        <title>Hobbies Goals | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="hobbiesgoals-sticky-title text-sm font-normal text-slate-900 text-center">
                  Hobbies - Goals
                </h1>
              </div>
            </div>
          )}
          <div ref={headerRef} className="py-6 sm:py-8">
            <h1 className="hobbiesgoals-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <Target className="w-8 h-8 sm:w-9 sm:h-9" />
              Hobbies - Goals
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left">
              Goals for your hobbies and interests
            </p>
          </div>

          <GoalTable filterType="category" category="hobbies" />
        </div>
      </div>
    </>
  )
}
