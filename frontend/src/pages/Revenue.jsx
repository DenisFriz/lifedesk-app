import React from 'react'
import { useLocation } from 'react-router-dom'
import IncomeTable from '@/components/sections/IncomeTable'

export default function Revenue() {
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const businessId = urlParams.get('businessId')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Revenue</h1>
          <p className="text-slate-600">Track your business income</p>
        </div>

        <IncomeTable businessId={businessId} />
      </div>
    </div>
  )
}
