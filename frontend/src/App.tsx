import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import OfflineSyncManager from '@/components/offline/OfflineSyncManager'
import { HelmetProvider } from 'react-helmet-async'

import Layout from './Layout'
import { appRoutes, authRoutes } from './routes'
import Home from './pages/Home'
import { ReactNode } from 'react'
import { UserLimitProvider } from './contexts/UserLimitContext'

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
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
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
          <VisualEditAgent />
          <OfflineSyncManager />
        </QueryClientProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}

export default App
