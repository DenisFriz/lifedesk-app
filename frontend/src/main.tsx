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

console.log('VITE_GOOGLE_CLIENT_ID')
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <SoundProvider>
        <App />
      </SoundProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)
