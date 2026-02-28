import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './contexts/ToastContext'
import { DataProvider } from './contexts/DataContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import './index.css'

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