import { useState, useRef } from 'react'
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'
import { deleteCloudinaryImage, moveCloudinaryImages } from '@/api/cloudinaryService'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Trash2,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Archive,
  Lock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Helmet } from 'react-helmet-async'
import { useProgressPhotosQuery } from '@/hooks/progressphotos/useProgressPhotosQuery'
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useProgressPhotoMutations } from '@/hooks/progressphotos/useProgressPhotoMutations'
import { CreateProgressPhotoInput } from '@/repositories/progressphotos.repository'
import { useAuth } from '@/lib/AuthContext'

const bodyAreaLabels = {
  front: 'Front',
  back: 'Back',
  side: 'Side',
  full_body: 'Full Body',
  arms: 'Arms',
  chest: 'Chest',
  legs: 'Legs',
  core: 'Core',
  other: 'Other'
} as const

export default function ProgressPhotos() {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showComparisonMode, setShowComparisonMode] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [comparisonPhotoIndex, setComparisonPhotoIndex] = useState(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState(new Set())
  const [longPressTimers, setLongPressTimers] = useState({})
  const [showArchived, setShowArchived] = useState(false)

  const { canCreate, data: userLimits } = useUserLimit()

  const { data: photos = [], isLoading } = useProgressPhotosQuery()

  const { deleteMutation, bulkDeleteMutation, bulkUpdateMutation } = useProgressPhotoMutations()

  const handleDeleteProgressPhoto = async (id: string) => {
    const photo = photos.find(p => p.id === id)
    try {
      await deleteMutation.mutateAsync(id)
      if (photo?.public_id) {
        try {
          await deleteCloudinaryImage(photo.public_id)
        } catch {}
      }
    } catch (e) {
      console.error(e)
    } finally {
      toast.success('Photo deleted')
    }
  }

  const handleArchiveProgressPhotos = async (ids: string[]) => {
    try {
      await bulkUpdateMutation.mutateAsync({ ids, data: { is_archived: true } })
    } catch (e) {
      console.error(e)
    } finally {
      setSelectedPhotos(new Set())
      setSelectionMode(false)
      toast.success('Photos archived')
    }
  }

  const handleDeleteProgressPhotos = async (ids: string[]) => {
    const photosToDelete = photos.filter(p => ids.includes(p.id))
    try {
      await bulkDeleteMutation.mutateAsync(ids)
      await Promise.allSettled(
        photosToDelete.filter(p => p.public_id).map(p => deleteCloudinaryImage(p.public_id!))
      )
    } catch (e) {
      console.error(e)
    } finally {
      setSelectedPhotos(new Set())
      setSelectionMode(false)
      toast.success('Photos deleted')
    }
  }

  const handleLongPress = (photoId: string) => {
    if (!selectionMode) {
      setSelectionMode(true)
      setSelectedPhotos(new Set([photoId]))
    }
  }

  const handlePhotoPress = (photoId: string) => {
    if (selectionMode) {
      setSelectedPhotos(prev => {
        const newSet = new Set(prev)
        if (newSet.has(photoId)) {
          newSet.delete(photoId)
        } else {
          newSet.add(photoId)
        }
        return newSet
      })
    }
  }

  const startLongPress = (photoId: string) => {
    const timer = setTimeout(() => handleLongPress(photoId), 500)
    setLongPressTimers(prev => ({ ...prev, [photoId]: timer }))
  }

  const cancelLongPress = (photoId: string) => {
    if (longPressTimers[photoId]) {
      clearTimeout(longPressTimers[photoId])
      setLongPressTimers(prev => {
        const newTimers = { ...prev }
        delete newTimers[photoId]
        return newTimers
      })
    }
  }

  const handleRestoreProgressPhoto = async (id: string) => {
    try {
      await bulkUpdateMutation.mutateAsync({ ids: [id], data: { is_archived: false } })
    } catch (e) {
      console.error(e)
    } finally {
      toast.success('Photo restored')
    }
  }

  const filteredPhotos = photos.filter(p => p.is_archived === showArchived)
  const isOverLimit = !canCreate('progressPhotos')

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))
  }

  const handleNextPhoto = () => {
    setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1))
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  const currentPhoto = photos[selectedPhotoIndex]

  return (
    <>
      <Helmet>
        <title>Progress Photos | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                <Camera className="w-9 h-9" />
                Progress Photos
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Track your body transformation with photos
              </p>
            </div>
            {isOverLimit ? (
              <Link to="/upgrade">
                <Button className="bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Limit reached ({userLimits?.usage?.progressPhotos || 0}/
                  {userLimits?.limits?.progressPhotos})
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
            )}
          </div>

          {/* Tabs for Active/Archived */}
          {photos.length > 0 && (
            <div className="flex gap-4 mb-6 border-b border-slate-200">
              <button
                onClick={() => {
                  setShowArchived(false)
                  setSelectionMode(false)
                  setSelectedPhotos(new Set())
                }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  !showArchived
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Photos
              </button>
              <button
                onClick={() => {
                  setShowArchived(true)
                  setSelectionMode(false)
                  setSelectedPhotos(new Set())
                }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  showArchived
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Archived ({photos.filter(p => p.is_archived).length})
              </button>
            </div>
          )}

          {filteredPhotos.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                {showArchived ? 'No archived photos' : 'No progress photos yet'}
              </p>
              {!showArchived && !isOverLimit && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Your First Photo
                </Button>
              )}
            </div>
          ) : showComparisonMode && comparisonPhotoIndex !== null ? (
            <ProgressPhotoComparison
              photo1={currentPhoto}
              photo2={photos[comparisonPhotoIndex]}
              onClose={() => setShowComparisonMode(false)}
              photo1Label={`${format(new Date(currentPhoto.date), 'MMM d, yyyy')}`}
              photo2Label={`${format(new Date(photos[comparisonPhotoIndex].date), 'MMM d, yyyy')}`}
            />
          ) : filteredPhotos.length > 0 ? (
            <div className="space-y-6">
              {/* Main Photo Display with Gallery Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Photo - Smaller on desktop, full width on mobile */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div
                      className="relative bg-slate-100 w-full flex items-center justify-center"
                      style={{ aspectRatio: '3/4', maxHeight: '80vh' }}
                    >
                      <img
                        src={currentPhoto.image_url}
                        alt="Progress photo"
                        className="w-full h-full object-contain"
                      />
                      {filteredPhotos.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevPhoto}
                            disabled={selectedPhotoIndex === 0}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={handleNextPhoto}
                            disabled={selectedPhotoIndex === filteredPhotos.length - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-slate-600 mb-1">
                            {format(new Date(currentPhoto.date), 'MMMM d, yyyy')}
                          </p>
                          {currentPhoto.body_area && (
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              {bodyAreaLabels[currentPhoto.body_area]}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {showArchived ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestoreProgressPhoto(currentPhoto.id)}
                              className="text-blue-600 hover:bg-blue-50"
                              title="Restore photo"
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchiveProgressPhotos([currentPhoto.id])}
                              className="text-amber-600 hover:bg-amber-50"
                              title="Archive photo"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProgressPhoto(currentPhoto.id)}
                            className="text-red-600 hover:bg-red-50"
                            title="Delete photo permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {currentPhoto.description && (
                        <p className="text-slate-700">{currentPhoto.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gallery Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {showArchived ? 'Archived' : 'All'} ({filteredPhotos.length})
                      </h3>
                      {selectionMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectionMode(false)
                            setSelectedPhotos(new Set())
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredPhotos.map((photo, idx) => {
                        const isSelected = selectedPhotos.has(photo.id)
                        return (
                          <button
                            key={photo.id}
                            onMouseDown={() => startLongPress(photo.id)}
                            onMouseUp={() => cancelLongPress(photo.id)}
                            onMouseLeave={() => cancelLongPress(photo.id)}
                            onTouchStart={() => startLongPress(photo.id)}
                            onTouchEnd={() => cancelLongPress(photo.id)}
                            onClick={() => {
                              if (selectionMode) {
                                handlePhotoPress(photo.id)
                              } else {
                                setSelectedPhotoIndex(idx)
                              }
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              selectionMode && isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-600'
                                : !selectionMode && idx === selectedPhotoIndex
                                  ? 'border-indigo-600 ring-2 ring-indigo-600'
                                  : 'border-slate-200 hover:border-indigo-400'
                            }`}
                          >
                            <img
                              src={photo.image_url}
                              alt={format(new Date(photo.date), 'MMM d')}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-1">
                              <span className="text-xs text-white font-medium">
                                {format(new Date(photo.date), 'MMM d')}
                              </span>
                            </div>
                            {selectionMode && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'bg-indigo-600 border-indigo-600'
                                      : 'bg-white border-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {selectionMode && selectedPhotos.size > 0 && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleArchiveProgressPhotos(Array.from(selectedPhotos) as string[])
                          }
                          className="flex-1"
                        >
                          Archive
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDeleteProgressPhotos(Array.from(selectedPhotos) as string[])
                          }
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comparison Tool */}
              {!showArchived && filteredPhotos.length > 1 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Compare with other photo</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredPhotos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => {
                          setComparisonPhotoIndex(idx)
                          setShowComparisonMode(true)
                        }}
                        disabled={idx === selectedPhotoIndex}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          idx === selectedPhotoIndex
                            ? 'border-slate-300 opacity-50 cursor-not-allowed'
                            : 'border-slate-200 hover:border-indigo-600 cursor-pointer'
                        }`}
                      >
                        <img
                          src={photo.image_url}
                          alt={format(new Date(photo.date), 'MMM d')}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                          <span className="text-xs text-white font-medium">
                            {format(new Date(photo.date), 'MMM d')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <ProgressPhotoUploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
        </div>
      </div>
    </>
  )
}

type BodyArea =
  | 'front'
  | 'back'
  | 'side'
  | 'full_body'
  | 'arms'
  | 'chest'
  | 'legs'
  | 'core'
  | 'other'

type FormData = {
  date: string
  description: string
  body_area: BodyArea
}

function ProgressPhotoUploadDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    body_area: 'full_body'
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)
  const uploadedPublicIdRef = useRef<string | null>(null)

  const { user } = useAuth()

  const { upload, isLoading: uploading } = useCloudinaryUpload()

  const { createMutation } = useProgressPhotoMutations()

  const handleClose = async () => {
    if (uploadedPublicIdRef.current) {
      try {
        await deleteCloudinaryImage(uploadedPublicIdRef.current)
      } catch {}
      uploadedPublicIdRef.current = null
    }
    onOpenChange(false)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      body_area: 'full_body'
    })
    setSelectedFile(null)
  }

  const handleCreateProgressPhoto = async (data: CreateProgressPhotoInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      uploadedPublicIdRef.current = null
      onOpenChange(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        body_area: 'full_body'
      })
      setSelectedFile(null)
      toast.success('Photo uploaded successfully')
    }
  }

  const handleFileSelect = async e => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxFileSize = 10 * 1024 * 1024
    if (file.size > maxFileSize) {
      toast.error('File size exceeds 10MB limit')
      return
    }

    if (uploadedPublicIdRef.current) {
      try {
        await deleteCloudinaryImage(uploadedPublicIdRef.current)
      } catch {}
      uploadedPublicIdRef.current = null
    }

    try {
      const res = await upload(file, 'temp')
      uploadedPublicIdRef.current = res.public_id
      setSelectedFile({ file, url: res.secure_url })
    } catch (error) {
      toast.error('Failed to upload file')
      console.error('File upload error:', error)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('Please select a photo')
      return
    }

    let imageUrl = selectedFile.url
    let publicId = uploadedPublicIdRef.current ?? undefined

    // Move from temp/ to uploads/ before persisting
    if (uploadedPublicIdRef.current?.startsWith('temp/')) {
      try {
        const moved = await moveCloudinaryImages([uploadedPublicIdRef.current])
        if (moved.length > 0) {
          imageUrl = moved[0].new_url
          publicId = moved[0].new_public_id
          uploadedPublicIdRef.current = null
        }
      } catch (err) {
        console.error('Failed to move image to uploads:', err)
      }
    }

    handleCreateProgressPhoto({
      ...formData,
      image_url: imageUrl,
      public_id: publicId,
      created_by: user.id,
      is_archived: false
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Progress Photo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <img
                    src={selectedFile.url}
                    alt="Preview"
                    className="w-32 h-32 object-cover mx-auto rounded"
                  />
                  <p className="text-sm text-slate-600">{selectedFile.file.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-900">Click to upload photo</p>
                  <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-900 mb-2">
              Date
            </label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="body_area" className="block text-sm font-medium text-slate-900 mb-2">
              Body Area
            </label>
            <Select
              value={formData.body_area}
              onValueChange={value => setFormData({ ...formData, body_area: value as BodyArea })}
            >
              <SelectTrigger id="body_area" name="body_area">
                <SelectValue placeholder="Body area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="front">Front</SelectItem>
                <SelectItem value="back">Back</SelectItem>
                <SelectItem value="side">Side</SelectItem>
                <SelectItem value="full_body">Full Body</SelectItem>
                <SelectItem value="arms">Arms</SelectItem>
                <SelectItem value="chest">Chest</SelectItem>
                <SelectItem value="legs">Legs</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-900 mb-2">
              Notes (optional)
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Notes (optional)"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || createMutation.isPending}>
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProgressPhotoComparison({ photo1, photo2, onClose, photo1Label, photo2Label }) {
  const [sliderPosition, setSliderPosition] = useState(50)

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Before & After Comparison</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div
        className="relative bg-slate-100 w-full flex items-center justify-center"
        style={{ aspectRatio: '3/4', maxHeight: '80vh' }}
      >
        {/* After photo (background) */}
        <img
          src={photo2.image_url}
          alt="After"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Before photo (foreground with clip) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
          }}
        >
          <img src={photo1.image_url} alt="Before" className="w-full h-full object-contain" />
        </div>

        {/* Divider line and handle */}
        <div
          style={{
            position: 'absolute',
            left: `${sliderPosition}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'white',
            cursor: 'col-resize',
            transform: 'translateX(-1px)',
            userSelect: 'none'
          }}
          onMouseDown={e => {
            e.preventDefault()
            const startX = e.clientX
            const container = e.currentTarget.parentElement
            const containerRect = container.getBoundingClientRect()

            const handleMouseMove = moveEvent => {
              const deltaX = moveEvent.clientX - startX
              const newPosition = Math.max(
                0,
                Math.min(100, sliderPosition + (deltaX / containerRect.width) * 100)
              )
              setSliderPosition(newPosition)
            }

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        >
          {/* Handle thumb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-slate-200">
            <div className="flex gap-1">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-medium text-white drop-shadow">
          <span className="bg-black/40 px-3 py-1 rounded">{photo1Label}</span>
          <span className="bg-black/40 px-3 py-1 rounded">{photo2Label}</span>
        </div>
      </div>
    </div>
  )
}
