import { useState } from 'react'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface WithdrawHealthConsentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function WithdrawHealthConsentDialog({
  isOpen,
  onClose,
  onSuccess
}: WithdrawHealthConsentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleWithdraw = async () => {
    setIsLoading(true)
    setError('')

    try {
      await backend.user.withdrawHealthConsent()
      onSuccess()
    } catch (err) {
      console.error('Withdrawal error:', err)
      setError('Failed to withdraw consent. Please try again or contact support.')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Withdraw Health Data Consent?</h3>
          </div>
          <button
            onClick={handleClose}
            className="ml-auto text-slate-400 hover:text-slate-600"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 space-y-3 text-sm text-slate-900">
          <p>
            This will disable all LifeDesk Health features and permanently delete your stored Health
            data, including Health entries and medical documents.
          </p>
          <p>
            The LifeDesk AI Assistant will no longer be able to access or use data from your Health
            area.
          </p>
          <p>
            Your LifeDesk account, general AI conversation and all non-health data will remain
            active.
          </p>
          <p>This action cannot be undone.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleWithdraw}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Withdrawing...
              </span>
            ) : (
              'Withdraw Consent and Delete Health Data'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
