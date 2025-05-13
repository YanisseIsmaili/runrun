// Fichier: src/services/api.js
import axios from 'axios';

// URL de base de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API URL configurée:', API_URL);

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Ajouter un timeout pour éviter les attentes infinies
  timeout: 10000,
  // Assurer que les cookies sont envoyés avec les requêtes
  withCredentials: true
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
instance.interceptors.request.use(
  (config) => {
    console.log('Envoi de requête à:', config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erreur lors de la préparation de la requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
instance.interceptors.response.use(
  (response) => {
    console.log('Réponse reçue de:', response.config.url, response.status);
    // Si la réponse a un format standard avec data
    if (response.data && response.data.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Amélioration du logging des erreurs pour un meilleur diagnostic
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état hors de la plage 2xx
      console.error('Erreur de réponse:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // Si le token est expiré, déconnecter l'utilisateur
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue (problème de réseau)
      console.error('Erreur de réseau - Aucune réponse reçue:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
      
      // Ajouter un message personnalisé pour ce type d'erreur
      error.userMessage = 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion réseau et l\'état du serveur API.';
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('Erreur de requête:', error.message);
    }
    
    // Ajouter un message convivial si aucun n'est encore défini
    if (!error.userMessage) {
      error.userMessage = error.response?.data?.message || 
                         'Une erreur est survenue lors de la communication avec le serveur';
    }
    
    return Promise.reject(error);
  }
);

// Service d'authentification
const auth = {
  login: (emailOrUsername, password) => {
    // Déterminer si l'entrée est un email ou un nom d'utilisateur
    const isEmail = emailOrUsername.includes('@');
    
    const payload = {
      password: password
    };
    
    if (isEmail) {
      payload.email = emailOrUsername;
    } else {
      payload.username = emailOrUsername;
    }
    
    console.log('Tentative de connexion avec:', payload);
    return instance.post('/auth/login', payload);
  },
  validateToken: () => instance.get('/auth/validate')
};

// Service des utilisateurs
const users = {
  getCurrentUser: () => instance.get('/users/profile'),
  getAll: (page = 1, limit = 10) => instance.get(`/users?page=${page}&limit=${limit}`),
  getById: (id) => instance.get(`/users/${id}`),
  update: (id, userData) => instance.put(`/users/${id}`, userData),
  delete: (id) => instance.delete(`/users/${id}`),
  getRuns: (userId) => instance.get(`/users/${userId}/runs`)
};

// Service des courses
const runs = {
  getAll: (page = 1, limit = 10) => instance.get(`/runs?page=${page}&limit=${limit}`),
  getById: (id) => instance.get(`/runs/${id}`),
  delete: (id) => instance.delete(`/runs/${id}`)
};

// Service des statistiques
const stats = {
  getGlobal: () => instance.get('/admin/stats'),
  getUserActivity: () => instance.get('/admin/user-activity'),
  getUserStats: (userId) => instance.get(`/users/${userId}/stats`),
  getWeeklyStats: () => instance.get('/stats/weekly'),
  getMonthlyStats: (year, month) => instance.get(`/stats/monthly?year=${year}&month=${month}`),
};

// Service des paramètres de l'application
const settings = {
  get: () => instance.get('/settings'),
  update: (settingsData) => instance.put('/settings', settingsData)
};

// Fonction de test réseau pour diagnostiquer les problèmes de connexion
const testConnection = async () => {
  try {
    const response = await instance.get('/health');
    console.log('Test de connexion réussi:', response.data);
    return {
      success: true,
      message: 'Connexion à l\'API établie avec succès',
      data: response.data
    };
  } catch (error) {
    console.error('Test de connexion échoué:', error);
    return {
      success: false,
      message: error.userMessage || 'Échec de la connexion à l\'API',
      error: error
    };
  }
};

export default {
  auth,
  users,
  runs,
  stats,
  settings,
  testConnection,
  instance
};