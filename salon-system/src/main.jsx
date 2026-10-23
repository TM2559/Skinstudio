import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './contexts/ToastContext'
import { DataProvider } from './contexts/DataContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import './index.css'

// skinstudio.cz bez www: kdo tu dřív byl, má z té doby service worker, který se kvůli přesměrování
// na www nemůže aktualizovat a ukazuje starou verzi webu. Tady ho smažeme a pošleme návštěvníka na www.
const APEX_HOST = 'skinstudio.cz'

async function leaveApexDomain() {
  try {
    const registrations = (await navigator.serviceWorker?.getRegistrations()) || []
    await Promise.all(registrations.map((r) => r.unregister()))
    const keys = (await window.caches?.keys()) || []
    await Promise.all(keys.map((k) => window.caches.delete(k)))
  } finally {
    const { pathname, search, hash } = window.location
    window.location.replace(`https://www.${APEX_HOST}${pathname}${search}${hash}`)
  }
}

if (window.location.hostname === APEX_HOST) {
  leaveApexDomain()
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <DataProvider>
            <AdminAuthProvider>
              <App />
            </AdminAuthProvider>
          </DataProvider>
        </ToastProvider>
      </BrowserRouter>
    </React.StrictMode>,
  )
}
