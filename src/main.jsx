import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Overlay sofort transparent schalten — noch vor dem ersten Paint, damit OBS
// beim Laden der Browser-Source keinen kurzen dunklen Blitz sieht.
if (window.location.hash.startsWith('#/overlay')) {
  document.body.classList.add('overlay-modus')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
