import React, { createContext, useState, useContext, useEffect } from 'react'
import { backend } from '@/api/backend'
import type { User, AuthContextValue, AuthError } from '@/types'

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [authError, setAuthError] = useState<AuthError | null>(null)

  useEffect(() => {
    checkAppState()
  }, [])

  const checkAppState = async () => {
    try {
      setAuthError(null)

      if (await backend.auth.isAuthenticated()) {
        await checkUserAuth()
      } else {
        setIsLoadingAuth(false)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth state check failed:', error)
      setAuthError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      setIsLoadingAuth(false)
    }
  }

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true)
      const currentUser = await backend.auth.me()

      if (currentUser?.is_deleted) {
        console.warn('User account has been deleted')
        setIsLoadingAuth(false)
        setIsAuthenticated(false)
        setAuthError({
          type: 'account_deleted',
          message: 'Your account has been deleted'
        })
        return
      }

      setUser(currentUser)
      setIsAuthenticated(true)
      setIsLoadingAuth(false)
    } catch (error) {
      console.error('User auth check failed:', error)
      setIsLoadingAuth(false)
      setIsAuthenticated(false)

      const status = (error as any)?.status
      if (status === 401 || status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        })
      }
    }
  }

  const logout = (shouldRedirect = true) => {
    setUser(null)
    setIsAuthenticated(false)

    if (shouldRedirect) {
      backend.auth.logout()
    } else {
      backend.auth.logout()
    }
  }

  const login = async (token: string) => {
    await backend.auth.redirectToLogin(token) // or localStorage
    await checkAppState() // re-sync auth state
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        logout,
        login,
        checkAppState
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
