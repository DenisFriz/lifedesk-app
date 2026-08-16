import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { useAuth } from '@/lib/AuthContext'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Status = 'loading' | 'success' | 'error'

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoadingAuth } = useAuth()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('Confirming your new email address...')

  useEffect(() => {
    if (isLoadingAuth) return

    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing confirmation link.')
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        await backend.user.confirmEmailChange(token)
        if (cancelled) return
        if (isAuthenticated) {
          await queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        }
        setStatus('success')
        setMessage('Your email address has been updated successfully.')
      } catch (err: any) {
        if (cancelled) return
        setStatus('error')
        setMessage(err?.message || 'Invalid or expired confirmation link.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, isLoadingAuth, isAuthenticated, queryClient])

  useEffect(() => {
    if (status !== 'success') return

    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/profile' : '/login', { replace: true })
    }, 2000)

    return () => clearTimeout(timer)
  }, [status, isAuthenticated, navigate])

  return (
    <>
      <Helmet>
        <title>Confirm Email Change | LifeDesk</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="rounded-lg relative max-w-md w-full overflow-hidden border-0 shadow-lg bg-white">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-900" />

          <div className="p-6 pt-12 pb-10 px-12 space-y-6 text-center">
            {status === 'loading' && (
              <Loader2 className="w-12 h-12 mx-auto text-slate-600 animate-spin" />
            )}
            {status === 'success' && <CheckCircle className="w-12 h-12 mx-auto text-green-600" />}
            {status === 'error' && <XCircle className="w-12 h-12 mx-auto text-red-600" />}

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {status === 'loading' && 'Confirming email'}
                {status === 'success' && 'Email updated'}
                {status === 'error' && 'Confirmation failed'}
              </h2>
              <p className="text-gray-600">{message}</p>
            </div>

            {status === 'success' && (
              <p className="text-sm text-slate-500">
                Redirecting you {isAuthenticated ? 'to your profile' : 'to login'}...
              </p>
            )}

            {status === 'error' && (
              <div className="flex flex-col gap-2">
                {isAuthenticated ? (
                  <Button asChild>
                    <Link to="/profile">Go to Profile</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/login">Go to Login</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
