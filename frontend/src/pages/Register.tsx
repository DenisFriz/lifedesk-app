import { useState, useMemo, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/api/apiClient'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { Helmet } from 'react-helmet-async'
import { SEO } from '@/lib/seo'
import { Checkbox } from '@/components/ui/checkbox'

const InputClass = `
flex w-full border px-3 py-2 ring-offset-background file:border-0 
file:bg-transparent file:text-sm file:font-medium file:text-foreground 
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-10 sm:h-11 bg-slate-50/50 border-slate-200 
focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm sm:text-base
`

type RegisterResponse = {
  accessToken: string
}

export default function Register() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepted, setAccepted] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { login } = useAuth()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }

      const data = await apiFetch<RegisterResponse>('POST', '/auth/register', {
        email,
        password,
        acceptedTerms: accepted
      })

      await login(data.accessToken)
      navigate('/home', { replace: true })
    } catch (err) {
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
          setError(err.message || 'Registration failed')
        }

        if (data?.message) {
          setError(data.message)
        }
      } else {
        setError(err.message || 'Registration failed')
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

  const getPasswordRules = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password)
    }
  }

  const passwordRules = useMemo(() => {
    if (!password) return null
    return getPasswordRules(password)
  }, [password])

  const isFormValid =
    email.trim() !== '' && password.trim() !== '' && confirmPassword.trim() !== '' && accepted

  return (
    <>
      <Helmet>
        <title>{SEO.register.title}</title>
        <meta name="description" content={SEO.register.description} />
        <meta property="og:title" content={SEO.register.title} />
        <meta property="og:description" content={SEO.register.description} />
        <meta property="og:url" content={SEO.register.canonical} />
        <link rel="canonical" href={SEO.register.canonical} />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border-0">
            <div className="h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

            <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                Back to sign in
              </button>
              <div className="text-center space-y-1 my-4 ">
                <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
              </div>

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

              <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-4">
                {/* Error */}
                {error && (
                  <div className="text-center rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5 flex flex-col items-center">
                  <label
                    className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <div className="relative w-full">
                    <Mail className="lucide lucide-mail absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={InputClass}
                      disabled={isLoading}
                      required
                      id="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col items-center">
                  <label
                    className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative w-full">
                    <Lock className="lucide lucide-lock absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={InputClass + ' pr-10'}
                      disabled={isLoading}
                      required
                      id="password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && passwordRules && (
                    <div className="self-start mt-2 text-xs space-y-1 text-slate-500">
                      <p className={passwordRules.minLength ? 'text-green-600' : 'text-red-500'}>
                        • At least 8 characters
                      </p>
                      <p className={passwordRules.hasLetter ? 'text-green-600' : 'text-red-500'}>
                        • At least 1 letter
                      </p>
                      <p className={passwordRules.hasNumber ? 'text-green-600' : 'text-red-500'}>
                        • At least 1 number
                      </p>
                      <p className={passwordRules.hasSpecial ? 'text-green-600' : 'text-red-500'}>
                        • At least 1 special character
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex flex-col items-center">
                  <label
                    className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                    htmlFor="confirmPassword"
                  >
                    Confirm Password
                  </label>
                  <div className="relative w-full">
                    <Lock className="lucide lucide-lock absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={InputClass + ' pr-10'}
                      disabled={isLoading}
                      required
                      id="confirmPassword"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={accepted}
                    onCheckedChange={checked => setAccepted(!!checked)}
                    className="mt-0.5"
                  />

                  <span className="text-sm text-slate-700 leading-relaxed">
                    I have read and agree to the{' '}
                    <a
                      href="https://lifedesk.me/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://lifedesk.me/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      Privacy Policy
                    </a>{' '}
                    of lifedesk.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-sm 
                ring-offset-background focus-visible:outline-none focus-visible:ring-2 
                focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none 
                disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-3 py-2 w-full
                 h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium 
                 shadow-sm rounded-xl transition-all duration-200"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
