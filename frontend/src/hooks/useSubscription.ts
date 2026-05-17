import { useQuery } from '@tanstack/react-query'
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
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => backend.auth.me() as Promise<User | undefined>
  })

  const { data: subscriptions, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null
      try {
        const subs = (await backend.entities.Subscription.list()) as Subscription[]

        const userSub = subs.find(s => s.user_email === user.email)

        return userSub || null
      } catch (err) {
        console.error('[useSubscription] Error fetching subscription:', err)
        return null
      }
    },
    enabled: !!user?.email
  })

  const { data: plans, isLoading: planLoading } = useQuery({
    queryKey: ['userPlans'],
    queryFn: () => backend.entities.UserPlan.list() as Promise<UserPlan[]>
  })

  const subscription = subscriptions
  const planName = user?.subscription_tier ?? 'free'
  const planData = plans?.find(p => p.plan_name === planName)
  const features = planData?.features ?? {}

  const can = (featureKey: string): boolean => {
    if (!planData) return false
    const val = features[featureKey]
    if (typeof val === 'boolean') return val
    return false
  }

  const limit = (limitKey: string): number => {
    if (!planData) return 0
    const val = features[limitKey]
    if (val === null || val === undefined) return undefined
    return val as number
  }

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
