import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './contexts/ToastContext'
import { DataProvider } from './contexts/DataContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import './index.css'

function AppRoot() {
  const location = useLocation()
  const resetKey = `${location.pathname}${location.search}`

  return (
    <ErrorBoundary resetKey={resetKey}>
      <ToastProvider>
        <DataProvider>
          <AdminAuthProvider>
            <App />
          </AdminAuthProvider>
        </DataProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoot />
    </BrowserRouter>
  </React.StrictMode>,
)