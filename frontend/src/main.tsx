import ReactDOM from 'react-dom/client'
import App from '@/App'
import { StrictMode } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SoundProvider } from './contexts/SoundContext'

import './index.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <SoundProvider>
        <App />
      </SoundProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)
