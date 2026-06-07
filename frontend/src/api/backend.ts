import { apiFetch, apiUpload, getToken, clearToken } from './apiClient'
import type { EntityApi, User } from '@/types'

const GET_FUNCTIONS = new Set([
  'getExchangeRates',
  'debugServiceRole',
  'debugSubscriptionStatus',
  'analyzeSubscriptionDuplicates'
])

const makeEntity = (entityName: string): EntityApi => ({
  list: () => apiFetch('GET', `/entities/${entityName}`),
  filter: (conditions, sort) =>
    apiFetch('POST', `/entities/${entityName}/filter`, conditions || {}),
  create: data => apiFetch('POST', `/entities/${entityName}`, data),
  update: (id, data) => apiFetch('PUT', `/entities/${entityName}/${id}`, data),
  delete: id => apiFetch('DELETE', `/entities/${entityName}/${id}`),
  bulkCreate: records => apiFetch('POST', `/entities/${entityName}/bulk`, { records })
})

const entitiesProxy = new Proxy({} as Record<string, EntityApi>, {
  get(_target, entityName: string): EntityApi {
    return makeEntity(entityName)
  }
})

export type UsageKey =
  | 'goals'
  | 'tasks'
  | 'calendarEntries'
  | 'events'
  | 'vehicle'
  | 'vehicle_photos'
  | 'vehicle_repairs'
  | 'estate'
  | 'otherAsset'
  | 'offlineBankAccount'
  | 'offlineAccountSnapshot'
  | 'healthTrackingEnties'
  | 'medicalDocuments'
  | 'workouts'
  | 'workoutPlans'
  | 'bodyMeasurements'
  | 'hobbies'
  | 'learning'
  | 'relationships'
  | 'business'
  | 'progressPhotos'
  | 'projectsAndClients'
  | 'marketingStrategy'
  | 'marketingCampaign'
  | 'marketingContent'
  | 'campaign'
  | 'income'
  | 'expense'
  | 'problem'
  | 'timeEntries'
  | 'projects'
  | 'clients'
  | 'communityIdeas'
  | 'community_comment'
  | 'ai_assistant'
  | 'content'

type UsageMap = Record<UsageKey, number>
type LimitsMap = Record<UsageKey, number | null>
type RemainingMap = Record<UsageKey, number | null>

export type UserUsageResponse = {
  usage: UsageMap
  limits: LimitsMap
  remaining: RemainingMap
}

type DeleteRequestResponse = {
  requiresReauth: boolean
  provider: 'local' | 'google'
}

type ReauthResponse = {
  success: boolean
  reauthToken: string
}

export const backend = {
  auth: {
    logout: async () => {
      clearToken()
      try {
        await apiFetch('POST', '/auth/logout')
      } finally {
        window.location.href = '/login'
      }
    },
    redirectToLogin: (returnUrl?: string) => {
      window.location.href = `/Login?from=${encodeURIComponent(returnUrl || '/')}`
    },
    isAuthenticated: async () => {
      if (!getToken()) return false
      try {
        await apiFetch('GET', '/user/me')
        return true
      } catch {
        return false
      }
    }
  },
  user: {
    me: () => apiFetch<User>('GET', '/user/me'),
    updateMe: (data: Record<string, unknown>) => apiFetch('PUT', '/user/me', data),
    deleteAvatar: () => apiFetch('DELETE', '/user/profile-image'),
    usage: () => apiFetch<UserUsageResponse>('GET', '/user/usage'),
    deleteRequest: () => apiFetch<DeleteRequestResponse>('GET', '/user/delete/request'),
    reauthPassword: (password: string) =>
      apiFetch<ReauthResponse>('POST', '/user/reauth/password', { password }),
    googleReauth: (credential: string) =>
      apiFetch<ReauthResponse>('POST', '/user/google/reauth', {
        credential
      }),
    changeSubscription: (subscription: 'free' | 'plus' | 'pro') =>
      apiFetch<DeleteRequestResponse>('POST', '/user/change-subscription', {
        subscription
      })
  },
  email: {
    sendEmailVerificationCode: () =>
      apiFetch<{ message: string }>('POST', '/email/send-email-verification-code'),
    verifyEmailCode: (code: string) =>
      apiFetch<{ message: string }>('POST', '/email/verify-email-code', { code })
  },
  entities: entitiesProxy,
  functions: {
    invoke: <T = unknown>(name: string, args?: unknown) =>
      apiFetch<T>(GET_FUNCTIONS.has(name) ? 'GET' : 'POST', `/functions/${name}`, args)
  },
  integrations: {
    Core: {
      UploadFile: ({ file }: { file: File }) => apiUpload(file),
      InvokeLLM: (p: unknown) => apiFetch('POST', '/functions/invokeLLM', p),
      SendEmail: (p: unknown) => apiFetch('POST', '/functions/sendEmail', p),
      SendSMS: (p: unknown) => apiFetch('POST', '/functions/sendSMS', p),
      GenerateImage: (p: unknown) => apiFetch('POST', '/functions/generateImage', p),
      ExtractDataFromUploadedFile: (p: unknown) =>
        apiFetch('POST', '/functions/extractDataFromUploadedFile', p)
    }
  }
}
