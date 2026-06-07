import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Package, Lock } from 'lucide-react'
import TangibleAssetCard from '@/components/assets/TangibleAssetCard'
import TangibleAssetForm from '@/components/assets/TangibleAssetForm'
import { formatCurrency } from '@/components/utils/formatters'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useOtherAssetMutations } from '@/hooks/otherassets/useOtherAssetMutations'
import { OtherAssetRecord } from '@/db'
import { CreateOtherAssetInput } from '@/repositories/otherasset.repository'
import { useOtherAssetsQuery } from '@/hooks/otherassets/useOtherAssetsQuery'

export default function AssetsOther() {
  const [form, setForm] = useState({ open: false, asset: null })

  const { data: otherAssets, isLoading } = useOtherAssetsQuery()

  const { canCreate, data } = useUserLimit()

  const atLimit = !canCreate('otherAsset')
  const totalValue = otherAssets?.reduce(
    (s, a) => s + (a.current_value || a.purchase_price || 0),
    0
  )

  const { updateMutation, createMutation, deleteMutation } = useOtherAssetMutations()

  const handleUpdateOtherAsset = async ({
    id,
    data
  }: {
    id: string
    data: Partial<OtherAssetRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setForm({ open: false, asset: null })
    }
  }

  const handleCreateOtherAsset = async (data: CreateOtherAssetInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setForm({ open: false, asset: null })
    }
  }

  const handleDeleteOtherAsset = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setForm({ open: false, asset: null })
    }
  }

  const handleSubmit = data => {
    if (form.asset) handleUpdateOtherAsset({ id: form.asset.id, data })
    else handleCreateOtherAsset(data)
  }

  return (
    <>
      <Helmet>
        <title>Assets Other | LifeDesk</title>
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
                <Plus className="w-4 h-4 mr-2" /> Add Asset
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
            <p className="text-sm text-slate-500">Total Value</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {otherAssets?.length} asset{otherAssets?.length !== 1 ? 's' : ''}
              {` - ${data?.usage?.otherAsset || 0}/${data?.limits?.otherAsset} used`}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : otherAssets?.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No other assets yet</h3>
              <p className="text-slate-600 mb-4">Track jewelry, art, electronics and more</p>
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
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Asset
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherAssets?.map(asset => (
                <TangibleAssetCard
                  key={asset.id}
                  asset={asset}
                  onEdit={a => setForm({ open: true, asset: a })}
                  onDelete={id => handleDeleteOtherAsset(id)}
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
