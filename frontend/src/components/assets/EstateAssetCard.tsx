import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/components/utils/formatters'

const propertyTypeLabels = {
  apartment: 'Apartment',
  house: 'House',
  land: 'Land',
  commercial: 'Commercial',
  other: 'Other'
}

export default function EstateAssetCard({ asset, onEdit, onDelete }) {
  const displayValue = asset.current_value || asset.purchase_price || 0
  const equity =
    asset.current_value && asset.mortgage_amount
      ? asset.current_value - asset.mortgage_amount
      : null

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Home className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
            <Pencil className="h-4 w-4 text-slate-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(asset.id)}
          >
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      </div>

      <h3 className="font-semibold text-slate-900 mb-1">{asset.title}</h3>
      {asset.address && <p className="text-sm text-slate-500 mb-2">📍 {asset.address}</p>}

      <div className="flex flex-wrap gap-2 mb-3">
        {asset.property_type && (
          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">
            {propertyTypeLabels[asset.property_type] || asset.property_type}
          </Badge>
        )}
      </div>

      <div className="space-y-1 text-xs text-slate-500">
        {asset.area_sqm && <p>📐 {asset.area_sqm} m²</p>}
        {asset.rooms && (
          <p>
            🛏️ {asset.rooms} rooms{asset.floor != null ? `, floor ${asset.floor}` : ''}
          </p>
        )}
        {asset.year_built && <p>🏗️ Built {asset.year_built}</p>}
        {asset.monthly_rent && <p>💰 Rent income: {formatCurrency(asset.monthly_rent)}/mo</p>}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
        <div>
          <p className="text-xs text-slate-500">Current Value</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(displayValue)}</p>
        </div>
        {asset.mortgage_amount > 0 && (
          <p className="text-xs text-slate-500">
            Mortgage: {formatCurrency(asset.mortgage_amount)}
            {equity !== null && (
              <span className="ml-2 text-emerald-600 font-medium">
                Equity: {formatCurrency(equity)}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
