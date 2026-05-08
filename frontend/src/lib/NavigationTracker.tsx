import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { backend } from '@/api/backend'

export default function NavigationTracker(): null {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  // Send URL updates to parent frame (if embedded)
  useEffect(() => {
    window.parent?.postMessage(
      {
        type: 'app_changed_url',
        url: window.location.href
      },
      '*'
    )
  }, [location])

  // Track page navigation
  useEffect(() => {
    const pathname = location.pathname

    // Normalize route into a "page name"
    let pageName: string | null = null

    if (pathname === '/' || pathname === '') {
      pageName = 'Home'
    } else {
      // Take first segment and format it as page name
      const segment = pathname.split('/')[1]

      if (segment) {
        // Keep original casing preference (matches your routes like /AssetsCars)
        pageName = segment
      }
    }

    if (isAuthenticated && pageName) {
      backend.appLogs.logUserInApp(pageName).catch(() => {
        // Silently ignore logging errors
      })
    }
  }, [location, isAuthenticated])

  return null
}
