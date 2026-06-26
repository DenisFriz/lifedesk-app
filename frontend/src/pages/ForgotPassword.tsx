import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SEO } from '@/lib/seo'
import { apiFetch } from '@/api/apiClient'

function MailSendComponent({ email }: { email: string }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

          <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
            <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
              {/* icon */}
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 sm:h-8 sm:w-8 text-slate-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>

              {/* text */}
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Check your email</h2>

                <p className="text-slate-600 text-sm sm:text-base">
                  We've sent password reset instructions to
                  <br />
                  <span className="font-medium text-slate-900">{email}</span>
                </p>
              </div>

              {/* info */}
              <div className="w-full rounded-xl border border-green-200 bg-green-50/70 p-4 text-sm text-green-700">
                Please check your email for the password reset link. It may take a few minutes to
                arrive.
              </div>

              {/* back */}
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Email is required')
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      await apiFetch('POST', '/auth/forgot-password', {
        email: trimmedEmail
      })

      setIsSent(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <>
      <Helmet>
        <title>{SEO.forgotPassword.title}</title>
        <meta name="description" content={SEO.forgotPassword.description} />
        <link rel="canonical" href="https://lifedesk.app/ForgotPassword" />
      </Helmet>
      {isSent ? (
        <MailSendComponent email={email} />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          <div className="w-full max-w-md">
            <div className="relative overflow-hidden rounded-2xl border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

              <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
                <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
                  <div className="w-full">
                    <div className="space-y-4 sm:space-y-6">
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l-7-7 7-7" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" />
                        </svg>
                        Back to sign in
                      </button>

                      <div className="text-center space-y-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Reset your password
                        </h2>

                        <p className="text-slate-600 text-sm sm:text-base">
                          Enter your email and we&apos;ll send you a link to reset your password
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        {error && (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>

                          <div className="relative">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <rect x="2" y="4" width="20" height="16" rx="2" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>

                            <input
                              id="email"
                              type="email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              required
                              className="w-full pl-10 h-10 sm:h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full h-10 sm:h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium shadow-sm transition-all duration-200"
                        >
                          Send reset link
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center text-xs text-slate-400 sm:hidden">
              <p>&nbsp;</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
