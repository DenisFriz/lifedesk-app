import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, ChevronLeft, ChevronRight, Shield, Wrench, X, ZoomIn } from 'lucide-react'
import { formatCurrency } from '@/components/utils/formatters'
import { differenceInDays, parseISO, isValid } from 'date-fns'

function DaysChip({ date, label, icon: Icon }) {
  if (!date) return null
  const parsed = parseISO(date)
  if (!isValid(parsed)) return null
  const days = differenceInDays(parsed, new Date())
  const urgent = days <= 30
  const warn = days <= 90
  const color = urgent
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : warn
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      <span className="font-semibold">{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}</span>
    </div>
  )
}

function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)

  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrent(i => (i - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % images.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [images.length, onClose])

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
            onClick={e => {
              e.stopPropagation()
              setCurrent(i => (i - 1 + images.length) % images.length)
            }}
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
            onClick={e => {
              e.stopPropagation()
              setCurrent(i => (i + 1) % images.length)
            }}
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}

      <img
        src={images[current]}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => {
                e.stopPropagation()
                setCurrent(i)
              }}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CarAssetCard({ asset, onEdit, onDelete }) {
  const [imgIndex, setImgIndex] = useState(0)
  const [lightbox, setLightbox] = useState(null) // { images, startIndex }
  const images = asset.images || []
  const displayValue = asset.current_value || asset.purchase_price || 0

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow overflow-hidden">
        {/* Image carousel */}
        {images.length > 0 && (
          <div className="relative h-44 bg-slate-100 group">
            <img
              src={images[imgIndex]}
              alt=""
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setLightbox({ images, startIndex: imgIndex })}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setImgIndex(i => (i - 1 + images.length) % images.length)
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60 z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setImgIndex(i => (i + 1) % images.length)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60 z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
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
          {(asset.make || asset.model) && (
            <p className="text-sm text-slate-500 mb-2">
              {[asset.make, asset.model, asset.year].filter(Boolean).join(' ')}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {asset.fuel_type && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {asset.fuel_type}
              </Badge>
            )}
            {asset.transmission && (
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                {asset.transmission}
              </Badge>
            )}
            {asset.color && (
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                {asset.color}
              </Badge>
            )}
          </div>

          <div className="space-y-1 text-xs text-slate-500 mb-3">
            {asset.mileage != null && <p>🛣️ {asset.mileage.toLocaleString()} km</p>}
            {asset.license_plate && <p>🔢 {asset.license_plate}</p>}
          </div>

          {/* Last 5 repairs */}
          {asset.repairs?.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-slate-600">🛠️ Recent Repairs</p>
                <p className="text-xs font-semibold text-rose-600">
                  Total:{' '}
                  {formatCurrency(
                    asset.repairs.reduce((sum, r) => sum + (r.cost ? parseFloat(r.cost) : 0), 0)
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {[...asset.repairs]
                  .reverse()
                  .slice(0, 5)
                  .map((r, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                        <span className="text-slate-700 truncate flex-1 mr-2">
                          {r.description || 'Repair'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.cost ? (
                            <span className="text-slate-500">
                              {Number(r.cost).toLocaleString()} €
                            </span>
                          ) : null}
                          {r.date ? <span className="text-slate-400">{r.date}</span> : null}
                        </div>
                      </div>
                      {/* Repair-specific images */}
                      {r.images?.length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {r.images.map((img, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={img}
                              alt=""
                              className="w-12 h-12 object-cover rounded border border-slate-200 cursor-zoom-in hover:opacity-80 transition-opacity"
                              onClick={() => setLightbox({ images: r.images, startIndex: imgIdx })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Insurance & Inspection date chips */}
          {(asset.insurance_expiry || asset.inspection_expiry) && (
            <div className="flex flex-wrap gap-2 mb-3">
              <DaysChip date={asset.insurance_expiry} label="Insurance" icon={Shield} />
              <DaysChip date={asset.inspection_expiry} label="TÜV" icon={Wrench} />
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Current Value</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(displayValue)}</p>
          </div>

          {asset.description && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{asset.description}</p>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
