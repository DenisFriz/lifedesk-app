import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setToken } from '@/api/apiClient'
import { useAuth } from '@/lib/AuthContext'

type LoginResponse = {
  accessToken: string
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      navigate('/login', { replace: true })
      return
    }

    const redirectUri =
      import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? `${window.location.origin}/auth/callback`

    apiFetch<LoginResponse>('POST', '/auth/google/callback', { code, redirectUri })
      .then(async data => {
        setToken(data.accessToken)
        await login(data.accessToken)
        navigate('/home', { replace: true })
      })
      .catch(() => {
        navigate('/login', { replace: true })
      })
  }, [login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  )
}
