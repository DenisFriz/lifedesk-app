import { useState } from 'react'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, X } from 'lucide-react'

interface ChangeEmailDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentEmail: string
}

export default function ChangeEmailDialog({
  isOpen,
  onClose,
  onSuccess,
  currentEmail
}: ChangeEmailDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const trimmed = newEmail.trim().toLowerCase()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  const isDifferent = trimmed !== currentEmail.toLowerCase()
  const isFormValid = isValidEmail && isDifferent

  const handleSubmit = async () => {
    if (!isFormValid) return

    setIsLoading(true)
    setError('')

    try {
      await backend.user.changeEmail(trimmed)
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Change email error:', err)
      setError(err.message || 'Failed to request email change. Please try again.')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setNewEmail('')
    setIsLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Change Email</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              We&apos;ll send a confirmation link to your new address.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="ml-auto text-slate-400 hover:text-slate-600"
            disabled={isLoading}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-slate-700">Current email</Label>
            <Input value={currentEmail} disabled className="mt-1 bg-slate-50" />
          </div>

          <div>
            <Label htmlFor="new-email" className="text-slate-700">
              New email
            </Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1"
              disabled={isLoading}
              autoFocus
            />
            {trimmed && !isValidEmail && (
              <p className="text-xs text-red-600 mt-1">Enter a valid email address</p>
            )}
            {trimmed && isValidEmail && !isDifferent && (
              <p className="text-xs text-red-600 mt-1">New email must be different</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="flex-1" onClick={handleSubmit} disabled={!isFormValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send confirmation'
            )}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
