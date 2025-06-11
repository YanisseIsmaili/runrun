import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import emergencyService from './services/emergencyService'
import './index.css'

// Nettoyage préventif au démarrage
try {
  emergencyService.performHealthCheck()
} catch (error) {
  console.warn('Erreur lors du health check initial:', error)
  localStorage.clear()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)