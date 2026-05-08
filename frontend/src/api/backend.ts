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

export const backend = {
  auth: {
    me: () => apiFetch<User>('GET', '/auth/me'),
    updateMe: (data: Record<string, unknown>) => apiFetch('PUT', '/auth/me', data),
    logout: () => {
      clearToken()
      window.location.href = '/Login'
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
    }
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
