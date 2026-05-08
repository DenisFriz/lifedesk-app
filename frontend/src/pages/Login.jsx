import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch, setToken } from '@/api/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/AuthContext'
import { Helmet } from 'react-helmet-async'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await apiFetch('POST', '/auth/login', { email, password })
      setToken(data.token)

      await login(data.token)

      navigate('/Home', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Login</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-2xl border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
            {/* top line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

            <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
                {/* Logo */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 blur-xl opacity-30 transition-opacity duration-300 group-hover:opacity-40" />

                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white shadow-lg ring-4 ring-white/50 flex items-center justify-center overflow-hidden">
                    <img
                      src="/assets/lifedesk-icon.png"
                      alt="lifedesk logo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Welcome to lifedesk
                  </h1>

                  <p className="text-slate-500 text-sm sm:text-base font-medium">
                    Sign in to continue
                  </p>
                </div>

                {/* Form */}
                <div className="w-full">
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {/* Error */}
                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    {/* Inputs */}
                    <div className="space-y-3 sm:space-y-4">
                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Email</label>

                        <div className="relative">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>

                          <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={isLoading}
                            className="pl-10 h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50/50 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-400"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Password</label>

                        <div className="relative">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>

                          <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            className="pl-10 h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50/50 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Button */}
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 sm:h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition-all duration-200"
                      >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                      </Button>

                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                        <button
                          type="button"
                          onClick={() => navigate('/ForgotPassword')}
                          className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/Register')}
                          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          Need an account?{' '}
                          <span className="font-medium text-slate-700">Sign up</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
