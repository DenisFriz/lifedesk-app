import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SEO } from '@/lib/seo'
import { apiFetch } from '@/api/apiClient'

const InputClass = `flex w-full rounded-md border px-3 py-2 text-base ring-offset-background 
file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground 
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
disabled:opacity-50 md:text-sm pl-10 h-11 bg-gray-50/50 border-gray-200 focus:border-gray-400 focus:ring-gray-400`

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')

    if (!password || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      const token = new URLSearchParams(window.location.search).get('token')

      if (!token) {
        setError('Invalid or missing reset token')
        return
      }

      await apiFetch('POST', '/auth/reset-password', {
        token,
        newPassword: password
      })

      navigate('/login')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    }
  }

  return (
    <>
      <Helmet>
        <title>{SEO.resetPassword.title}</title>
        <meta name="description" content={SEO.resetPassword.description} />
        <link rel="canonical" href="https://lifedesk.app/ResetPassword" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="rounded-lg text-card-foreground relative max-w-md w-full overflow-hidden border-0 shadow-lg bg-white">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-900" />

          <div className="p-6 pt-12 pb-10 px-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
              <p className="text-gray-600">Enter your new password for lifedesk</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="space-y-5">
                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    New Password
                  </label>

                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={InputClass}
                    />
                  </div>

                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>

                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={InputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md 
                text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 
                focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
                [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-3 py-2 w-full h-11 bg-gray-900
                 hover:bg-gray-800 text-white font-medium shadow-sm"
                >
                  Reset password
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full text-sm text-gray-600 hover:text-gray-700"
                >
                  Back to login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
