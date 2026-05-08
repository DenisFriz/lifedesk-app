import React, { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Briefcase, Pencil, Trash2, GripVertical, X, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BUSINESS_CATEGORIES } from '@/components/finances/categories'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useSubscription } from '@/hooks/useSubscription'

export default function ManageBusinesses() {
  const [showForm, setShowForm] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(null)
  const queryClient = useQueryClient()

  const { limit } = useSubscription()
  const businessLimit = limit('business_manage_businesses_limit')

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const data = await backend.entities.Business.list('order')
      return data.filter(r => !r.is_deleted)
    }
  })

  const atLimit = businessLimit !== Infinity && businesses.length >= businessLimit

  const createMutation = useMutation({
    mutationFn: data => backend.entities.Business.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      setShowForm(false)
      setEditingBusiness(null)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => backend.entities.Business.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      setShowForm(false)
      setEditingBusiness(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: id => backend.entities.Business.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    }
  })

  const handleDragEnd = result => {
    if (!result.destination) return
    const items = Array.from(businesses)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    // Persist new order for each business
    items.forEach((biz, index) => {
      backend.entities.Business.update(biz.id, { order: index })
    })
    queryClient.setQueryData(['businesses'], items)
  }

  const handleSubmit = e => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      categories: BUSINESS_CATEGORIES,
      color: formData.get('color') || 'indigo',
      order: editingBusiness?.order || businesses.length
    }

    if (editingBusiness) {
      updateMutation.mutate({ id: editingBusiness.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const openForm = business => {
    setEditingBusiness(business)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="managebusinesses-page-title text-4xl font-bold text-slate-900 mb-2">
              Manage Businesses
            </h1>
            <p className="text-slate-600">Add, edit, or remove your businesses</p>
          </div>
          {atLimit ? (
            <Link to="/Upgrade">
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Lock className="w-4 h-4 mr-2" />
                Limit reached ({businesses.length}/{businessLimit})
              </Button>
            </Link>
          ) : (
            <Button onClick={() => openForm(null)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          )}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="businesses">
            {provided => (
              <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
                {businesses.map((business, index) => (
                  <Draggable key={business.id} draggableId={business.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-xl border border-slate-200 p-6 transition-shadow ${snapshot.isDragging ? 'shadow-xl' : 'hover:shadow-lg'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing mt-1"
                            >
                              <GripVertical className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Briefcase className="w-5 h-5 text-indigo-600" />
                                <h3 className="managebusinesses-card-title font-semibold text-slate-900">
                                  {business.name}
                                </h3>
                              </div>
                              {business.description && (
                                <p className="text-sm text-slate-600">{business.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openForm(business)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`Delete "${business.name}"?`)) {
                                  deleteMutation.mutate(business.id)
                                }
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {businesses.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No businesses yet</p>
            {!atLimit && (
              <Button onClick={() => openForm(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Business
              </Button>
            )}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBusiness ? 'Edit Business' : 'Add Business'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Name</label>
                <Input
                  name="name"
                  defaultValue={editingBusiness?.name}
                  placeholder="e.g., Freelance, Company, Affiliate"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                <Textarea
                  name="description"
                  defaultValue={editingBusiness?.description}
                  placeholder="Brief description of your business"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingBusiness ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
