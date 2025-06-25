// running-admin/src/services/api.js
import axios from 'axios'
import globalApiConfig from '../utils/globalApiConfig'

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const API_TIMEOUT = parseInt(import.meta.env.VITE_NETWORK_TIMEOUT) || 30000

// Créer l'instance axios
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Service d'urgence pour gérer les erreurs critiques
const emergencyService = {
  logError: (error, context = '') => {
    console.error(`[Emergency Service] ${context}:`, error)
    // Ici vous pourriez envoyer l'erreur à un service de monitoring
  },
  
  handleCriticalError: (error) => {
    console.error('Erreur critique détectée:', error)
    // Actions d'urgence si nécessaire
  }
}

// Intercepteur de requêtes
instance.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Utiliser l'URL de l'API configurée si disponible
    const apiConfig = globalApiConfig.getConfig()
    if (apiConfig.isConfigured && apiConfig.baseURL) {
      config.baseURL = apiConfig.baseURL
    }

    console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    emergencyService.logError(error, 'request_interceptor')
    return Promise.reject(error)
  }
)

// Intercepteur de réponses
instance.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error(`❌ ${error.response?.status || 'Network'} ${error.config?.url}:`, error.message)

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      console.warn('Token expiré, redirection vers login')
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')
      window.location.href = '/login'
      error.userMessage = 'Session expirée. Veuillez vous reconnecter.'
      emergencyService.logError(error, 'auth_error')
    }
    // Erreurs réseau
    else if (!error.response) {
      console.error('Erreur réseau:', error.message)
      error.userMessage = 'Erreur de connexion. Vérifiez votre connexion internet et la configuration de l\'API.'
      emergencyService.logError(error, 'network_error')
    }
    // Erreurs serveur (5xx)
    else if (error.response.status >= 500) {
      console.error('Erreur serveur:', error.response.status, error.response.data)
      error.userMessage = 'Erreur serveur temporaire. Veuillez réessayer plus tard.'
      emergencyService.logError(error, 'server_error')
    }
    // Autres erreurs
    else {
      console.error('Erreur API:', error.response.status, error.response.data)
      error.userMessage = error.response.data?.message || 'Une erreur est survenue lors de la communication avec le serveur.'
      emergencyService.logError(error, 'api_error')
    }

    return Promise.reject(error)
  }
)

// Service d'authentification
const auth = {
  login: (emailOrUsername, password) => {
    const payload = { password }
    if (emailOrUsername.includes('@')) {
      payload.email = emailOrUsername
    } else {
      payload.username = emailOrUsername
    }
    return instance.post('/api/auth/login', payload)
  },
  
  register: (userData) => instance.post('/api/auth/register', userData),
  
  logout: () => instance.post('/api/auth/logout'),
  
  validateToken: () => instance.get('/api/auth/validate'),
  
  refreshToken: () => instance.post('/api/auth/refresh'),
  
  changePassword: (currentPassword, newPassword) => 
    instance.post('/api/auth/change-password', { currentPassword, newPassword }),
  
  forgotPassword: (email) => instance.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (token, newPassword) => 
    instance.post('/api/auth/reset-password', { token, newPassword })
}

