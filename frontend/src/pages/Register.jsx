import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setToken } from '@/api/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { Helmet } from 'react-helmet-async'

const InputClass = `
flex w-full border px-3 py-2 ring-offset-background file:border-0 
file:bg-transparent file:text-sm file:font-medium file:text-foreground 
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-10 sm:h-11 bg-slate-50/50 border-slate-200 
focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm sm:text-base

`

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async e => {
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

      const data = await apiFetch('POST', '/auth/register', {
        email,
        password
      })

      await login(data.token)
      setToken(data.token)
      navigate('/Home', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Registration</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border-0">
            <div className="h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

            <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
              <button
                type="button"
                onClick={() => navigate('/Login')}
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
              <div className="text-center space-y-1 mt-4">
                <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5 flex flex-col items-center">
                  <label
                    className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                    for="email"
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
                    for="password"
                  >
                    Password
                  </label>
                  <div className="relative w-full">
                    <Lock className="lucide lucide-lock absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={InputClass}
                      disabled={isLoading}
                      required
                      id="password"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col items-center">
                  <label
                    className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
                    for="confirmPassword"
                  >
                    Confirm Password
                  </label>
                  <div className="relative w-full">
                    <Lock className="lucide lucide-lock absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={InputClass}
                      disabled={isLoading}
                      required
                      id="confirmPassword"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
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
