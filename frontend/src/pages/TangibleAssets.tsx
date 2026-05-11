import { useState, useRef, useEffect } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Plus, Package, Home, Car } from 'lucide-react'
import { Package as PackageIcon } from 'lucide-react'
import CarAssetCard from '@/components/assets/CarAssetCard'
import EstateAssetCard from '@/components/assets/EstateAssetCard'
import TangibleAssetCard from '@/components/assets/TangibleAssetCard'
import CarAssetForm from '@/components/assets/CarAssetForm'
import EstateAssetForm from '@/components/assets/EstateAssetForm'
import TangibleAssetForm from '@/components/assets/TangibleAssetForm'
import { formatCurrency } from '@/components/utils/formatters'
import { Helmet } from 'react-helmet-async'

type TangibleAsset = {
  id: string
  category: 'vehicle' | 'real_estate' | string
  current_value?: number
  purchase_price?: number
}

export default function TangibleAssets() {
  const [carForm, setCarForm] = useState({ open: false, asset: null })
  const [estateForm, setEstateForm] = useState({ open: false, asset: null })
  const [otherForm, setOtherForm] = useState({ open: false, asset: null })
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!headerRef.current) return
    const observer = new IntersectionObserver(([entry]) => setIsScrolled(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: '-60px 0px 0px 0px'
    })
    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  const { data: assets = [], isLoading } = useQuery<TangibleAsset[]>({
    queryKey: ['tangible-assets'],
    queryFn: () => backend.entities.TangibleAsset.list('-created_date') as Promise<TangibleAsset[]>
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<TangibleAsset>) => backend.entities.TangibleAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tangible-assets'] })
      setCarForm({ open: false, asset: null })
      setEstateForm({ open: false, asset: null })
      setOtherForm({ open: false, asset: null })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TangibleAsset> }) =>
      backend.entities.TangibleAsset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tangible-assets'] })
      setCarForm({ open: false, asset: null })
      setEstateForm({ open: false, asset: null })
      setOtherForm({ open: false, asset: null })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.entities.TangibleAsset.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tangible-assets'] })
  })

  const handleSubmit = (data: Partial<TangibleAsset>) => {
    const editing = carForm.asset || estateForm.asset || otherForm.asset
    if (editing) {
      updateMutation.mutate({ id: editing.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading2 = createMutation.isPending || updateMutation.isPending

  const cars = assets.filter(a => a.category === 'vehicle')
  const estates = assets.filter(a => a.category === 'real_estate')
  const others = assets.filter(a => a.category !== 'vehicle' && a.category !== 'real_estate')
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || a.purchase_price || 0), 0)

  const SectionHeader = ({ icon: Icon, title, count, value, onAdd, addLabel }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <span className="text-sm text-slate-400">({count})</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">{formatCurrency(value)}</span>
        <Button size="sm" onClick={onAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-3 h-3 mr-1" />
          {addLabel}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>Tangible Assets</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isScrolled && (
            <div className="lg:hidden sticky top-[52px] z-20 bg-white border-b border-slate-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="py-3">
                <h1 className="text-sm font-normal text-slate-900 text-center">Physical Assets</h1>
              </div>
            </div>
          )}
          <div ref={headerRef} className="py-6 sm:py-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center lg:text-left mb-2 flex items-center justify-center lg:justify-start gap-3">
              <PackageIcon className="w-8 h-8 sm:w-9 sm:h-9" />
              Physical Assets
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-center lg:text-left">
              Track your physical assets and valuables
            </p>
          </div>

          {/* Total Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
            <p className="text-sm text-slate-600 mb-1">Total Asset Value</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-10">
              {/* Cars Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader
                  icon={Car}
                  title="Cars"
                  count={cars.length}
                  value={cars.reduce((s, a) => s + (a.current_value || a.purchase_price || 0), 0)}
                  onAdd={() => setCarForm({ open: true, asset: null })}
                  addLabel="Add Car"
                />
                {cars.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No cars added yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cars.map(asset => (
                      <CarAssetCard
                        key={asset.id}
                        asset={asset}
                        onEdit={a => setCarForm({ open: true, asset: a })}
                        onDelete={id => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Estates Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader
                  icon={Home}
                  title="Estates"
                  count={estates.length}
                  value={estates.reduce(
                    (s, a) => s + (a.current_value || a.purchase_price || 0),
                    0
                  )}
                  onAdd={() => setEstateForm({ open: true, asset: null })}
                  addLabel="Add Estate"
                />
                {estates.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Home className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No estates added yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {estates.map(asset => (
                      <EstateAssetCard
                        key={asset.id}
                        asset={asset}
                        onEdit={a => setEstateForm({ open: true, asset: a })}
                        onDelete={id => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Other Assets Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader
                  icon={Package}
                  title="Other Assets"
                  count={others.length}
                  value={others.reduce((s, a) => s + (a.current_value || a.purchase_price || 0), 0)}
                  onAdd={() => setOtherForm({ open: true, asset: null })}
                  addLabel="Add Asset"
                />
                {others.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No other assets added yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {others.map(asset => (
                      <TangibleAssetCard
                        key={asset.id}
                        asset={asset}
                        onEdit={a => setOtherForm({ open: true, asset: a })}
                        onDelete={id => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <CarAssetForm
          open={carForm.open}
          asset={carForm.asset}
          onClose={() => setCarForm({ open: false, asset: null })}
          onSubmit={handleSubmit}
          isLoading={isLoading2}
        />
        <EstateAssetForm
          open={estateForm.open}
          asset={estateForm.asset}
          onClose={() => setEstateForm({ open: false, asset: null })}
          onSubmit={handleSubmit}
          isLoading={isLoading2}
        />
        <TangibleAssetForm
          open={otherForm.open}
          asset={otherForm.asset}
          onClose={() => setOtherForm({ open: false, asset: null })}
          onSubmit={handleSubmit}
          isLoading={isLoading2}
        />
      </div>
    </>
  )
}
