import axios from 'axios'

// URL de base de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token d'authentification à chaque requête
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercepteur pour gérer les erreurs de réponse
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si le token est expiré, déconnecter l'utilisateur
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Service d'authentification
const auth = {
  login: (email, password) => instance.post('/auth/login', { email, password }),
  validateToken: () => instance.get('/auth/validate')
}

// Service des utilisateurs
const users = {
  getCurrentUser: () => instance.get('/users/profile'),
  getAll: (page = 1, limit = 10) => instance.get(`/users?page=${page}&limit=${limit}`),
  getById: (id) => instance.get(`/users/${id}`),
  update: (id, userData) => instance.put(`/users/${id}`, userData),
  delete: (id) => instance.delete(`/users/${id}`),
  getRuns: (userId) => instance.get(`/users/${userId}/runs`)
}

// Service des courses
const runs = {
  getAll: (page = 1, limit = 10) => instance.get(`/runs?page=${page}&limit=${limit}`),
  getById: (id) => instance.get(`/runs/${id}`),
  delete: (id) => instance.delete(`/runs/${id}`)
}

// Service des statistiques
const stats = {
  getGlobal: () => instance.get('/stats/global'),
  getByPeriod: (startDate, endDate) => instance.get(`/stats/period?start_date=${startDate}&end_date=${endDate}`),
  getUserActivity: () => instance.get('/stats/user-activity'),
  getPopularRoutes: () => instance.get('/stats/popular-routes'),
  getPerformanceMetrics: () => instance.get('/stats/performance')
}

// Service des paramètres de l'application
const settings = {
  get: () => instance.get('/settings'),
  update: (settingsData) => instance.put('/settings', settingsData)
}

export default {
  auth,
  users,
  runs,
  stats,
  settings
}