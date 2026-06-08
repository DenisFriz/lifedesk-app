import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { setToken } from '@/api/apiClient'
import type { AuthContextValue, AuthError } from '@/types'

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [authError, setAuthError] = useState<AuthError | null>(null)

  const {
    data: user = null,
    isLoading: isLoadingUser,
    error: queryError
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => backend.user.me(),
    enabled: isAuthenticated,
    retry: false
  })

  const isLoadingAuth = isCheckingAuth || (isAuthenticated && isLoadingUser)

  // Handle deleted accounts
  useEffect(() => {
    if (user?.is_deleted) {
      console.warn('User account has been deleted')
      setIsAuthenticated(false)
      setAuthError({
        type: 'account_deleted',
        message: 'Your account has been deleted'
      })
      queryClient.setQueryData(['currentUser'], null)
    }
  }, [user, queryClient])

  // Handle query errors (401, 403, etc.)
  useEffect(() => {
    if (queryError) {
      const status = (queryError as any)?.status
      if (status === 401 || status === 403) {
        setIsAuthenticated(false)
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        })
      }
    }
  }, [queryError])

  const checkAppState = useCallback(async () => {
    try {
      setAuthError(null)

      if (await backend.auth.isAuthenticated()) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth state check failed:', error)
      setAuthError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsCheckingAuth(false)
    }
  }, [])

  useEffect(() => {
    checkAppState()
  }, [checkAppState])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    queryClient.removeQueries({ queryKey: ['currentUser'] })
    localStorage.clear()
    backend.auth.logout()
  }, [queryClient])

  const login = useCallback(
    async (token: string) => {
      setToken(token)
      await checkAppState()
    },
    [checkAppState]
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      logout,
      login,
      checkAppState
    }),
    [user, isAuthenticated, isLoadingAuth, authError, logout, login, checkAppState]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
