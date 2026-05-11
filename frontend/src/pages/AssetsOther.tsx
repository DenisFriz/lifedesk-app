import { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Plus, Package, Lock } from 'lucide-react'
import TangibleAssetCard from '@/components/assets/TangibleAssetCard'
import TangibleAssetForm from '@/components/assets/TangibleAssetForm'
import { formatCurrency } from '@/components/utils/formatters'
import { useSubscription } from '@/hooks/useSubscription'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

type TangibleAsset = {
  id: string
  category: string

  name?: string
  description?: string

  purchase_price?: number
  current_value?: number

  created_date?: string
  updated_date?: string

  is_deleted?: boolean
}

export default function AssetsOther() {
  const [form, setForm] = useState({ open: false, asset: null })
  const queryClient = useQueryClient()
  const { limit: getLimit } = useSubscription()

  const { data: assets = [], isLoading } = useQuery<TangibleAsset[]>({
    queryKey: ['tangible-assets'],
    queryFn: async (): Promise<TangibleAsset[]> => {
      return backend.entities.TangibleAsset.list('-created_date') as Promise<TangibleAsset[]>
    }
  })

  const otherLimit = getLimit('assets_other_limit')
  const others = assets.filter(a => a.category !== 'vehicle' && a.category !== 'real_estate')
  const atLimit = others.length >= otherLimit
  const totalValue = others.reduce((s, a) => s + (a.current_value || a.purchase_price || 0), 0)

  const createMutation = useMutation({
    mutationFn: (data: TangibleAsset) => backend.entities.TangibleAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tangible-assets'] })
      setForm({ open: false, asset: null })
    }
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TangibleAsset> }) =>
      backend.entities.TangibleAsset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tangible-assets'] })
      setForm({ open: false, asset: null })
    }
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.entities.TangibleAsset.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tangible-assets'] })
  })

  const handleSubmit = data => {
    if (form.asset) updateMutation.mutate({ id: form.asset.id, data })
    else createMutation.mutate(data)
  }

  return (
    <>
      <Helmet>
        <title>Assets Other</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Package className="w-8 h-8" /> Other Assets
              </h1>
              <p className="text-slate-600 mt-1">Jewelry, art, electronics and more</p>
            </div>
            {atLimit ? (
              <Link to="/Upgrade">
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
                <Plus className="w-4 h-4 mr-2" /> Add Asset
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
            <p className="text-sm text-slate-500">Total Value</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {others.length} asset{others.length !== 1 ? 's' : ''}
              {otherLimit !== Infinity && ` · ${others.length}/${otherLimit} used`}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : others.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No other assets yet</h3>
              <p className="text-slate-600 mb-4">Track jewelry, art, electronics and more</p>
              {atLimit ? (
                <Link to="/Upgrade">
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
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Asset
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {others.map(asset => (
                <TangibleAssetCard
                  key={asset.id}
                  asset={asset}
                  onEdit={a => setForm({ open: true, asset: a })}
                  onDelete={id => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>

        <TangibleAssetForm
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
