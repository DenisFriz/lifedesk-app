import { useState } from 'react'
import ProblemSection from '@/components/sections/ProblemSection'
import GoalSection from '@/components/sections/GoalSection'
import TaskSection from '@/components/sections/TaskSection'
import { Helmet } from 'react-helmet-async'

export default function HealthMind() {
  const [initialTaskData, setInitialTaskData] = useState(null)

  const handleCreateTask = taskData => {
    setInitialTaskData(taskData)
    setTimeout(() => setInitialTaskData(null), 100)
  }

  return (
    <>
      <Helmet>
        <title>Health Mind</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="healthmind-page-title text-4xl font-bold text-slate-900 mb-2">
              Mind Health
            </h1>
            <p className="text-slate-600">Track your mental wellness journey</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProblemSection category="health_mind" onCreateTask={handleCreateTask} />
            <GoalSection category="health_mind" onCreateTask={handleCreateTask} />
            <TaskSection category="health_mind" initialTaskData={initialTaskData} />
          </div>
        </div>
      </div>
    </>
  )
}
