import { ReactNode } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import HealthConsentPopup from './HealthConsentPopup'

const LoadingAuth = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
)

interface HealthConsentGateProps {
  children: ReactNode
}

export default function HealthConsentGate({ children }: HealthConsentGateProps) {
  const { user, isLoadingAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (isLoadingAuth) return <LoadingAuth />

  if (user?.healthConsentGiven) return <>{children}</>

  const handleNotNow = () => {
    if (location.key === 'default') {
      navigate('/home', { replace: true })
    } else {
      navigate(-1)
    }
  }

  return <HealthConsentPopup onNotNow={handleNotNow} />
}
