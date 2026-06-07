import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CalendarPlus, Info, Plus, Trash2, ImagePlus, X, Lock } from 'lucide-react'
import VehicleCalendarDialog from './VehicleCalendarDialog'
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'
import { deleteCloudinaryImage } from '@/api/cloudinaryService'
import { Link } from 'react-router-dom'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useAuth } from '@/lib/AuthContext'

const MAX_REPAIR_IMAGES = 5
const MAX_IMAGE_SIZE_MB = 5

const empty = {
  title: '',
  description: '',
  category: 'vehicle',
  make: '',
  model: '',
  year: '',
  color: '',
  license_plate: '',
  vin: '',
  fuel_type: '',
  transmission: '',
  mileage: '',
  purchase_price: '',
  current_value: '',
  purchase_date: '',
  insurance_expiry: '',
  inspection_expiry: '',
  repairs: [],
  images: []
}

export default function CarAssetForm({ open, onClose, onSubmit, asset, isLoading }) {
  const [f, setF] = useState(empty)
  const [calDialog, setCalDialog] = useState(null) // { title, date }
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingRepairImg, setUploadingRepairImg] = useState(null)
  const vehicleImgRef = useRef<HTMLInputElement | null>(null)
  const repairImgRefs = useRef({})
  const uploadedPublicIdsRef = useRef<string[]>([])
  const { upload } = useCloudinaryUpload()

  useEffect(() => {
    uploadedPublicIdsRef.current = []
    if (asset) {
      setF({
        title: asset.title || '',
        description: asset.description || '',
        category: 'vehicle',
        make: asset.make || '',
        model: asset.model || '',
        year: asset.year || '',
        color: asset.color || '',
        license_plate: asset.license_plate || '',
        vin: asset.vin || '',
        fuel_type: asset.fuel_type || null,
        transmission: asset.transmission || null,
        mileage: asset.mileage || '',
        purchase_price: asset.purchase_price || '',
        current_value: asset.current_value || '',
        purchase_date: asset.purchase_date || '',
        insurance_expiry: asset.insurance_expiry || '',
        inspection_expiry: asset.inspection_expiry || '',
        repairs: (asset.repairs || []).map(r => ({ ...r, images: r.images || [] })),
        images: asset.images || []
      })
    } else {
      setF(empty)
    }
  }, [asset, open])

  const set = (key, val) => setF(prev => ({ ...prev, [key]: val }))

  const handleSubmit = e => {
    e.preventDefault()
    uploadedPublicIdsRef.current = []
    onSubmit({
      ...f,
      category: 'vehicle',
      year: f.year ? parseInt(f.year) : undefined,
      mileage: f.mileage ? parseFloat(f.mileage) : undefined,
      purchase_price: f.purchase_price ? parseFloat(f.purchase_price) : undefined,
      current_value: f.current_value ? parseFloat(f.current_value) : undefined,
      fuel_type: f.fuel_type || null,
      transmission: f.transmission || null,
      repairs: f.repairs.map(r => ({
        ...r,
        cost: r.cost ? parseFloat(r.cost) : undefined
      }))
    })
  }

  const handleClose = async () => {
    if (uploadedPublicIdsRef.current.length) {
      await Promise.allSettled(uploadedPublicIdsRef.current.map(id => deleteCloudinaryImage(id)))
      uploadedPublicIdsRef.current = []
    }
    onClose()
  }

  const addRepair = () => {
    setF(prev => ({
      ...prev,
      repairs: [...(prev.repairs || []), { date: '', description: '', cost: '', images: [] }]
    }))
  }
  const updateRepair = (idx, key, val) => {
    setF(prev => {
      const repairs = [...prev.repairs]
      repairs[idx] = { ...repairs[idx], [key]: val }
      return { ...prev, repairs }
    })
  }
  const removeRepair = idx => {
    setF(prev => ({ ...prev, repairs: prev.repairs.filter((_, i) => i !== idx) }))
  }

  const handleVehicleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = photoLimit - (f.images?.length || 0)
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length) return

    const oversized = toUpload.filter(file => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024)
    if (oversized.length) {
      alert(`Images must be under ${MAX_IMAGE_SIZE_MB}MB each.`)
      return
    }

    setUploadingImages(true)
    const uploaded = await Promise.all(
      toUpload.map(file =>
        upload(file, 'temp').then(r => {
          uploadedPublicIdsRef.current.push(r.public_id)
          return { url: r.secure_url, public_id: r.public_id }
        })
      )
    )
    setF(prev => ({ ...prev, images: [...(prev.images || []), ...uploaded] }))
    setUploadingImages(false)
    e.target.value = ''
  }

  const removeVehicleImage = async idx => {
    const img = f.images[idx]
    if (img?.public_id) {
      try {
        await deleteCloudinaryImage(img.public_id)
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err)
      }
      uploadedPublicIdsRef.current = uploadedPublicIdsRef.current.filter(id => id !== img.public_id)
    }
    setF(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
  }

  const handleRepairImages = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const existing = f.repairs[idx].images || []
    const remaining = MAX_REPAIR_IMAGES - existing.length
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length) return

    const oversized = toUpload.filter(file => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024)

    if (oversized.length) {
      alert(`Images must be under ${MAX_IMAGE_SIZE_MB}MB each.`)
      return
    }

    setUploadingRepairImg(idx)
    const uploaded = await Promise.all(
      toUpload.map(file =>
        upload(file, 'temp').then(r => {
          uploadedPublicIdsRef.current.push(r.public_id)
          return { url: r.secure_url, public_id: r.public_id }
        })
      )
    )
    updateRepair(idx, 'images', [...existing, ...uploaded])
    setUploadingRepairImg(null)
    e.target.value = ''
  }

  const removeRepairImage = async (repairIdx, imgIdx) => {
    const img = f.repairs[repairIdx].images[imgIdx]
    if (img?.public_id) {
      try {
        await deleteCloudinaryImage(img.public_id)
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err)
      }
      uploadedPublicIdsRef.current = uploadedPublicIdsRef.current.filter(id => id !== img.public_id)
    }
    const images = f.repairs[repairIdx].images.filter((_, i) => i !== imgIdx)
    updateRepair(repairIdx, 'images', images)
  }

  const { data } = useUserLimit()
  const photoLimit = data?.limits?.vehicle_photos || 5
  const repairLimit = data?.limits.vehicle_repairs || 1

  const { user } = useAuth()
  const isFree = user.subscription_tier === 'free'

  const vehicleName = f.title || [f.make, f.model].filter(Boolean).join(' ') || 'Vehicle'

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{asset ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Name / Title *</Label>
              <Input
                id="title"
                name="title"
                value={f.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. My BMW X5"
                required
              />
            </div>

            {/* Vehicle Photos - moved to top */}
            <div className="space-y-2">
              <Label>Vehicle Photos</Label>
              <div className="flex flex-wrap gap-2">
                {(f.images || []).map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <img
                      src={img.url}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeVehicleImage(idx)}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {(f.images || []).length < photoLimit && (
                  <button
                    type="button"
                    onClick={() => vehicleImgRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 hover:border-indigo-400 transition-colors"
                  >
                    {uploadingImages ? (
                      <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5 text-slate-400" />
                        <span className="text-xs text-slate-400">Add photo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={vehicleImgRef}
                onChange={handleVehicleImages}
              />
              <p className="text-xs text-slate-400">
                {(f.images || []).length}/{photoLimit === Infinity ? '∞' : photoLimit} photos · max{' '}
                {MAX_IMAGE_SIZE_MB}MB each
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  name="make"
                  value={f.make}
                  onChange={e => set('make', e.target.value)}
                  placeholder="e.g. BMW"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  value={f.model}
                  onChange={e => set('model', e.target.value)}
                  placeholder="e.g. X5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={f.year}
                  onChange={e => set('year', e.target.value)}
                  placeholder="2022"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  value={f.color}
                  onChange={e => set('color', e.target.value)}
                  placeholder="Black"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Select value={f.fuel_type} onValueChange={v => set('fuel_type', v)}>
                  <SelectTrigger id="fuel_type" name="fuel_type">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transmission">Transmission</Label>
                <Select value={f.transmission} onValueChange={v => set('transmission', v)}>
                  <SelectTrigger id="transmission" name="transmission">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage (km)</Label>
                <Input
                  id="mileage"
                  name="mileage"
                  type="number"
                  value={f.mileage}
                  onChange={e => set('mileage', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  name="license_plate"
                  value={f.license_plate}
                  onChange={e => set('license_plate', e.target.value)}
                  placeholder="AB 1234 CD"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                name="vin"
                value={f.vin}
                onChange={e => set('vin', e.target.value)}
                placeholder="Vehicle Identification Number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price</Label>
                <Input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  step="0.01"
                  value={f.purchase_price}
                  onChange={e => set('purchase_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_value">Current Value</Label>
                <Input
                  id="current_value"
                  name="current_value"
                  type="number"
                  step="0.01"
                  value={f.current_value}
                  onChange={e => set('current_value', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={f.purchase_date}
                onChange={e => set('purchase_date', e.target.value)}
              />
            </div>

            {/* Insurance Expiry */}
            <div className="space-y-2">
              <Label>Insurance Expiry</Label>
              {isFree ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          disabled
                          className="flex-1 opacity-50 cursor-not-allowed"
                        />
                        <Button type="button" variant="outline" size="icon" disabled>
                          <Lock className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Upgrade to Plus or Pro to track insurance expiry
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="insurance_expiry"
                    name="insurance_expiry"
                    type="date"
                    value={f.insurance_expiry}
                    onChange={e => set('insurance_expiry', e.target.value)}
                    className="flex-1"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={!f.insurance_expiry}
                          onClick={() =>
                            setCalDialog({
                              title: `Insurance Expiry – ${vehicleName}`,
                              date: f.insurance_expiry
                            })
                          }
                        >
                          <CalendarPlus className="w-4 h-4 text-indigo-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add to Calendar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* Inspection Expiry (TÜV) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="inspection_expiry">Inspection Expiry</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>TÜV Due Date</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isFree ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          disabled
                          className="flex-1 opacity-50 cursor-not-allowed"
                        />
                        <Button type="button" variant="outline" size="icon" disabled>
                          <Lock className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Upgrade to Plus or Pro to track inspection expiry
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="inspection_expiry"
                    name="inspection_expiry"
                    type="date"
                    value={f.inspection_expiry}
                    onChange={e => set('inspection_expiry', e.target.value)}
                    className="flex-1"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={!f.inspection_expiry}
                          onClick={() =>
                            setCalDialog({
                              title: `Inspection (TÜV) Due – ${vehicleName}`,
                              date: f.inspection_expiry
                            })
                          }
                        >
                          <CalendarPlus className="w-4 h-4 text-indigo-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add to Calendar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* Repairs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Repairs</Label>
                {(f.repairs || []).length >= repairLimit ? (
                  <Link to="/upgrade" onClick={onClose}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Lock className="w-3 h-3 mr-1" /> Upgrade for more
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRepair}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Repair
                  </Button>
                )}
              </div>
              {(f.repairs || []).length > 0 && (
                <div className="space-y-3">
                  {f.repairs.map((r, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            id={`repair_date_${idx}`}
                            name={`repair_date_${idx}`}
                            type="date"
                            value={r.date}
                            onChange={e => updateRepair(idx, 'date', e.target.value)}
                          />
                          <Input
                            id={`repair_cost_${idx}`}
                            name={`repair_cost_${idx}`}
                            type="number"
                            step="0.01"
                            value={r.cost}
                            onChange={e => updateRepair(idx, 'cost', e.target.value)}
                            placeholder="Cost"
                          />
                          <Input
                            id={`repair_description_${idx}`}
                            name={`repair_description_${idx}`}
                            value={r.description}
                            onChange={e => updateRepair(idx, 'description', e.target.value)}
                            placeholder="Description"
                            className="col-span-2"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 mt-1 text-rose-500"
                          onClick={() => removeRepair(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Repair images */}
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(r.images || []).map((img, imgIdx) => (
                            <div key={imgIdx} className="relative w-16 h-16">
                              <img
                                src={img.url}
                                alt=""
                                className="w-16 h-16 object-cover rounded-md border border-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeRepairImage(idx, imgIdx)}
                                className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                          {(r.images || []).length < MAX_REPAIR_IMAGES && (
                            <button
                              type="button"
                              onClick={() => repairImgRefs.current[idx]?.click()}
                              className="w-16 h-16 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-indigo-400 transition-colors"
                            >
                              {uploadingRepairImg === idx ? (
                                <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ImagePlus className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={el => (repairImgRefs.current[idx] = el)}
                          onChange={e => handleRepairImages(idx, e)}
                        />
                        <p className="text-xs text-slate-400">
                          {(r.images || []).length}/{MAX_REPAIR_IMAGES} photos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                name="description"
                value={f.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Any additional notes..."
                className="min-h-[60px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || uploadingImages || uploadingRepairImg !== null}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? 'Saving...' : asset ? 'Update' : 'Add Vehicle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {calDialog && (
        <VehicleCalendarDialog
          open={!!calDialog}
          onClose={() => setCalDialog(null)}
          title={calDialog.title}
          date={calDialog.date}
        />
      )}
    </>
  )
}
