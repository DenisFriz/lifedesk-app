import { useState, useEffect } from 'react'
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

const empty = {
  title: '',
  description: '',
  category: 'real_estate',
  property_type: '',
  address: '',
  area_sqm: '',
  rooms: '',
  floor: '',
  year_built: '',
  purchase_price: '',
  current_value: '',
  purchase_date: '',
  mortgage_amount: '',
  monthly_rent: '',
  monthly_costs: '',
  monthly_mortgage_payment: ''
}

export default function EstateAssetForm({ open, onClose, onSubmit, asset, isLoading }) {
  const [f, setF] = useState(empty)

  useEffect(() => {
    if (asset) {
      setF({
        title: asset.title || '',
        description: asset.description || '',
        category: 'real_estate',
        property_type: asset.property_type || '',
        address: asset.address || '',
        area_sqm: asset.area_sqm || '',
        rooms: asset.rooms || '',
        floor: asset.floor || '',
        year_built: asset.year_built || '',
        purchase_price: asset.purchase_price || '',
        current_value: asset.current_value || '',
        purchase_date: asset.purchase_date || '',
        mortgage_amount: asset.mortgage_amount || '',
        monthly_rent: asset.monthly_rent || '',
        monthly_costs: asset.monthly_costs || '',
        monthly_mortgage_payment: asset.monthly_mortgage_payment || ''
      })
    } else {
      setF(empty)
    }
  }, [asset, open])

  const set = (key, val) => setF(prev => ({ ...prev, [key]: val }))

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({
      ...f,
      category: 'real_estate',
      area_sqm: f.area_sqm ? parseFloat(f.area_sqm) : undefined,
      rooms: f.rooms ? parseInt(f.rooms) : undefined,
      floor: f.floor ? parseInt(f.floor) : undefined,
      year_built: f.year_built ? parseInt(f.year_built) : undefined,
      purchase_price: f.purchase_price ? parseFloat(f.purchase_price) : undefined,
      current_value: f.current_value ? parseFloat(f.current_value) : undefined,
      mortgage_amount: f.mortgage_amount ? parseFloat(f.mortgage_amount) : undefined,
      monthly_rent: f.monthly_rent ? parseFloat(f.monthly_rent) : undefined,
      monthly_costs: f.monthly_costs ? parseFloat(f.monthly_costs) : undefined,
      monthly_mortgage_payment: f.monthly_mortgage_payment
        ? parseFloat(f.monthly_mortgage_payment)
        : undefined
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Estate' : 'Add Estate'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name / Title *</Label>
            <Input
              value={f.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. City Center Apartment"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Property Type</Label>
            <Select value={f.property_type} onValueChange={v => set('property_type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={f.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Full address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Area (m²)</Label>
              <Input
                type="number"
                value={f.area_sqm}
                onChange={e => set('area_sqm', e.target.value)}
                placeholder="85"
              />
            </div>
            <div className="space-y-2">
              <Label>Rooms</Label>
              <Input
                type="number"
                value={f.rooms}
                onChange={e => set('rooms', e.target.value)}
                placeholder="3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input
                type="number"
                value={f.floor}
                onChange={e => set('floor', e.target.value)}
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label>Year Built</Label>
              <Input
                type="number"
                value={f.year_built}
                onChange={e => set('year_built', e.target.value)}
                placeholder="1990"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Purchase Price</Label>
              <Input
                type="number"
                step="0.01"
                value={f.purchase_price}
                onChange={e => set('purchase_price', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input
                type="number"
                step="0.01"
                value={f.current_value}
                onChange={e => set('current_value', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Input
              type="date"
              value={f.purchase_date}
              onChange={e => set('purchase_date', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Outstanding Mortgage</Label>
              <Input
                type="number"
                step="0.01"
                value={f.mortgage_amount}
                onChange={e => set('mortgage_amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Rent Income</Label>
              <Input
                type="number"
                step="0.01"
                value={f.monthly_rent}
                onChange={e => set('monthly_rent', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monthly Costs</Label>
              <Input
                type="number"
                step="0.01"
                value={f.monthly_costs}
                onChange={e => set('monthly_costs', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Mortgage Payment</Label>
              <Input
                type="number"
                step="0.01"
                value={f.monthly_mortgage_payment}
                onChange={e => set('monthly_mortgage_payment', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={f.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Any additional notes..."
              className="min-h-[60px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Saving...' : asset ? 'Update' : 'Add Estate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
