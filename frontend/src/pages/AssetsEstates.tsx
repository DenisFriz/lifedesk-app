import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Home, Lock } from 'lucide-react'
import EstateAssetCard from '@/components/assets/EstateAssetCard'
import EstateAssetForm from '@/components/assets/EstateAssetForm'
import { formatCurrency } from '@/components/utils/formatters'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useEstateMutations } from '@/hooks/estates/useEstateMutations'
import { EstateRecord } from '@/db'
import { CreateEstateInput } from '@/repositories/estate.repository'
import { useEstatesQuery } from '@/hooks/estates/useEstatesQuery'

export default function AssetsEstates() {
  const [form, setForm] = useState({ open: false, asset: null })

  const { data: estates, isLoading } = useEstatesQuery()

  const { canCreate, data } = useUserLimit()

  const atLimit = !canCreate('estate')
  const totalValue = estates?.reduce((s, a) => s + (a.current_value || a.purchase_price || 0), 0)
  const totalMortgage = estates?.reduce((s, a) => s + (a.mortgage_amount || 0), 0)
  const totalEquity = totalValue - totalMortgage

  const { updateMutation, createMutation, deleteMutation } = useEstateMutations()

  const handleUpdateEstate = async ({ id, data }: { id: string; data: Partial<EstateRecord> }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setForm({ open: false, asset: null })
    }
  }

  const handleCreateEstate = async (data: CreateEstateInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setForm({ open: false, asset: null })
    }
  }

  const handleDeleteEstate = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setForm({ open: false, asset: null })
    }
  }

  const handleSubmit = (data: CreateEstateInput) => {
    if (form.asset) handleUpdateEstate({ id: form.asset.id, data })
    else handleCreateEstate(data)
  }

  return (
    <>
      <Helmet>
        <title>Assets Estates | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col min-[480px]:flex-row items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center min-[480px]:justify-start gap-3">
                <Home className="w-8 h-8" /> Estates
              </h1>
              <p className="text-slate-600 mt-1">Track your real estate properties</p>
            </div>
            {atLimit ? (
              <Link to="/upgrade">
                <Button
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Lock className="w-4 h-4 mr-2" /> Upgrade to Add More
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => setForm({ open: true, asset: null })}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Estate
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Value</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {data?.usage?.estate || 0}/{data?.limits?.estate} used
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Outstanding Mortgage</p>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalMortgage)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Equity</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalEquity)}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : estates.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No estates added yet</h3>
              <p className="text-slate-600 mb-4">Start tracking your properties</p>
              {atLimit ? (
                <Link to="/upgrade">
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Lock className="w-4 h-4 mr-2" /> Upgrade to Add More
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => setForm({ open: true, asset: null })}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Estate
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {estates?.map(asset => (
                <EstateAssetCard
                  key={asset.id}
                  asset={asset}
                  onEdit={a => setForm({ open: true, asset: a })}
                  onDelete={id => handleDeleteEstate(id)}
                />
              ))}
            </div>
          )}
        </div>

        <EstateAssetForm
          open={form.open}
          asset={form.asset}
          onClose={() => setForm({ open: false, asset: null })}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </>
  )
}
