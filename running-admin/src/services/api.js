// running-admin/src/services/api.js - FICHIER ORIGINAL COMPLET
import axios from 'axios'

const emergencyService = {
  logError: (error, context = '') => {
    console.error(`[${context}]`, error)
  }
}

const API_BASE_URL = 'http://localhost:5000'

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Intercepteur pour ajouter le token d'authentification
instance.interceptors.request.use(
  (config) => {
    try {
      // Priorité à sessionStorage (session courante) puis localStorage (persistant)
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
      console.log('Interceptor - Token trouvé:', token ? 'Oui' : 'Non')
      console.log('Interceptor - Source:', sessionStorage.getItem('auth_token') ? 'session' : 'localStorage')
      console.log('Interceptor - URL:', config.url)
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('Interceptor - Header Authorization ajouté')
      }
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
      error.userMessage = 'Impossible de contacter le serveur. ' +
        'Veuillez vérifier votre connexion réseau et l\'état du serveur API.'
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
        try {
          console.log('Nettoyage des tokens après erreur 401')
          // Nettoyer TOUS les stockages
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          sessionStorage.removeItem('auth_token')
          sessionStorage.removeItem('user_data')
          
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login'
          }
        } catch (storageError) {
          emergencyService.logError(storageError, 'storage_cleanup')
        }
      }
    }
    // Gestion des erreurs d'autorisation (403)
    else if (error.response.status === 403) {
      const errorData = error.response.data
      console.error('Erreur d\'autorisation:', errorData)
      
      if (errorData.error_code === 'ADMIN_REQUIRED') {
        error.userMessage = `Accès administrateur requis. Votre compte "${errorData.user_info?.username}" n'a pas les permissions nécessaires.`
      } else {
        error.userMessage = 'Vous n\'avez pas les permissions nécessaires pour cette action.'
      }
    }
    // Gestion des erreurs de validation
    else if (error.response.status === 400) {
      error.userMessage = error.response.data?.message || 'Données invalides.'
    }
    // Gestion des erreurs serveur
    else if (error.response.status >= 500) {
      error.userMessage = 'Erreur du serveur. Veuillez réessayer plus tard.'
      emergencyService.logError(error, 'server_error')
    }
    // Autres erreurs
    else {
      console.error('Erreur de requête:', error.message)
      emergencyService.logError(error, 'api_error')
    }
    
    if (!error.userMessage) {
      error.userMessage = error.response?.data?.message || 
                         'Une erreur est survenue lors de la communication avec le serveur'
    }
    
    return Promise.reject(error)
  }
)

// Service d'authentification
const auth = {
  login: (emailOrUsername, password) => {
    const isEmail = emailOrUsername.includes('@')
    
    const payload = {
      password: password
    }
    
    if (isEmail) {
      payload.email = emailOrUsername
    } else {
      payload.username = emailOrUsername
    }
    
    console.log('Tentative de connexion avec:', { ...payload, password: '[HIDDEN]' })
    return instance.post('/api/auth/login', payload)
  },
  
  logout: () => {
    try {
      // Nettoyer TOUS les stockages
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('user_data')
      console.log('Tous les tokens supprimés')
      return Promise.resolve()
    } catch (error) {
      emergencyService.logError(error, 'logout_cleanup')
      return Promise.reject(error)
    }
  },
  
  validateToken: () => instance.get('/api/auth/validate'),
  
  refreshToken: () => instance.post('/api/auth/refresh'),
  
  changePassword: (currentPassword, newPassword) => 
    instance.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    }),
  
  promoteAdmin: (secretKey) => 
    instance.post('/api/auth/promote-admin', {
      secret_key: secretKey
    }),
  
  testConnection: () => instance.get('/api/health'),
  
  testAuth: () => instance.get('/api/health/auth')
}

// Service des utilisateurs
const users = {
  getCurrentUser: () => instance.get('/api/users/profile'),
  
  updateProfile: (userData) => instance.put('/api/users/profile', userData),
  
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.role) queryParams.append('role', params.role)
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.sort_order) queryParams.append('sort_order', params.sort_order)
    
    const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url)
  },
  
  getById: (userId) => instance.get(`/api/users/${userId}`),
  
  create: (userData) => instance.post('/api/users', userData),
  
  update: (userId, userData) => instance.put(`/api/users/${userId}`, userData),
  
  delete: (userId) => instance.delete(`/api/users/${userId}`),
  
  exportUsers: (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return instance.get(`/api/users/export?${queryParams}`, {
      responseType: 'blob'
    })
  }
}

// Service des courses (runs)
const runs = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.user_id) queryParams.append('user_id', params.user_id)
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.sort_order) queryParams.append('sort_order', params.sort_order)
    
    const url = `/api/runs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url)
  },
  
  getById: (runId) => instance.get(`/api/runs/${runId}`),
  
  create: (runData) => instance.post('/api/runs', runData),
  
  update: (runId, runData) => instance.put(`/api/runs/${runId}`, runData),
  
  delete: (runId) => instance.delete(`/api/runs/${runId}`),
  
  getStats: (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return instance.get(`/api/runs/stats?${queryParams}`)
  },
  
  exportRuns: (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return instance.get(`/api/runs/export?${queryParams}`, {
      responseType: 'blob'
    })
  }
}

// Service des routes/parcours
const routes = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.difficulty) queryParams.append('difficulty', params.difficulty)
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.sort_order) queryParams.append('sort_order', params.sort_order)
    
    const url = `/api/routes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
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
  utils,
  // Fonctions de compatibilité
  getActiveRuns,
  getAll
}

export default api