import { createContext, useContext, useMemo, ReactNode, useCallback } from 'react'

import { backend, UsageKey, UserUsageResponse } from '@/api/backend'
import { useQuery, UseQueryResult } from '@tanstack/react-query'

type UserLimitContextType = {
  data: UserUsageResponse | null
  isLoading: boolean
  refetch: UseQueryResult<UserUsageResponse, Error>['refetch']

  // helpers
  canCreate: (key: UsageKey) => boolean
  remaining: (key: UsageKey) => number | null
}

const UserLimitContext = createContext<UserLimitContextType | null>(null)

type Props = {
  children: ReactNode
}

export function UserLimitProvider({ children }: Props) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['usage'],
    queryFn: backend.user.usage
  })

  const canCreate = useCallback(
    (key: UsageKey) => {
      if (!data) return false

      const limit = data.limits[key]
      const used = data.usage[key]

      if (limit === null) {
        if (typeof used === 'boolean') return used
        return true
      }
      return (used as number) < (limit as number)
    },
    [data]
  )

  const remaining = useCallback(
    (key: UsageKey) => {
      if (!data) return null
      return data.remaining[key]
    },
    [data]
  )

  const value = useMemo<UserLimitContextType>(() => {
    return {
      data,
      isLoading,
      refetch,
      canCreate,
      remaining,
      error
    }
  }, [data, isLoading, error, refetch, canCreate, remaining])

  return <UserLimitContext.Provider value={value}>{children}</UserLimitContext.Provider>
}
export function useUserLimit() {
  const context = useContext(UserLimitContext)

  if (!context) {
    throw new Error('useUserLimit must be used inside UserLimitProvider')
  }

  return context
}
