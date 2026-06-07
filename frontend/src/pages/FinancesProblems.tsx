import { useState } from 'react'
import ProblemSection from '@/components/sections/ProblemSection'
import { Helmet } from 'react-helmet-async'

export default function FinancesProblems() {
  const [_, setInitialTaskData] = useState(null)

  const handleCreateTask = taskData => {
    setInitialTaskData(taskData)
    setTimeout(() => setInitialTaskData(null), 100)
  }

  return (
    <>
      <Helmet>
        <title>Finances Problems | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Financial Problems</h1>
            <p className="text-slate-600">Track and resolve financial issues</p>
          </div>

          <ProblemSection category="assets" onCreateTask={handleCreateTask} />
        </div>
      </div>
    </>
  )
}
