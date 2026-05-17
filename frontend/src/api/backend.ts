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
  | 'assets'
  | 'bankAccounts'
  | 'workouts'
  | 'projects'

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
    me: () => apiFetch<User>('GET', '/auth/me'),
    usage: () => apiFetch<UserUsageResponse>('GET', '/auth/usage'),
    updateMe: (data: Record<string, unknown>) => apiFetch('PUT', '/auth/me', data),
    logout: async () => {
      clearToken()
      try {
        await apiFetch('POST', '/auth/logout')
      } finally {
        window.location.href = '/Login'
      }
    },
    redirectToLogin: (returnUrl?: string) => {
      window.location.href = `/Login?from=${encodeURIComponent(returnUrl || '/')}`
    },
    isAuthenticated: async () => {
      if (!getToken()) return false
      try {
        await apiFetch('GET', '/auth/me')
        return true
      } catch {
        return false
      }
    },
    reauthPassword: (password: string) =>
      apiFetch<ReauthResponse>('POST', '/auth/reauth/password', { password }),
    googleReauth: (credential: string) =>
      apiFetch<ReauthResponse>('POST', '/auth/google/reauth', {
        credential
      }),
    deleteRequest: () => apiFetch<DeleteRequestResponse>('GET', '/auth/delete/request'),
    changeSubscription: (subscription: 'free' | 'plus' | 'pro') =>
      apiFetch<DeleteRequestResponse>('POST', '/auth/change-subscription', {
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
  },
  appLogs: {
    logUserInApp: (pageName: string) => apiFetch('POST', '/appLogs/userActivity', { pageName })
  }
}
