import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, TrendingUp, Calendar, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import FitnessTimelineChart from '@/components/sections/FitnessTimelineChart'
import { Helmet } from 'react-helmet-async'

type Workout = {
  id?: string
  date: string
  duration_minutes?: number
  calories_burned?: number
}

type BodyMeasurement = {
  id?: string
  date: string
  weight?: number
}

export default function Fitness() {
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

  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => backend.entities.Workout.list('-date') as Promise<Workout[]>
  })

  const { data: measurements = [] } = useQuery<BodyMeasurement[]>({
    queryKey: ['measurements'],
    queryFn: () => backend.entities.BodyMeasurement.list('-date') as Promise<BodyMeasurement[]>
  })

  const thisWeek = workouts.filter(w => {
    const workoutDate = new Date(w.date)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return workoutDate >= weekAgo && workoutDate <= now
  })

  const totalMinutes = thisWeek.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
  const totalCalories = thisWeek.reduce((sum, w) => sum + (w.calories_burned || 0), 0)

  const latestMeasurement = measurements[0]
  const previousMeasurement = measurements[1]

  return (
    <>
      <Helmet>
        <title>Fitness</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="fitness-sticky-title text-sm font-normal text-slate-900 text-center">
                  Fitness Overview
                </h1>
              </div>
            </div>
          )}
          <div ref={headerRef} className="py-6 sm:py-8">
            <h1 className="fitness-page-title text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <Dumbbell className="w-8 h-8 sm:w-9 sm:h-9" />
              Fitness Overview
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left">
              Track your workouts, progress, and body measurements
            </p>
          </div>

          <FitnessTimelineChart />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="fitness-stat-workouts text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Workouts This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{thisWeek.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="fitness-stat-minutes text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Total Minutes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{totalMinutes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="fitness-stat-calories text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Calories Burned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{totalCalories}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="fitness-stat-weight text-sm font-medium text-slate-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {latestMeasurement?.weight || '-'}
                </div>
                {previousMeasurement && latestMeasurement && (
                  <p className="text-xs text-slate-500 mt-1">
                    {latestMeasurement.weight > previousMeasurement.weight ? '+' : ''}
                    {(latestMeasurement.weight - previousMeasurement.weight).toFixed(1)} kg
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to={createPageUrl('Workouts')}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="fitness-link-workouts flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Workouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Log and track your training sessions</p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl('BodyMeasurements')}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="fitness-link-measurements flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Body Measurements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Track your body composition and progress</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
