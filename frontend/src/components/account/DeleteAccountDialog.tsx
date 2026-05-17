import { useEffect, useState } from 'react'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'

type DeleteAccountResponse = {
  data: any
  success: boolean
  error?: string
}

type Step = 'confirm' | 'password' | 'loading' | 'error' | 'local' | 'google'

interface DeleteAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userEmail: string
}

export default function DeleteAccountDialog({
  isOpen,
  onClose,
  onSuccess,
  userEmail
}: DeleteAccountDialogProps) {
  const [step, setStep] = useState<Step>('confirm')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [provider, setProvider] = useState<'local' | 'google' | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const load = async () => {
      try {
        const res = await backend.auth.deleteRequest()

        setProvider(res.provider)

        if (res.requiresReauth && res.provider === 'google') {
          setStep('google')
        }

        if (res.requiresReauth && res.provider === 'local') {
          setStep('password')
        }
      } catch (err) {
        console.error(err)
      }
    }

    load()
  }, [isOpen])

  const handleClose = (): void => {
    setStep('confirm')
    setPassword('')
    setError('')
    onClose()
  }

  const handleConfirmDelete = (): void => {
    if (provider === 'google') {
      setStep('google')
      return
    }

    if (provider === 'local') {
      setStep('password')
      return
    }

    setStep('error')
  }

  const handleDeleteAccount = async (): Promise<void> => {
    if (!password.trim()) {
      setError('Please enter your password to confirm.')
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await backend.auth.reauthPassword(password)

      if (!response.success) {
        setError('Reauthentication failed')
        return
      }

      const res = await backend.functions.invoke<DeleteAccountResponse>('deleteAccount', {
        reauthToken: response.reauthToken
      })

      if (res.success) {
        setStep('loading')
        setTimeout(() => {
          backend.auth.logout()
        }, 1500)
      } else {
        setError(res.data?.error || 'Failed to delete account. Please try again.')
        setIsDeleting(false)
      }
    } catch (err) {
      const status = err?.response?.status ?? err?.status
      if (status === 401) {
        // Expected: wrong password — show clean message, no console error
        setError('Incorrect password. Please try again.')
      } else {
        // Unexpected backend failure — log it
        console.error('Account deletion error:', err)
        setError('An unexpected error occurred. Please try again or contact support.')
      }
      setIsDeleting(false)
    }
  }

  const googleReauth = useGoogleLogin({
    scope: 'openid email profile',
    prompt: 'select_account',

    onSuccess: async tokenResponse => {
      try {
        const accessToken = tokenResponse.access_token

        if (!accessToken) {
          setError('Google access token missing')
          return
        }

        const response = await backend.auth.googleReauth(accessToken)

        if (!response.success) {
          setError('Reauthentication failed')
          return
        }

        const res = await backend.functions.invoke<DeleteAccountResponse>('deleteAccount', {
          reauthToken: response.reauthToken
        })

        if (res.success) {
          setStep('loading')
          setTimeout(() => {
            backend.auth.logout()
          }, 1500)
        } else {
          setError(res.data?.error || 'Failed to delete account. Please try again.')
          setIsDeleting(false)
        }
      } catch (e) {
        console.error(e)
        setError('Google reauthentication failed')
      }
    },

    onError: () => {
      setError('Google reauthentication failed')
    }
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Confirm Step */}
        {step === 'confirm' && (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Account</h3>
                <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone</p>
              </div>
              <button onClick={handleClose} className="ml-auto text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 space-y-3 text-sm text-red-900">
              <p className="font-semibold">Deleting your account will:</p>
              <ul className="space-y-2 list-none">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-500">•</span>
                  <span>Permanently remove your data and account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-500">•</span>
                  <span>Cancel any active paid subscription immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-500">•</span>
                  <span>Cannot be reversed</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
              >
                Delete Account
              </Button>
            </div>
          </>
        )}

        {/* Password Confirmation Step */}
        {step === 'password' && (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-sm text-slate-500 mt-0.5">Enter your password to proceed</p>
              </div>
              <button
                onClick={handleClose}
                className="ml-auto text-slate-400 hover:text-slate-600"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isDeleting}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('confirm')
                  setPassword('')
                  setError('')
                }}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !password.trim()}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </span>
                ) : (
                  'Confirm & Delete'
                )}
              </Button>
            </div>
          </>
        )}

        {/* Google Confirmation Step */}
        {step === 'google' && (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirm with Google</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Re-authentication required for Google accounts
                </p>
              </div>

              <button onClick={handleClose} className="ml-auto text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-900">
              To delete your account, please sign in again with Google.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => googleReauth()}
              >
                Continue with Google
              </Button>
            </div>
          </>
        )}

        {/* Loading/Success Step */}
        {step === 'loading' && (
          <>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Account Deleted</h3>
              <p className="text-sm text-slate-600 mb-4">
                Your account and all associated data have been permanently removed.
              </p>
              <p className="text-xs text-slate-500">Redirecting...</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
