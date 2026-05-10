// ─── User & Auth ──────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  profile_image?: string
  subscription_tier: 'free' | 'plus' | 'pro' | 'enterprise'
  role: string
  is_deleted?: boolean
  terms_accepted_at?: string
}

export interface AuthError {
  type: 'unknown' | 'account_deleted' | 'auth_required' | 'user_not_registered'
  message: string
}

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoadingAuth: boolean
  authError: AuthError | null
  logout: (shouldRedirect?: boolean) => void
  login: (token: string) => Promise<void>
  checkAppState: () => Promise<void>
}

// ─── Layout ───────────────────────────────────────────────────────────────

export interface LayoutContextValue {
  hiddenSections: string[]
  isHidden: (name: string) => boolean
  playAudio: (soundName: string) => void
}

export interface NavItem {
  name: string
  page?: string
  url?: string
  iconName: string
  section: string
  expandable?: boolean
  businessId?: string
  comingSoon?: boolean
  children?: NavItem[]
}

// ─── API ──────────────────────────────────────────────────────────────────

export interface EntityApi {
  list: (sort?: string, limit?: number) => Promise<any[]>
  filter: <T = any>(conditions: Record<string, any>, sort?: string, limit?: number) => Promise<T[]>
  create: (data: Record<string, any>) => Promise<any>
  update: (id: string, data: Record<string, any>) => Promise<any>
  delete: (id: string) => Promise<void>
  bulkCreate: (records: any[]) => Promise<any>
}

// ─── Sync & Offline ───────────────────────────────────────────────────────

export type SyncOperation = 'create' | 'update' | 'delete'

export interface SyncQueueItem {
  id?: number
  localId: string
  entityName: string
  operation: SyncOperation
  payload: Record<string, unknown>
  timestamp: number
  status: 'pending' | 'syncing'
}

// ─── App Params ───────────────────────────────────────────────────────────

export interface AppParams {
  appId?: string | null
  serverUrl?: string | null
  token?: string | null
  fromUrl?: string | null
  functionsVersion?: string | null
}
