import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import TermsAcceptanceGate from '@/components/auth/TermsAcceptanceGate'
import OfflineSyncManager from '@/components/offline/OfflineSyncManager'
import { backend } from '@/api/backend'
import { type ReactNode } from 'react'
import Layout from './Layout'
import { appRoutes, authRoutes } from './routes'
import { Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import Home from './pages/Home'
const x = 1
interface LayoutWrapperProps {
  children: ReactNode
  currentPageName: string
}

const LoadingAuth = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
)

const LayoutWrapper = ({ children, currentPageName }: LayoutWrapperProps) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth()

  if (isLoadingAuth) {
    return <LoadingAuth />
  }

  if (isAuthenticated) {
    return <Navigate to="/Home" replace />
  }

  return children
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth()

  if (isLoadingAuth) {
    return <LoadingAuth />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const AuthenticatedApp = () => {
  const { isAuthenticated, authError } = useAuth()

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => backend.auth.me(),
    enabled: isAuthenticated
  })

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError reason="user_not_registered" />
    }
    if (authError.type === 'account_deleted') {
      return <UserNotRegisteredError reason="account_deleted" />
    }
    if (authError.type === 'auth_required') {
      return <Navigate to="/login" replace />
    }
  }

  return (
    <TermsAcceptanceGate user={currentUser}>
      <Routes>
        <Route
          path="/"
          element={
            <LayoutWrapper currentPageName="Home">
              <Home />
            </LayoutWrapper>
          }
        />
        {appRoutes.map(({ path, element: Page, name }) => (
          <Route
            key={path}
            path={path}
            element={
              <LayoutWrapper currentPageName={name}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
      </Routes>
    </TermsAcceptanceGate>
  )
}

function App() {
  return (
    <HelmetProvider>
      {' '}
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              {/* PUBLIC ROUTES */}
              {authRoutes.map(({ path, element: Page }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <PublicRoute>
                      <Page />
                    </PublicRoute>
                  }
                />
              ))}

              {/* PROTECTED ROUTES */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AuthenticatedApp />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>

          <Toaster />
          <VisualEditAgent />
          <OfflineSyncManager />
        </QueryClientProvider>
      </AuthProvider>{' '}
    </HelmetProvider>
  )
}

export default App
