import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setToken } from '@/api/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/AuthContext'
import { Helmet } from 'react-helmet-async'
import { SEO } from '@/lib/seo'
import { Eye, EyeOff } from 'lucide-react'

type LoginResponse = {
  accessToken: string
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await apiFetch<LoginResponse>('POST', '/auth/login', {
        email,
        password
      })
      setToken(data.accessToken)

      await login(data.accessToken)

      navigate('/home', { replace: true })
    } catch (err: any) {
      const data = err.data

      if (data) {
        const messages: string[] = []

        Object.values(data).forEach((field: any) => {
          if (field?._errors) {
            messages.push(...field._errors)
          }
        })

        if (messages.length > 0) {
          setError(messages.join(', '))
        } else {
          setError(err.message || 'Login failed')
        }

        if (data?.message) {
          setError(data.message)
        }
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRedirect = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri =
      import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? `${window.location.origin}/auth/callback`
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  return (
    <>
      <Helmet>
        <title>{SEO.login.title}</title>
        <meta name="description" content={SEO.login.description} />
        <meta property="og:title" content={SEO.login.title} />
        <meta property="og:description" content={SEO.login.description} />
        <meta property="og:url" content={SEO.login.canonical} />
        <link rel="canonical" href={SEO.login.canonical} />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-[40px] border-0 bg-white/95 backdrop-blur-sm shadow-[0_25px_80px_-12px_rgba(0,0,0,0.15)]">
            <div className="p-8 rounded-[40px] sm:p-10 md:pt-12 md:pb-10 md:px-10">
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
                {/* Logo */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 blur-xl opacity-30 transition-opacity duration-300 group-hover:opacity-40" />

                  <div className="relative h-20 w-[120px] sm:h-24 sm:w-[200px] rounded-full bg-white ring-4 ring-white/50 flex items-center justify-center overflow-hidden">
                    <img
                      src="/assets/lifedesk-icon.png"
                      alt="lifedesk logo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-slate-500 text-sm sm:text-base font-medium">
                    Sign in to continue
                  </p>
                </div>

                {/* Form */}
                <div className="w-full">
                  <div className="mb-6 space-y-4 w-full">
                    <button
                      type="button"
                      onClick={handleGoogleRedirect}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 h-11 sm:h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-medium shadow-sm transition-all duration-200 px-4"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-[11px] sm:text-xs uppercase">
                        <span className="bg-white px-3 text-slate-400">Or continue with email</span>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {/* Error */}
                    {error && (
                      <div className="text-center rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            className="pl-10 pr-10 h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50/50 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-400"
                          />

                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
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
                          onClick={() => navigate('/forgot-password')}
                          className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/register')}
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