// Service utilisateurs
const users = {
  getProfile: () => instance.get('/api/users/profile'),
  
  updateProfile: (profileData) => instance.put('/api/users/profile', profileData),
  
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return instance.get(`/api/users?${queryParams}`)
  },
  
  getById: (userId) => instance.get(`/api/users/${userId}`),
  
  create: (userData) => instance.post('/api/users', userData),
  
  update: (userId, userData) => instance.put(`/api/users/${userId}`, userData),
  
  delete: (userId) => instance.delete(`/api/users/${userId}`),
  
  uploadAvatar: (userId, formData) => 
    instance.post(`/api/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
}

// Service courses/runs
const runs = {
  // Récupérer toutes les courses avec pagination et filtres
  getAll: (params = {}) => {
    // Nettoyer les paramètres undefined pour éviter les erreurs d'URL
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {})
    
    const queryParams = new URLSearchParams(cleanParams)
    const url = Object.keys(cleanParams).length > 0 
      ? `/api/runs?${queryParams.toString()}` 
      : '/api/runs'
    
    console.log('🏃 API Call runs.getAll:', url)
    return instance.get(url)
  },
  
  // Récupérer une course par ID
  getById: (runId) => {
    console.log('🏃 API Call runs.getById:', runId)
    return instance.get(`/api/runs/${runId}`)
  },
  
  // Créer une nouvelle course
  create: (runData) => {
    console.log('🏃 API Call runs.create:', runData)
    return instance.post('/api/runs', runData)
  },
  
  // Mettre à jour une course
  update: (runId, runData) => {
    console.log('🏃 API Call runs.update:', runId, runData)
    return instance.put(`/api/runs/${runId}`, runData)
  },
  
  // Supprimer une course
  delete: (runId) => {
    console.log('🏃 API Call runs.delete:', runId)
    return instance.delete(`/api/runs/${runId}`)
  },
  
  // Supprimer plusieurs courses
  bulkDelete: (runIds) => {
    console.log('🏃 API Call runs.bulkDelete:', runIds)
    return instance.post('/api/runs/bulk-delete', { run_ids: runIds })
  },
  
  // Démarrer une course
  start: (runData) => {
    console.log('🏃 API Call runs.start:', runData)
    return instance.post('/api/runs/start', runData)
  },
  
  // Arrêter une course
  stop: (runId, endData = {}) => {
    console.log('🏃 API Call runs.stop:', runId, endData)
    return instance.post(`/api/runs/${runId}/stop`, endData)
  },
  
  // Mettre en pause une course
  pause: (runId) => {
    console.log('🏃 API Call runs.pause:', runId)
    return instance.post(`/api/runs/${runId}/pause`)
  },
  
  // Reprendre une course
  resume: (runId) => {
    console.log('🏃 API Call runs.resume:', runId)
    return instance.post(`/api/runs/${runId}/resume`)
  },
  
  // Ajouter une localisation à une course en cours
  addLocation: (runId, locationData) => {
    console.log('🏃 API Call runs.addLocation:', runId, locationData)
    return instance.post(`/api/runs/${runId}/locations`, locationData)
  },
  
  // Récupérer les localisations d'une course
  getLocations: (runId) => {
    console.log('🏃 API Call runs.getLocations:', runId)
    return instance.get(`/api/runs/${runId}/locations`)
  },
  
  // Récupérer les statistiques des courses
  getStats: (userId = null, params = {}) => {
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {})
    
    const queryParams = new URLSearchParams(cleanParams)
    const url = userId 
      ? `/api/runs/stats/${userId}?${queryParams}` 
      : `/api/runs/stats?${queryParams}`
    
    console.log('🏃 API Call runs.getStats:', url)
    return instance.get(url)
  },
  
  // Exporter les données de courses
  export: (params = {}) => {
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {})
    
    const queryParams = new URLSearchParams(cleanParams)
    console.log('🏃 API Call runs.export:', queryParams.toString())
    return instance.get(`/api/runs/export?${queryParams}`, {
      responseType: 'blob'
    })
  },
  
  // Exporter plusieurs courses sélectionnées
  bulkExport: (runIds, format = 'csv') => {
    console.log('🏃 API Call runs.bulkExport:', runIds, format)
    return instance.post('/api/runs/bulk-export', { 
      run_ids: runIds, 
      format 
    }, {
      responseType: 'blob'
    })
  },
  
  // Récupérer les courses par utilisateur
  getByUser: (userId, params = {}) => {
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {})
    
    const queryParams = new URLSearchParams(cleanParams)
    const url = `/api/users/${userId}/runs?${queryParams}`
    console.log('🏃 API Call runs.getByUser:', url)
    return instance.get(url)
  },
  
  // Récupérer les courses actives/en cours
  getActive: () => {
    console.log('🏃 API Call runs.getActive')
    return instance.get('/api/runs/active')
  },
  
  // Récupérer le résumé des courses récentes
  getRecent: (limit = 10) => {
    console.log('🏃 API Call runs.getRecent:', limit)
    return instance.get(`/api/runs/recent?limit=${limit}`)
  },
  
  // Recherche avancée de courses
  search: (searchParams) => {
    console.log('🏃 API Call runs.search:', searchParams)
    return instance.post('/api/runs/search', searchParams)
  },
  
  // Dupliquer une course (créer une copie)
  duplicate: (runId) => {
    console.log('🏃 API Call runs.duplicate:', runId)
    return instance.post(`/api/runs/${runId}/duplicate`)
  }
}

// Service routes
const routes = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params)
    const url = params ? `/api/routes?${queryParams.toString()}` : '/api/routes'
    return instance.get(url)
  },
  
  getById: (routeId) => instance.get(`/api/routes/${routeId}`),
  
  create: (routeData) => instance.post('/api/routes', routeData),
  
  update: (routeId, routeData) => instance.put(`/api/routes/${routeId}`, routeData),
  
  delete: (routeId) => instance.delete(`/api/routes/${routeId}`),
  
  getActiveRuns: () => instance.get('/api/routes/active-runs'),
  
  getStats: () => instance.get('/api/routes/stats')
}

// Service administrateur
const admin = {
  getStats: () => instance.get('/api/admin/stats'),
  
  refreshStats: () => instance.post('/api/admin/stats/refresh'),
  
  getActivity: (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return instance.get(`/api/admin/activity?${queryParams}`)
  },
  
  getUsers: (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return instance.get(`/api/admin/users?${queryParams}`)
  },
  
  exportData: (type, params = {}) => {
    const queryParams = new URLSearchParams(params)
    return instance.get(`/api/admin/export/${type}?${queryParams}`, {
      responseType: 'blob'
    })
  }
}

// Service de santé/test de l'API
const health = {
  check: () => instance.get('/api/health'),
  
  ping: () => instance.get('/api/ping'),
  
  status: () => instance.get('/api/status'),
  
  // Test rapide de connectivité
  quickTest: async () => {
    try {
      const response = await instance.get('/api/health', { timeout: 3000 })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Fonctions utilitaires
const utils = {
  logError: (error, context = '') => {
    emergencyService.logError(error, context)
  },
  
  getErrorMessage: (error) => {
    return error.userMessage || error.response?.data?.message || error.message || 'Une erreur est survenue'
  },
  
  isNetworkError: (error) => {
    return !error.response
  },
  
  isAuthError: (error) => {
    return error.response?.status === 401
  },
  
  isServerError: (error) => {
    return error.response?.status >= 500
  },
  
  // Fonction pour gérer les timeouts
  withTimeout: (promise, timeoutMs = API_TIMEOUT) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ])
  }
}

// Export de l'instance axios pour l'utilisation globale
window.api = instance

// Export par défaut
export default {
  auth,
  users,
  runs,
  routes,
  admin,
  health,
  utils,
  instance,
  emergencyService
}