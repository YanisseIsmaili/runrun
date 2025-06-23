import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.47:5000'; // Ajustez selon votre config

// Configuration d'axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token ajouté à la requête');
    }
    console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🚨 Erreur intercepteur requête:', error);
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
    
    console.error(`❌ ${error.response?.status || 'NETWORK'} ${error.config?.url}:`, 
                  error.response?.data?.message || error.message);

    // Gestion du token expiré (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('🔄 Refresh token found, requesting new token...');
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refreshToken,
          });

          const { token: newToken } = response.data;
          await AsyncStorage.setItem('authToken', newToken);
          console.log('✅ New token obtained and stored');

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          console.log('❌ No refresh token found');
        }
      } catch (refreshError) {
        console.error('🚨 Token refresh failed:', refreshError);
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
      }
    }

    return Promise.reject(error);
  }
);

// Services d'authentification
export const login = async (email, password) => {
  console.log('🔐 Login attempt for:', email);
  try {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    console.log('✅ Login successful:', response);
    
    // L'API retourne {data: {access_token, user}, message, status}
    return {
      token: response.data.access_token,
      user: response.data.user,
      message: response.message
    };
  } catch (error) {
    console.error('🚨 Login failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de connexion');
  }
};

export const register = async (userData) => {
  console.log('📝 Register attempt for:', userData.email);
  try {
    const response = await api.post('/api/auth/register', userData);
    console.log('✅ Registration successful:', response);
    return {
      token: response.data.access_token,
      user: response.data.user,
      message: response.message
    };
  } catch (error) {
    console.error('🚨 Registration failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur d\'inscription');
  }
};

export const logout = async () => {
  console.log('👋 Logout attempt');
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/api/auth/logout', { refreshToken });
      console.log('✅ Logout successful');
    }
  } catch (error) {
    console.error('🚨 Logout error:', error);
  }
};

export const getCurrentUser = async () => {
  console.log('👤 Getting current user');
  try {
    const response = await api.get('/api/auth/validate');
    console.log('✅ User data retrieved:', response);
    return response.data.user;
  } catch (error) {
    console.error('🚨 Get user failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération du profil');
  }
};

export const updateProfile = async (userData) => {
  console.log('📝 Updating profile for:', userData);
  try {
    const response = await api.put('/api/auth/profile', userData);
    console.log('✅ Profile updated:', response);
    return response;
  } catch (error) {
    console.error('🚨 Profile update failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour du profil');
  }
};

// Services de courses
export const getRunHistory = async (page = 1, limit = 50) => {
  console.log('🏃 Getting run history - page:', page, 'limit:', limit);
  try {
    const response = await api.get(`/api/runs?page=${page}&limit=${limit}`);
    console.log('✅ Run history retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get run history failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération de l\'historique');
  }
};

export const saveRun = async (runData) => {
  console.log('💾 Saving run:', runData);
  try {
    const response = await api.post('/api/runs', runData);
    console.log('✅ Run saved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Save run failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de sauvegarde de la course');
  }
};

export const deleteRun = async (runId) => {
  console.log('🗑️ Deleting run:', runId);
  try {
    const response = await api.delete(`/api/runs/${runId}`);
    console.log('✅ Run deleted:', response);
    return response;
  } catch (error) {
    console.error('🚨 Delete run failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de suppression de la course');
  }
};

export const getRunDetails = async (runId) => {
  console.log('📋 Getting run details:', runId);
  try {
    const response = await api.get(`/api/runs/${runId}`);
    console.log('✅ Run details retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get run details failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des détails');
  }
};

// Services de parcours proposés (NOUVELLES FONCTIONS)
export const getRoutes = async (params = {}) => {
  console.log('🗺️ Getting routes with params:', params);
  try {
    const queryParams = new URLSearchParams();
    
    // Ajouter les paramètres de pagination
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    
    const url = `/api/routes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(url);
    
    console.log('✅ Routes retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get routes failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des parcours');
  }
};

export const getRouteDetails = async (routeId) => {
  console.log('📋 Getting route details:', routeId);
  try {
    const response = await api.get(`/api/routes/${routeId}`);
    console.log('✅ Route details retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get route details failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des détails du parcours');
  }
};

export const getActiveRoutes = async () => {
  console.log('🏃 Getting active routes');
  try {
    const response = await api.get('/api/routes/active-runs');
    console.log('✅ Active routes retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get active routes failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des parcours actifs');
  }
};

// Services de statistiques
export const getStats = async (period = 'week') => {
  console.log('📊 Getting stats for period:', period);
  try {
    const response = await api.get(`/api/stats?period=${period}`);
    console.log('✅ Stats retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get stats failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des statistiques');
  }
};

// Service de connectivité
export const checkConnectivity = async () => {
  console.log('🌐 Checking connectivity');
  try {
    const response = await api.get('/api/health');
    console.log('✅ Connectivity check successful:', response);
    return { online: true, response };
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
  // Routes (NOUVEAU)
  getRoutes,
  getRouteDetails,
  getActiveRoutes,
  // Stats
  getStats,
  // Utils
  checkConnectivity,
  axiosInstance: api,
};