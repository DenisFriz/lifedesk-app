import axios from 'axios'

const BASE_URL = import.meta.env.BACKEND_URL || 'http://localhost:3001'

export const TOKEN_KEY = 'auth_token' as const

/* -------------------- Token helpers -------------------- */

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)

export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

/* -------------------- Axios instance -------------------- */

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

/* Attach token automatically */
api.interceptors.request.use(config => {
  const token = getToken()

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

/* Normalize errors */
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const data = error.response?.data

    return Promise.reject({
      message: data?.error || error.message,
      status,
      data
    })
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
