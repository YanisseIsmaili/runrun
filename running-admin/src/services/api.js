// running-admin/src/services/api.js - Version avec configuration globale
import axios from 'axios'
import globalApiConfig from '../utils/globalApiConfig'

const emergencyService = {
  logError: (error, context = '') => {
    console.error(`[${context}]`, error)
  }
}

// Fonction pour obtenir l'URL de base
const getBaseURL = () => {
  // Priorité à la configuration globale
  const globalConfig = globalApiConfig.getBaseURL()
  if (globalConfig) {
    return globalConfig
  }
  
  // Fallback sur .env
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  console.warn('⚠️ Utilisation URL .env (pas de config globale):', envUrl)
  return envUrl
}

// Créer l'instance axios avec URL dynamique
const instance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Mettre à jour l'URL de base quand la config globale change
globalApiConfig.addListener((data) => {
  if (data.baseURL) {
    instance.defaults.baseURL = data.baseURL
    console.log('🔄 Instance axios mise à jour automatiquement:', data.baseURL)
  }
})

// Exposer l'instance globalement pour les composants
if (typeof window !== 'undefined') {
  window.api = instance
}

console.log('🔧 [API] Service initialisé avec URL:', instance.defaults.baseURL)

// Intercepteur pour ajouter le token d'authentification
instance.interceptors.request.use(
  (config) => {
    try {
      // Vérifier si l'URL de base est configurée
      if (!globalApiConfig.isConfigured() && !import.meta.env.VITE_API_BASE_URL) {
        console.warn('⚠️ Aucune API configurée - la requête pourrait échouer')
      }

      // Priorité à sessionStorage (session courante) puis localStorage (persistant)
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Log pour debug
      console.log(`📡 [${config.method?.toUpperCase()}] ${config.url}`, {
        baseURL: config.baseURL,
        hasToken: !!token,
        apiConfigured: globalApiConfig.isConfigured()
      })
      
    } catch (error) {
      console.warn('Erreur lors de la récupération du token:', error)
      emergencyService.logError(error, 'token_retrieval')
    }
    return config
  },
  (error) => {
    emergencyService.logError(error, 'request_interceptor')
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les réponses et erreurs
instance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Gestion des erreurs de réseau
    if (!error.response) {
      console.error('Erreur de réseau:', error.message)
      
      // Message d'erreur contextuel selon la configuration
      if (!globalApiConfig.isConfigured()) {
        error.userMessage = 'Aucun serveur API configuré. Veuillez sélectionner un serveur dans les paramètres.'
      } else {
        error.userMessage = `Impossible de contacter le serveur API (${globalApiConfig.getBaseURL()}). ` +
          'Veuillez vérifier votre connexion réseau et l\'état du serveur.'
      }
      
      emergencyService.logError(error, 'network_error')
    }
    // Gestion des erreurs d'authentification
    else if (error.response.status === 401) {
      console.error('Erreur d\'authentification:', error.response.data)
      
      // Ne pas déconnecter sur les routes de validation/login
      if (error.config.url.includes('/validate') || error.config.url.includes('/login')) {
        error.userMessage = 'Identifiants invalides ou session expirée.'
      } else {
        error.userMessage = 'Session expirée. Veuillez vous reconnecter.'
        
        // Rediriger vers login si pas sur page de login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        }
      }
      
      emergencyService.logError(error, 'auth_error')
    }
    // Gestion des erreurs de permissions
    else if (error.response.status === 403) {
      console.error('Erreur de permissions:', error.response.data)
      error.userMessage = 'Vous n\'avez pas les permissions nécessaires pour cette action.'
      emergencyService.logError(error, 'permission_error')
    }
    // Gestion des erreurs serveur
    else if (error.response.status >= 500) {
      console.error('Erreur serveur:', error.response.data)
      error.userMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.'
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
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return instance.get(`/api/runs?${queryParams}`)
  },
  
  getById: (runId) => instance.get(`/api/runs/${runId}`),
  
  create: (runData) => instance.post('/api/runs', runData),
  
  update: (runId, runData) => instance.put(`/api/runs/${runId}`, runData),
  
  delete: (runId) => instance.delete(`/api/runs/${runId}`),
  
  start: (runData) => instance.post('/api/runs/start', runData),
  
  stop: (runId) => instance.post(`/api/runs/${runId}/stop`),
  
  addLocation: (runId, locationData) => 
    instance.post(`/api/runs/${runId}/locations`, locationData),
  
  getLocations: (runId) => instance.get(`/api/runs/${runId}/locations`),
  
  getStats: (userId = null) => {
    const url = userId ? `/api/runs/stats/${userId}` : '/api/runs/stats'
    return instance.get(url)
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
  
  isPermissionError: (error) => {
    return error.response?.status === 403
  },
  
  isServerError: (error) => {
    return error.response?.status >= 500
  },
  
  // Nouvelle fonction pour vérifier la configuration
  isConfigured: () => {
    return globalApiConfig.isConfigured()
  },
  
  // Obtenir l'URL configurée
  getCurrentBaseURL: () => {
    return globalApiConfig.getBaseURL()
  },
  
  // Tester la connexion à l'API configurée
  testConnection: async () => {
    return await globalApiConfig.testConnection()
  }
}

// Fonctions wrapper simplifiées pour compatibilité
const getActiveRuns = () => routes.getActiveRuns()
const getAll = (params = {}) => routes.getAll(params)

// Export default avec toutes les fonctions
const api = {
  auth,
  users,
  runs,
  routes,
  admin,
  health,
  utils,
  // Instance axios pour accès direct si nécessaire
  instance,
  // Fonctions de compatibilité
  getActiveRuns,
  getAll
}

export default api