import { useState } from 'react'
import { backend } from '@/api/backend'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Briefcase, Pencil, Trash2, GripVertical, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BUSINESS_CATEGORIES } from '@/components/finances/categories'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Helmet } from 'react-helmet-async'
import { useBusinessesQuery } from '@/hooks/businesses/useBusinessesQuery'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useBusinessMutations } from '@/hooks/businesses/useBusinessMutations'
import { CreateBusinessInput } from '@/repositories/business.repository'
import { BusinessRecord } from '@/db'
import { useAuth } from '@/lib/AuthContext'

export default function ManageBusinesses() {
  const [showForm, setShowForm] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(null)
  const queryClient = useQueryClient()

  const { canCreate, data } = useUserLimit()

  const { user } = useAuth()

  const { data: businesses = [] } = useBusinessesQuery()

  const atLimit = canCreate('business')

  const { createMutation, updateMutation, deleteMutation } = useBusinessMutations()

  const handleCreateBusiness = async (data: CreateBusinessInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingBusiness(null)
    }
  }

  const handleUpdateBusiness = async ({
    id,
    data
  }: {
    id: string
    data: Partial<BusinessRecord>
  }) => {
    try {
      await updateMutation.mutateAsync({ id, data })
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingBusiness(null)
    }
  }

  const handleDeleteBusiness = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      setShowForm(false)
      setEditingBusiness(null)
    }
  }

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    const data = {
      created_by: user.id,
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || ''),
      categories: BUSINESS_CATEGORIES,
      color: String(formData.get('color') || 'indigo'),
      order: editingBusiness?.order ?? businesses.length
    }

    if (editingBusiness) {
      handleUpdateBusiness({ id: editingBusiness.id, data })
    } else {
      handleCreateBusiness(data)
    }
  }

  const openForm = business => {
    setEditingBusiness(business)
    setShowForm(true)
  }

  return (
    <>
      <Helmet>
        <title>Manage Businesses</title>
      </Helmet>
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
                  Limit reached ({data?.usage?.business}/{data?.limits?.business})
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openForm(business)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Delete "${business.name}"?`)) {
                                    handleDeleteBusiness(business.id)
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
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Description
                  </label>
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
    </>
  )
}
