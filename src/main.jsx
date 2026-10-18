import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initSecurityGuard } from './services/securityGuard.js'

// Inisialisasi perlindungan keamanan dan anti-tamper aplikasi
initSecurityGuard();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register PWA Service Worker
if ('serviceWorker' in navigator && !window.location.host.startsWith('localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[TOKUFLIX PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[TOKUFLIX PWA] Service Worker registration failed:', err);
      });
  });
}

