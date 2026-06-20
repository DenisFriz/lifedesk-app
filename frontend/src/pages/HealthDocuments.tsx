import { useState, useRef } from 'react'
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'
import { deleteCloudinaryImage, moveCloudinaryImages } from '@/api/cloudinaryService'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, FileText, Archive, Download, Lock } from 'lucide-react'
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
import { useUserLimit } from '@/contexts/UserLimitContext'
import { useMedicalDocumentsQuery } from '@/hooks/medicaldocuments/useMedicalDocumentsQuery'
import { useMedicalDocumentMutations } from '@/hooks/medicaldocuments/useMedicalDocumentMutations'
import { CreateMedicalDocumentInput } from '@/repositories/medicaldocument.repository'

const typeLabels = {
  prescription: 'Prescription',
  lab_result: 'Lab Result',
  doctor_note: "Doctor's Note",
  insurance: 'Insurance',
  vaccination: 'Vaccination',
  medical_history: 'Medical History',
  health_image: 'Health Image',
  other: 'Other'
} as const

export default function HealthDocuments() {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)

  const { data: documents = [], isLoading } = useMedicalDocumentsQuery()

  const { canCreate, data: userLimits } = useUserLimit()

  const isOverLimit = !canCreate('medicalDocuments')

  const { updateMutation, deleteMutation } = useMedicalDocumentMutations()

  const handleDeleteMedicalDocument = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    } finally {
      toast.success('Document deleted')
    }
  }

  const handleArchiveMedicalDocument = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { is_archived: true } })
    } catch (e) {
      console.error(e)
    } finally {
      toast.success('Document archived')
    }
  }

  const handleRecstoreMedicalDocument = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { is_archived: false } })
    } catch (e) {
      console.error(e)
    } finally {
      toast.success('Document restored')
    }
  }

  const filteredDocuments = documents.filter(d => d.is_archived === showArchived)

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <>
      <Helmet>
        <title>Health Documents | LifeDesk</title>
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                <FileText className="w-9 h-9" />
                Medical Documents
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Organize your health records and documents
              </p>
            </div>
            {isOverLimit ? (
              <Link to="/upgrade">
                <Button className="bg-amber-500 hover:bg-amber-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Limit reached ({userLimits?.usage?.medicalDocuments}/
                  {userLimits?.limits?.medicalDocuments})
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>

          {/* Tabs */}
          {documents.length > 0 && (
            <div className="flex gap-4 mb-6 border-b border-slate-200">
              <button
                onClick={() => setShowArchived(false)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  !showArchived
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Documents
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  showArchived
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Archived ({documents.filter(d => d.is_archived).length})
              </button>
            </div>
          )}

          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                {showArchived ? 'No archived documents' : 'No documents yet'}
              </p>
              {!showArchived && !isOverLimit && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Your First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Preview Thumbnail */}
                    <button
                      onClick={() => setPreviewDocument(doc)}
                      className="flex-shrink-0 w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 hover:border-indigo-400 overflow-hidden group cursor-pointer relative"
                    >
                      <img
                        src={doc.file_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={e => {
                          const img = e.currentTarget
                          const fallback = img.nextElementSibling as HTMLElement | null

                          img.style.display = 'none'
                          if (fallback) {
                            fallback.style.display = 'flex'
                          }
                        }}
                      />
                      <div className="hidden w-full h-full bg-slate-100 items-center justify-center group-hover:bg-indigo-50">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                            View
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-900 truncate">{doc.title}</h3>
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium flex-shrink-0">
                          {typeLabels[doc.type]}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {format(new Date(doc.date || doc.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="text-blue-600 hover:bg-blue-50"
                        title="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {showArchived ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRecstoreMedicalDocument(doc.id)}
                          className="text-blue-600 hover:bg-blue-50"
                          title="Restore document"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchiveMedicalDocument(doc.id)}
                          className="text-amber-600 hover:bg-amber-50"
                          title="Archive document"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMedicalDocument(doc.id)}
                        className="text-red-600 hover:bg-red-50"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DocumentPreviewDialog
            document={previewDocument}
            onClose={() => setPreviewDocument(null)}
          />

          <MedicalDocumentUploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
        </div>
      </div>
    </>
  )
}

function DocumentPreviewDialog({ document, onClose }) {
  if (!document) return null

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_url)

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-slate-50 rounded-lg p-4">
          {isImage ? (
            <img
              src={document.file_url}
              alt={document.title}
              className="max-w-full h-auto mx-auto"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <FileText className="w-16 h-16 text-slate-400" />
              <p className="text-slate-600 text-center">
                Preview not available for this file type
                <br />
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Download to view
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => window.open(document.file_url, '_blank')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type MedicalDocumentType =
  | 'prescription'
  | 'lab_result'
  | 'doctor_note'
  | 'insurance'
  | 'vaccination'
  | 'medical_history'
  | 'health_image'
  | 'other'

type FormData = {
  title: string
  description: string
  date: string
  type: MedicalDocumentType
}

function MedicalDocumentUploadDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'other'
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const fileInputRef = useRef(null)

  const { createMutation } = useMedicalDocumentMutations()
  const { upload, isLoading: uploading } = useCloudinaryUpload()
  const uploadedPublicIdRef = useRef<string | null>(null)

  const handleClose = async () => {
    if (uploadedPublicIdRef.current) {
      try {
        await deleteCloudinaryImage(uploadedPublicIdRef.current)
      } catch {}
      uploadedPublicIdRef.current = null
    }
    onOpenChange(false)
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'other'
    })
    setSelectedFile(null)
    setValidationError(null)
  }

  const handleCreateMedicalDocument = async (data: CreateMedicalDocumentInput) => {
    try {
      await createMutation.mutateAsync(data)
    } catch (e) {
      console.error(e)
    } finally {
      uploadedPublicIdRef.current = null
      onOpenChange(false)
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'other'
      })
      setSelectedFile(null)
      setValidationError(null)
      toast.success('Document uploaded successfully')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationError(null)

    const maxFileSize = 10 * 1024 * 1024 // 10 Mb
    if (file.size > maxFileSize) {
      setValidationError('File size exceeds 10MB limit')
      return
    }

    // Delete previous upload if the user re-selects
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
      setValidationError('Failed to upload file. Please try again.')
      console.error('File upload error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile || !formData.title.trim()) {
      toast.error('Please provide a title and select a file')
      return
    }

    let fileUrl = selectedFile.url
    let publicId = uploadedPublicIdRef.current ?? undefined

    // Move from temp/ to uploads/ before persisting
    if (uploadedPublicIdRef.current?.startsWith('temp/')) {
      try {
        const moved = await moveCloudinaryImages([uploadedPublicIdRef.current])
        if (moved.length > 0) {
          fileUrl = moved[0].new_url
          publicId = moved[0].new_public_id
          uploadedPublicIdRef.current = null
        }
      } catch (err) {
        console.error('Failed to move image to uploads:', err)
      }
    }

    handleCreateMedicalDocument({
      ...formData,
      file_url: fileUrl,
      public_id: publicId
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Medical Document</DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">Data Privacy Notice</p>
          <p>
            Medical documents contain sensitive personal information. You remain responsible for
            ensuring compliance with applicable privacy laws. While we employ standard security
            measures, we cannot guarantee 100% protection. Data may be stored on servers located in
            the United States and could be subject to applicable regulations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Document title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Select
            value={formData.type}
            onValueChange={value =>
              setFormData({ ...formData, type: value as MedicalDocumentType })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prescription">Prescription</SelectItem>
              <SelectItem value="lab_result">Lab Result</SelectItem>
              <SelectItem value="doctor_note">Doctor's Note</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="vaccination">Vaccination</SelectItem>
              <SelectItem value="medical_history">Medical History</SelectItem>
              <SelectItem value="health_image">Health Image</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
          />

          <Textarea
            placeholder="Notes (optional)"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            maxLength={1000}
          />

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">File</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-1">
                  <FileText className="w-6 h-6 text-indigo-600 mx-auto" />
                  <p className="text-xs text-slate-600">{selectedFile.file.name}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-900">Click to upload</p>
                  <p className="text-xs text-slate-500">PDF, JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>
            {validationError && <p className="text-xs text-red-600 mt-2">{validationError}</p>}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || createMutation.isPending}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
