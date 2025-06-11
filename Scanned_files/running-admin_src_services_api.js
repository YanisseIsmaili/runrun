// running-admin/src/services/api.js
import axios from 'axios'

// Simple emergency service pour éviter les erreurs d'import
const emergencyService = {
  logError: (error, context = '') => {
    console.error(`[${context}]`, error)
  }
}

// Configuration de base d'Axios
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
      const token = localStorage.getItem('auth_token')
      console.log('Interceptor - Token trouvé:', token ? 'Oui' : 'Non')
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
      error.userMessage = 'Session expirée. Veuillez vous reconnecter.'
      
      // Ne nettoyer que si ce n'est pas la route de login ou validate
      if (!error.config.url.includes('/login') && !error.config.url.includes('/validate')) {
        try {
          console.log('Nettoyage du token après erreur 401')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        } catch (storageError) {
          emergencyService.logError(storageError, 'storage_cleanup')
        }
      }
    }
    // Gestion des erreurs d'autorisation
    else if (error.response.status === 403) {
      error.userMessage = 'Vous n\'avez pas les permissions nécessaires pour cette action.'
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
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
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
    })
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
  
  create: (userData) => instance.post('/api/users', userData),
  
  update: (userId, userData) => instance.put(`/api/users/${userId}`, userData),
  
  delete: (userId) => instance.delete(`/api/users/${userId}`),
  
  getById: (userId) => instance.get(`/api/users/${userId}`)
}

// Service des courses
const runs = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.user_id) queryParams.append('user_id', params.user_id)
    if (params.route_id) queryParams.append('route_id', params.route_id)
    if (params.status) queryParams.append('status', params.status)
    if (params.date_from) queryParams.append('date_from', params.date_from)
    if (params.date_to) queryParams.append('date_to', params.date_to)
    
    const url = `/api/runs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url)
  },
  
  create: (runData) => instance.post('/api/runs', runData),
  
  update: (runId, runData) => instance.put(`/api/runs/${runId}`, runData),
  
  delete: (runId) => instance.delete(`/api/runs/${runId}`),
  
  getById: (runId) => instance.get(`/api/runs/${runId}`)
}

// Service des itinéraires
const routes = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.difficulty) queryParams.append('difficulty', params.difficulty)
    
    const url = `/api/routes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url)
  },
  
  getActiveRuns: () => instance.get('/api/routes/active-runs'),
  
  create: (routeData) => instance.post('/api/routes', routeData),
  
  update: (routeId, routeData) => instance.put(`/api/routes/${routeId}`, routeData),
  
  delete: (routeId) => instance.delete(`/api/routes/${routeId}`),
  
  getById: (routeId) => instance.get(`/api/routes/${routeId}`)
}

// Service de santé de l'API
const health = {
  check: () => instance.get('/api/health'),
  
  ping: () => instance.get('/api/health/ping'),
  
  status: () => instance.get('/api/health/status')
}

export default {
  auth,
  users,
  runs,
  routes,
  health
}