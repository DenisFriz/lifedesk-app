import React, { useState, useEffect } from 'react'
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

interface ProblemFormData {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
}

interface ProblemFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ProblemFormData) => void
  problem?: any
  isLoading?: boolean
}

export default function ProblemForm({ open, onClose, onSubmit, problem, isLoading }: ProblemFormProps) {
  const [formData, setFormData] = useState<ProblemFormData>({
    title: '',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (problem) {
      setFormData({
        title: problem.title || '',
        description: problem.description || '',
        priority: problem.priority || 'medium'
      })
    } else {
      setFormData({ title: '', description: '', priority: 'medium' })
    }
  }, [problem, open])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{problem ? 'Edit Problem' : 'New Problem'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's the problem?"
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the problem..."
              maxLength={5000}
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: string) => setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              {isLoading ? 'Saving...' : problem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
