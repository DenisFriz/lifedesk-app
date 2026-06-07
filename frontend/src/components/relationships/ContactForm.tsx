import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface FormData {
  name: string
  relationship: string
  avatar_color: string
  birthday: string
  phone: string
  email: string
  location: string
  notes: string
  interests: string
  check_in_frequency: string
  last_contact_date: string
}

const empty = (): FormData => ({
  name: '',
  relationship: 'friend',
  avatar_color: 'indigo',
  birthday: '',
  phone: '',
  email: '',
  location: '',
  notes: '',
  interests: '',
  check_in_frequency: 'monthly',
  last_contact_date: ''
})

interface Props {
  open: boolean
  onClose: (open?: boolean) => void
  onSubmit: (data: any) => void
  contact?: any
  isLoading?: boolean
}

export default function ContactForm({
  open,
  onClose,
  onSubmit,
  contact,
  isLoading = false
}: Props) {
  const [form, setForm] = useState<FormData>(empty())

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name || '',
        relationship: contact.relationship || 'friend',
        avatar_color: contact.avatar_color || 'indigo',
        birthday: contact.birthday || '',
        phone: contact.phone || '',
        email: contact.email || '',
        location: contact.location || '',
        notes: contact.notes || '',
        interests: contact.interests || '',
        check_in_frequency: contact.check_in_frequency || 'monthly',
        last_contact_date: contact.last_contact_date || ''
      })
    } else {
      setForm(empty())
    }
  }, [contact, open])

  const set = (key: keyof FormData, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = { ...form }
    if (!data.birthday) delete data.birthday
    if (!data.last_contact_date) delete data.last_contact_date
    if (!data.phone) delete data.phone
    if (!data.email) delete data.email
    if (!data.location) delete data.location
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="name"
            name="name"
            placeholder="Name *"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select value={form.relationship} onValueChange={v => set('relationship', v)}>
              <SelectTrigger id="relationship" name="relationship">
                <SelectValue placeholder="Relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="close_friend">Close Friend</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="colleague">Colleague</SelectItem>
                <SelectItem value="acquaintance">Acquaintance</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.avatar_color} onValueChange={v => set('avatar_color', v)}>
              <SelectTrigger id="avatar_color" name="avatar_color">
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                {[
                  'rose',
                  'pink',
                  'purple',
                  'indigo',
                  'blue',
                  'teal',
                  'emerald',
                  'amber',
                  'orange'
                ].map(c => (
                  <SelectItem key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="birthday" className="text-xs text-slate-500 mb-1 block">
                Birthday
              </label>
              <Input
                id="birthday"
                name="birthday"
                type="date"
                value={form.birthday}
                onChange={e => set('birthday', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="last_contact_date" className="text-xs text-slate-500 mb-1 block">
                Last Contact
              </label>
              <Input
                id="last_contact_date"
                name="last_contact_date"
                type="date"
                value={form.last_contact_date}
                onChange={e => set('last_contact_date', e.target.value)}
              />
            </div>
          </div>

          <Select value={form.check_in_frequency} onValueChange={v => set('check_in_frequency', v)}>
            <SelectTrigger id="check_in_frequency" name="check_in_frequency">
              <SelectValue placeholder="Check-in Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="twice_a_year">Twice a year</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Input
            id="phone"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
          <Input
            id="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
          <Input
            id="location"
            name="location"
            placeholder="Location (city/country)"
            value={form.location}
            onChange={e => set('location', e.target.value)}
          />
          <Input
            id="interests"
            name="interests"
            placeholder="Interests / topics to talk about"
            value={form.interests}
            onChange={e => set('interests', e.target.value)}
          />

          <Textarea
            id="notes"
            name="notes"
            placeholder="Personal notes..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className="resize-none"
          />

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {contact ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
