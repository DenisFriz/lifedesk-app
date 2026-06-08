import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { backend } from '@/api/backend'
import type { User } from '@/types'

interface UserPlan {
  plan_name: string
  features: Record<string, boolean | number | null | undefined>
}

interface Subscription {
  user_email: string
  plan_name: string
  cancel_at_period_end?: boolean
  current_period_end?: string
}

interface SubscriptionReturn {
  isLoading: boolean
  subscription: Subscription | null | undefined
  planName: string
  planData: UserPlan | undefined
  features: Record<string, boolean | number | null | undefined>
  can: (featureKey: string) => boolean
  limit: (limitKey: string) => number
}

export function useSubscription(): SubscriptionReturn {
  /*   const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => backend.user.me() as Promise<User | undefined>
  }) */

  const { data: subscriptions, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        const subs = (await backend.entities.Subscription.list()) as Subscription[]

        const userSub = subs.find(s => s.user_email === '')

        return userSub || null
      } catch (err) {
        console.error('[useSubscription] Error fetching subscription:', err)
        return null
      }
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  })

  const { data: plans, isLoading: planLoading } = useQuery({
    queryKey: ['userPlans'],
    queryFn: () => backend.entities.UserPlan.list() as Promise<UserPlan[]>,
    staleTime: 30 * 60 * 1000 // 30 minutes
  })

  const subscription = subscriptions
  const planName = 'free'
  const planData = useMemo(() => plans?.find(p => p.plan_name === planName), [plans, planName])
  const features = planData?.features ?? {}

  const can = useCallback(
    (featureKey: string): boolean => {
      if (!planData) return false
      const val = features[featureKey]
      if (typeof val === 'boolean') return val
      return false
    },
    [planData, features]
  )

  const limit = useCallback(
    (limitKey: string): number => {
      if (!planData) return 0
      const val = features[limitKey]
      if (val === null || val === undefined) return undefined
      return val as number
    },
    [planData, features]
  )

  return {
    isLoading: subLoading || planLoading,
    subscription,
    planName,
    planData,
    features,
    can,
    limit
  }
}
