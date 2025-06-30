// RunningApp v3/src/services/api.js - VERSION CORRIGÉE
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de base
const API_BASE_URL = 'http://192.168.27.77:5000';

// Instance axios configurée
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token ajouté à la requête');
      }
    } catch (error) {
      console.error('🚨 Erreur récupération token:', error);
    }
    
    console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await AsyncStorage.removeItem('authToken');
        console.log('🔓 Token expiré, suppression automatique');
      } catch (storageError) {
        console.error('🚨 Erreur suppression token:', storageError);
      }
    }
    
    console.error(`❌ ${error.response?.status || 'Network'} ${originalRequest?.url}:`, 
                  error.response?.data?.message || error.message);
    
    return Promise.reject(error);
  }
);

// AUTH SERVICES
export const login = async (emailOrUsername, password) => {
  console.log('🔐 Login attempt for:', emailOrUsername);
  try {
    const payload = { password };
    if (emailOrUsername.includes('@')) {
      payload.email = emailOrUsername;
    } else {
      payload.username = emailOrUsername;
    }
    
    const response = await api.post('/api/auth/login', payload);
    console.log('✅ Login successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🚨 Login failed:', error.response?.data || error.message);
    throw error;
  }
};

export const register = async (userData) => {
  console.log('📝 Register attempt for:', userData.email);
  try {
    const response = await api.post('/api/auth/register', userData);
    console.log('✅ Register successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🚨 Register failed:', error.response?.data || error.message);
    throw error;
  }
};

export const logout = async () => {
  console.log('👋 Logout process started');
  try {
    await api.post('/api/auth/logout');
    console.log('✅ Server logout successful');
  } catch (error) {
    console.warn('⚠️ Server logout failed:', error.response?.data?.message || error.message);
  }
};

// USER SERVICES - ENDPOINTS CORRIGÉS
export const getCurrentUser = async () => {
  console.log('👤 Getting current user');
  try {
    const response = await api.get('/api/users/profile'); // CORRIGÉ: /users/ au lieu de /auth/
    console.log('✅ Current user retrieved:', response.data);
    
    if (response.data?.status === 'success') {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('🚨 Get current user failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération du profil utilisateur');
  }
};

export const updateProfile = async (profileData) => {
  console.log('👤 Updating profile');
  try {
    const response = await api.put('/api/users/profile', profileData); // CORRIGÉ: /users/ au lieu de /auth/
    console.log('✅ Profile updated:', response.data);
    
    if (response.data?.status === 'success') {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('🚨 Update profile failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour du profil');
  }
};

// RUN SERVICES
export const getRunHistory = async (limit = 20, offset = 0) => {
  console.log('🏃 Getting run history');
  try {
    const response = await api.get(`/api/runs?limit=${limit}&offset=${offset}`);
    console.log('✅ Run history retrieved:', response.data);
    
    const responseData = response.data;
    
    if (responseData?.runs) {
      console.log('📊 Courses extraites de response.runs');
      console.log(`📊 ${responseData.runs.length} courses reçues du serveur`);
      return responseData.runs;
    } else if (responseData?.data?.runs) {
      console.log('📊 Courses extraites de response.data.runs');
      console.log(`📊 ${responseData.data.runs.length} courses reçues du serveur`);
      return responseData.data.runs;
    } else if (Array.isArray(responseData?.data)) {
      console.log('📊 Courses extraites de response.data (array)');
      console.log(`📊 ${responseData.data.length} courses reçues du serveur`);
      return responseData.data;
    } else if (Array.isArray(responseData)) {
      console.log('📊 Courses extraites directement de response');
      console.log(`📊 ${responseData.length} courses reçues du serveur`);
      return responseData;
    } else {
      console.log('⚠️ Structure de réponse inattendue:', Object.keys(responseData));
      return [];
    }
  } catch (error) {
    console.error('🚨 Get run history failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération de l\'historique');
  }
};

export const saveRun = async (runData) => {
  console.log('💾 Saving run');
  try {
    const response = await api.post('/api/runs', runData);
    console.log('✅ Run saved:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🚨 Save run failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de sauvegarde de la course');
  }
};

export const deleteRun = async (runId) => {
  console.log('🗑️ Deleting run:', runId);
  try {
    const response = await api.delete(`/api/runs/${runId}`);
    console.log('✅ Run deleted:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🚨 Delete run failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de suppression de la course');
  }
};

export const getRunDetails = async (runId) => {
  console.log('📋 Getting run details:', runId);
  try {
    const response = await api.get(`/api/runs/${runId}`);
    console.log('✅ Run details retrieved:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🚨 Get run details failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des détails de la course');
  }
};

// ROUTE SERVICES
export const getRoutes = async (params = {}) => {
  console.log('🗺️ Getting routes');
  try {
    const queryParams = new URLSearchParams(params);
    const url = Object.keys(params).length > 0 ? 
      `/api/routes?${queryParams.toString()}` : '/api/routes';
    const response = await api.get(url);
    
    console.log('✅ Routes retrieved:', response.data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('🚨 Get routes failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des parcours');
  }
};

export const getRouteDetails = async (routeId) => {
  console.log('📋 Getting route details:', routeId);
  try {
    const response = await api.get(`/api/routes/${routeId}`);
    console.log('✅ Route details retrieved:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🚨 Get route details failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des détails du parcours');
  }
};

export const getActiveRoutes = async () => {
  console.log('🏃 Getting active routes');
  try {
    const response = await api.get('/api/routes/active-runs');
    console.log('✅ Active routes retrieved:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🚨 Get active routes failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des parcours actifs');
  }
};

// STATS SERVICES
export const getStats = async (period = 'week') => {
  console.log('📊 Getting stats for period:', period);
  try {
    const response = await api.get(`/api/stats?period=${period}`);
    console.log('✅ Stats retrieved:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🚨 Get stats failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des statistiques');
  }
};

// CONNECTIVITY SERVICE
export const checkConnectivity = async () => {
  console.log('🌐 Checking connectivity');
  try {
    const response = await api.get('/api/health');
    console.log('✅ Connectivity check successful:', response.data);
    return { online: true, response: response.data };
  } catch (error) {
    console.error('🚨 Connectivity check failed:', error.message);
    return { online: false, error: error.message };
  }
};


// Export de l'instance axios pour accès direct si nécessaire
export { api as axiosInstance };

// Export par défaut pour compatibilité
export default {
  // Auth
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  // Runs
  getRunHistory,
  saveRun,
  deleteRun,
  getRunDetails,
  // Routes
  getRoutes,
  getRouteDetails,
  getActiveRoutes,
  // Stats
  getStats,
  // Utils
  checkConnectivity,
  axiosInstance: api,
};