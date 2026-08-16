import { useState, useMemo } from 'react'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, X, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface ChangePasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  hasPassword?: boolean
}

export default function ChangePasswordDialog({
  isOpen,
  onClose,
  onSuccess,
  hasPassword = true
}: ChangePasswordDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const getPasswordRules = (password: string) => ({
    minLength: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password)
  })

  const passwordRules = useMemo(
    () => (newPassword ? getPasswordRules(newPassword) : null),
    [newPassword]
  )

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const allRulesMet = passwordRules && Object.values(passwordRules).every(v => v)
  const isFormValid = hasPassword
    ? currentPassword && allRulesMet && passwordsMatch && newPassword !== currentPassword
    : allRulesMet && passwordsMatch

  const handleChangePassword = async () => {
    if (!isFormValid) return

    setIsLoading(true)
    setError('')

    try {
      await backend.user.changePassword(hasPassword ? currentPassword : undefined, newPassword)
      onSuccess()
    } catch (err: any) {
      console.error('Change password error:', err)
      if (err.status === 401) {
        setError('Current password is incorrect')
      } else {
        setError(err.message || 'Failed to change password. Please try again or contact support.')
      }
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {hasPassword ? 'Change Password' : 'Set Password'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="ml-auto text-slate-400 hover:text-slate-600"
            disabled={isLoading}
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
          {/* Current Password - only show if user already has a password */}
          {hasPassword && (
            <div>
              <label className="text-sm font-medium text-slate-900">Current Password</label>
              <div className="mt-1 relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => {
                    setCurrentPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="text-sm font-medium text-slate-900">New Password</label>
            <div className="mt-1 relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter new password"
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Rules Checklist */}
            {newPassword && (
              <div className="mt-3 space-y-2 text-xs">
                <div
                  className={`flex items-center gap-2 ${passwordRules!.minLength ? 'text-green-600' : 'text-slate-400'}`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  At least 8 characters
                </div>
                <div
                  className={`flex items-center gap-2 ${passwordRules!.hasLower ? 'text-green-600' : 'text-slate-400'}`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Lowercase letter
                </div>
                <div
                  className={`flex items-center gap-2 ${passwordRules!.hasUpper ? 'text-green-600' : 'text-slate-400'}`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Uppercase letter
                </div>
                <div
                  className={`flex items-center gap-2 ${passwordRules!.hasNumber ? 'text-green-600' : 'text-slate-400'}`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Number
                </div>
                <div
                  className={`flex items-center gap-2 ${passwordRules!.hasSpecial ? 'text-green-600' : 'text-slate-400'}`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Special character
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-slate-900">Confirm New Password</label>
            <div className="mt-1 relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleChangePassword}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />{' '}
                {hasPassword ? 'Changing...' : 'Setting...'}
              </span>
            ) : hasPassword ? (
              'Change Password'
            ) : (
              'Set Password'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
