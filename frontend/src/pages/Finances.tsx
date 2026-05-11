import { Link } from 'react-router-dom'
import { createPageUrl } from '../utils'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

export default function Finances() {
  return (
    <>
      <Helmet>
        <title>Finances</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Finances Overview</h1>
            <p className="text-slate-600">Financial charts and analytics</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Financial Analytics Coming Soon
            </h2>
            <p className="text-slate-600 mb-6">
              View detailed charts and analytics of your financial data
            </p>
            <Link to={createPageUrl('Transactions')}>
              <Button className="gap-2">
                View Transactions
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
