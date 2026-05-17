import ReactDOM from 'react-dom/client'
import App from '@/App'
import { StrictMode } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SoundProvider } from './contexts/SoundContext'

import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!googleClientId || googleClientId === 'undefined') {
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      font-family: system-ui, sans-serif;
      padding: 24px;
    ">
      <div style="
        max-width: 480px;
        background: white;
        border: 1px solid #fee2e2;
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      ">
        <h2 style="margin: 0 0 12px; color: #991b1b; font-size: 18px;">
          Configuration Error
        </h2>
        <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">
          <strong>VITE_GOOGLE_CLIENT_ID</strong> is not set.
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
          If you are the developer: add this variable to your Vercel project's
          Environment Variables (Settings → Environment Variables) and redeploy.
          See <code>.env.example</code> for the required variable name.
        </p>
      </div>
    </div>
  `
} else {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <SoundProvider>
          <App />
        </SoundProvider>
      </GoogleOAuthProvider>
    </StrictMode>
  )
}
