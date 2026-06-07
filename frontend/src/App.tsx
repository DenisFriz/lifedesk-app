import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import OfflineSyncManager from '@/components/offline/OfflineSyncManager'
import { HelmetProvider } from 'react-helmet-async'
import { bootstrapSync } from '@/sync/bootstrapSync'

import Layout from './Layout'
import { appRoutes, authRoutes } from './routes'
import Home from './pages/Home'
import { ReactNode, useEffect, useRef } from 'react'
import { UserLimitProvider } from './contexts/UserLimitContext'

function AuthSyncBridge() {
  const { isAuthenticated, isLoadingAuth } = useAuth()
  const queryClient = useQueryClient()
  const hasBootstrapped = useRef(false)

  useEffect(() => {
    if (isLoadingAuth) return
    if (!isAuthenticated) {
      hasBootstrapped.current = false
      return
    }
    if (hasBootstrapped.current) return
    hasBootstrapped.current = true

    bootstrapSync(queryClient).catch(err => {
      console.error('[AuthSyncBridge] bootstrapSync failed:', err)
    })
  }, [isAuthenticated, isLoadingAuth, queryClient])

  return null
}

const LoadingAuth = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
)

const RequireAuth = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth()

  if (isLoadingAuth) return <LoadingAuth />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}

const RequireGuest = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth()

  if (isLoadingAuth) return <LoadingAuth />
  if (isAuthenticated) return <Navigate to="/" replace />

  return children
}

const AppLayout = () => {
  const { authError } = useAuth()

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
    <UserLimitProvider>
      <Layout currentPageName="Home">
        <Outlet />
      </Layout>
    </UserLimitProvider>
  )
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true
            }}
          >
            <Routes>
              {/* PUBLIC ROUTES */}
              {authRoutes.map(({ path, element: Page }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <RequireGuest>
                      <Page />
                    </RequireGuest>
                  }
                />
              ))}

              {/* PROTECTED ROUTES */}
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  {/* HOME */}
                  <Route path="/" element={<Home />} />

                  {/* OTHER APP ROUTES */}
                  {appRoutes.map(({ path, element: Page }) => (
                    <Route key={path} path={path} element={<Page />} />
                  ))}
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>

          <Toaster />
          <OfflineSyncManager />
          <AuthSyncBridge />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

export default App
