import axios, { AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export const TOKEN_KEY = 'auth_token' as const

/* -------------------- Token helpers -------------------- */

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)

export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

/* -------------------- Axios instance -------------------- */

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

/* Attach token automatically */
api.interceptors.request.use(config => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* -------------------- Refresh logic -------------------- */

let isRefreshing = false
let failedQueue: Array<(token: string | null) => void> = []

const processQueue = (token: string | null) => {
  failedQueue.forEach(cb => cb(token))
  failedQueue = []
}

/* -------------------- Response interceptor with refresh and error normalization -------------------- */

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const originalRequest: any = error.config
    const status = error.response?.status
    const data = error.response?.data as any

    const code = data?.code

    if (status !== 401) {
      return Promise.reject({
        message: data?.error || error.message,
        status,
        data
      })
    }

    if (
      code === 'REFRESH_TOKEN_EXPIRED' ||
      code === 'REFRESH_TOKEN_INVALID' ||
      code === 'REFRESH_TOKEN_REVOKED'
    ) {
      clearToken()
      window.location.href = '/login'

      return Promise.reject({
        message: data?.error || error.message,
        status,
        data
      })
    }

    if (originalRequest?.url?.includes('/auth/refresh')) {
      clearToken()
      return Promise.reject({
        message: data?.error || error.message,
        status,
        data
      })
    }

    if (
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/google')
    ) {
      return Promise.reject({
        message: data?.error || error.message,
        status,
        data
      })
    }

    if (originalRequest._retry) {
      clearToken()
      return Promise.reject({
        message: data?.error || error.message,
        status,
        data
      })
    }

    originalRequest._retry = true

    try {
      if (isRefreshing) {
        return new Promise(resolve => {
          failedQueue.push(token => {
            if (!token) {
              return Promise.reject(error)
            }

            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${token}`
            }

            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true

      const res = await api.post('/auth/refresh')
      const newToken: string = res.data.accessToken

      setToken(newToken)

      processQueue(newToken)

      isRefreshing = false

      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${newToken}`
      }

      return api(originalRequest)
    } catch (err) {
      isRefreshing = false

      processQueue(null)

      clearToken()

      window.location.href = '/login'

      const refreshError = err as AxiosError
      const refreshErrorData = refreshError.response?.data as any
      return Promise.reject({
        message: refreshErrorData?.error || refreshError.message,
        status: refreshError.response?.status,
        data: refreshErrorData
      })
    }
  }
)

/* -------------------- API methods -------------------- */

export async function apiFetch<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await api.request<T>({
    method,
    url: path,
    data: body
  })

  return res.data
}

/* -------------------- Upload -------------------- */

export async function apiUpload(file: File): Promise<unknown> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return res.data
}
