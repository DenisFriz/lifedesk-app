import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Car, Gem, Palette, Smartphone, Package, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/components/utils/formatters'

const categoryConfig = {
  real_estate: { icon: Home, label: 'Real Estate', color: 'bg-indigo-50 text-indigo-700' },
  vehicle: { icon: Car, label: 'Vehicle', color: 'bg-blue-50 text-blue-700' },
  jewelry: { icon: Gem, label: 'Jewelry', color: 'bg-pink-50 text-pink-700' },
  art: { icon: Palette, label: 'Art', color: 'bg-purple-50 text-purple-700' },
  electronics: { icon: Smartphone, label: 'Electronics', color: 'bg-emerald-50 text-emerald-700' },
  other: { icon: Package, label: 'Other', color: 'bg-slate-50 text-slate-700' }
}

export default function TangibleAssetCard({ asset, onEdit, onDelete }) {
  const config = categoryConfig[asset.category] || categoryConfig.other
  const Icon = config.icon
  const displayValue = asset.current_value || asset.purchase_price || 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg ${config.color.replace('text-', 'bg-').split(' ')[0]} flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${config.color.split(' ')[1]}`} />
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

      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{asset.title}</h3>
      {asset.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{asset.description}</p>
      )}

      <div className="space-y-2">
        <Badge variant="outline" className={config.color}>
          {config.label}
        </Badge>
        <div className="pt-2">
          <p className="text-sm text-slate-500">Current Value</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(displayValue)}</p>
        </div>
        {asset.location && <p className="text-xs text-slate-500 pt-1">📍 {asset.location}</p>}
      </div>
    </div>
  )
}
