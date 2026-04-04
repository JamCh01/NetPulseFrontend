import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/i18n'
import { configureApiClient } from '@/api/client'
import App from './App.tsx'

configureApiClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
