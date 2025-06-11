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
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
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
      console.error('Erreur d\'authentification')
      error.userMessage = 'Session expirée. Veuillez vous reconnecter.'
      
      // Nettoyer le stockage et rediriger vers la connexion
      try {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      } catch (storageError) {
        emergencyService.logError(storageError, 'storage_cleanup')
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
    
    // Paramètres de pagination
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    
    // Paramètres de recherche et filtres
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.role) queryParams.append('role', params.role)
    
    // Paramètres de tri
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.sort_order) queryParams.append('sort_order', params.sort_order)
    
    const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url)
  },
  
  getById: (id) => instance.get(`/api/users/${id}`),
  
  create: (userData) => instance.post('/api/users', userData),
  
  update: (id, userData) => instance.put(`/api/users/${id}`, userData),
  
  delete: (id) => instance.delete(`/api/users/${id}`),
  
  bulkDelete: (userIds) => instance.post('/api/users/bulk-delete', { user_ids: userIds }),
  
  getRuns: (userId, params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    
    const url = `/api/users/${userId}/runs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url)
  },
  
  export: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.format) queryParams.append('format', params.format)
    if (params.include_stats) queryParams.append('include_stats', params.include_stats)
    
    const url = `/api/users/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url, { responseType: 'blob' })
  },
  
  getSummary: () => instance.get('/api/users/stats/summary')
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
  
  getById: (id) => instance.get(`/api/runs/${id}`),
  
  create: (runData) => instance.post('/api/runs', runData),
  
  update: (id, runData) => instance.put(`/api/runs/${id}`, runData),
  
  delete: (id) => instance.delete(`/api/runs/${id}`),
  
  bulkDelete: (runIds) => instance.post('/api/runs/bulk-delete', { run_ids: runIds }),
  
  export: (params = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key])
    })
    
    const url = `/api/runs/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url, { responseType: 'blob' })
  }
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
  
  getById: (id) => instance.get(`/api/routes/${id}`),
  
  create: (routeData) => instance.post('/api/routes', routeData),
  
  update: (id, routeData) => instance.put(`/api/routes/${id}`, routeData),
  
  delete: (id) => instance.delete(`/api/routes/${id}`),
  
  toggleStatus: (id) => instance.patch(`/api/routes/${id}/toggle-status`),
  
  getActiveRuns: () => instance.get('/api/routes/active-runs'),
  
  getRouteStats: (id) => instance.get(`/api/routes/${id}/stats`),
  
  export: () => instance.get('/api/routes/export', { responseType: 'blob' })
}

// Service des statistiques
const stats = {
  getGlobal: () => instance.get('/api/stats/global'),
  
  getUserActivity: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.period) queryParams.append('period', params.period)
    if (params.user_id) queryParams.append('user_id', params.user_id)
    
    const url = `/api/stats/user-activity${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url)
  },
  
  getUserStats: (userId) => instance.get(`/api/stats/users/${userId}`),
  
  getWeeklyStats: () => instance.get('/api/stats/weekly'),
  
  getMonthlyStats: (year, month) => 
    instance.get(`/api/stats/monthly?year=${year}&month=${month}`),
  
  getDashboardStats: () => instance.get('/api/stats/dashboard'),
  
  getPerformanceDistribution: () => instance.get('/api/stats/performance-distribution'),
  
  generateReport: (type, period, params = {}) => {
    const queryParams = new URLSearchParams()
    queryParams.append('type', type)
    queryParams.append('period', period)
    
    Object.keys(params).forEach(key => {
      if (params[key]) queryParams.append(key, params[key])
    })
    
    return instance.get(`/api/stats/report?${queryParams.toString()}`, {
      responseType: 'blob'
    })
  },
  
  getRealtimeStats: () => instance.get('/api/stats/realtime')
}

// Service admin
const admin = {
  getSystemInfo: () => instance.get('/api/admin/system-info'),
  
  getAuditLogs: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.action) queryParams.append('action', params.action)
    if (params.user_id) queryParams.append('user_id', params.user_id)
    if (params.date_from) queryParams.append('date_from', params.date_from)
    if (params.date_to) queryParams.append('date_to', params.date_to)
    
    const url = `/api/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return instance.get(url)
  },
  
  performMaintenance: (action) => instance.post('/api/admin/maintenance', { action }),
  
  backupDatabase: () => instance.post('/api/admin/backup', {}, { responseType: 'blob' }),
  
  getSettings: () => instance.get('/api/admin/settings'),
  
  updateSettings: (settings) => instance.put('/api/admin/settings', settings),
  
  clearCache: () => instance.post('/api/admin/clear-cache'),
  
  testEmail: (email) => instance.post('/api/admin/test-email', { email })
}

// Service de santé de l'API
const health = {
  check: () => instance.get('/api/health'),
  
  ping: () => instance.get('/api/health/ping'),
  
  status: () => instance.get('/api/health/status')
}

// Utilitaires pour la gestion des erreurs
const handleApiError = (error, context = '') => {
  console.error(`Erreur API ${context}:`, error)
  
  let message = 'Une erreur est survenue'
  
  if (error.userMessage) {
    message = error.userMessage
  } else if (error.response?.data?.message) {
    message = error.response.data.message
  } else if (error.message) {
    message = error.message
  }
  
  // Log l'erreur dans le service d'urgence
  emergencyService.logError(error, `api_${context}`)
  
  return {
    success: false,
    message,
    error: error.response?.data || error.message,
    status: error.response?.status
  }
}

// Utilitaire pour télécharger des fichiers
const downloadFile = (blob, filename) => {
  try {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    throw new Error('Impossible de télécharger le fichier')
  }
}

// Utilitaire pour formater les URLs avec paramètres
const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl, API_BASE_URL)
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      url.searchParams.append(key, params[key])
    }
  })
  
  return url.toString()
}

// Configuration et méthodes utilitaires
const config = {
  setBaseURL: (newBaseURL) => {
    instance.defaults.baseURL = newBaseURL
  },
  
  setTimeout: (timeout) => {
    instance.defaults.timeout = timeout
  },
  
  getBaseURL: () => instance.defaults.baseURL,
  
  getTimeout: () => instance.defaults.timeout
}

// Export par défaut avec tous les services
const api = {
  auth,
  users,
  runs,
  routes,
  stats,
  admin,
  health,
  config,
  utils: {
    handleApiError,
    downloadFile,
    buildUrl
  }
}

export default api

// Exports nommés pour une utilisation spécifique
export {
  auth,
  users,
  runs,
  routes,
  stats,
  admin,
  health,
  handleApiError,
  downloadFile,
  buildUrl
}