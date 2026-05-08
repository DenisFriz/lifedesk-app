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

export default function TangibleAssetForm({ open, onClose, onSubmit, asset, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    purchase_price: '',
    current_value: '',
    purchase_date: '',
    location: ''
  })

  useEffect(() => {
    if (asset) {
      setFormData({
        title: asset.title || '',
        description: asset.description || '',
        category: asset.category || 'other',
        purchase_price: asset.purchase_price || '',
        current_value: asset.current_value || '',
        purchase_date: asset.purchase_date || '',
        location: asset.location || ''
      })
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'other',
        purchase_price: '',
        current_value: '',
        purchase_date: '',
        location: ''
      })
    }
  }, [asset, open])

  const handleSubmit = e => {
    e.preventDefault()
    const data = {
      ...formData,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
      current_value: formData.current_value ? parseFloat(formData.current_value) : undefined
    }
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'New Asset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Name</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., BMW X5, Rolex Watch"
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Details about the asset..."
              maxLength={5000}
              className="min-h-[60px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={value => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jewelry">Jewelry</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_value">Current Value</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={e => setFormData({ ...formData, current_value: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Input
              type="date"
              value={formData.purchase_date}
              onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Where is this asset located?"
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
              {isLoading ? 'Saving...' : asset ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
