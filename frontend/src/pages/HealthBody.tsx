import { useState, useEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import ProblemSection from '@/components/sections/ProblemSection'
import GoalSection from '@/components/sections/GoalSection'
import TaskSection from '@/components/sections/TaskSection'
import { Helmet } from 'react-helmet-async'

export default function HealthBody() {
  const [initialTaskData, setInitialTaskData] = useState(null)
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

  const handleCreateTask = taskData => {
    setInitialTaskData(taskData)
    setTimeout(() => setInitialTaskData(null), 100)
  }

  return (
    <>
      <Helmet>
        <title>Health Body</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="text-sm font-normal text-slate-900 text-center">Body Health</h1>
              </div>
            </div>
          )}
          <div ref={headerRef} className="py-6 sm:py-8">
            <h1 className="healthbody-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <Heart className="w-8 h-8 sm:w-9 sm:h-9" />
              Health Overview
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left">
              Track your physical wellness journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProblemSection category="health_body" onCreateTask={handleCreateTask} />
            <GoalSection category="health_body" onCreateTask={handleCreateTask} />
            <TaskSection category="health_body" initialTaskData={initialTaskData} />
          </div>
        </div>
      </div>
    </>
  )
}
