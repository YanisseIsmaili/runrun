import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_TIMEOUT } from '@env';

console.log('🔧 API Service initialized');
console.log('📡 API_URL:', API_URL);
console.log('⏱️  API_TIMEOUT:', API_TIMEOUT, 'type:', typeof API_TIMEOUT);

// Configuration de base d'Axios
const api = axios.create({
  baseURL: API_URL || 'http://192.168.27.66:5000/api',
  timeout: parseInt(API_TIMEOUT) || 15000, // Convertir en nombre
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🚀 Axios instance created with baseURL:', api.defaults.baseURL);
console.log('⏱️  Timeout configured:', api.defaults.timeout);

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    console.log('📤 Request interceptor - URL:', config.url);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Token added to request:', token.substring(0, 20) + '...');
      } else {
        console.log('❌ No token found in storage');
      }
    } catch (error) {
      console.error('🚨 Error getting token:', error);
    }
    console.log('📤 Final request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('🚨 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response received:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response.data;
  },
  async (error) => {
    console.error('🚨 Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 Attempting token refresh...');
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
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    console.log('✅ Login successful:', response);
    return response;
  } catch (error) {
    console.error('🚨 Login failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de connexion');
  }
};

export const register = async (userData) => {
  console.log('📝 Register attempt for:', userData.email);
  try {
    const response = await api.post('/auth/register', userData);
    console.log('✅ Registration successful:', response);
    return response;
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
      await api.post('/auth/logout', { refreshToken });
      console.log('✅ Logout successful');
    }
  } catch (error) {
    console.error('🚨 Logout error:', error);
  }
};

export const getCurrentUser = async () => {
  console.log('👤 Getting current user');
  try {
    const response = await api.get('/auth/me');
    console.log('✅ User data retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get user failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération du profil');
  }
};

export const updateProfile = async (userData) => {
  console.log('📝 Updating profile for:', userData);
  try {
    const response = await api.put('/auth/profile', userData);
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
    const response = await api.get(`/runs?page=${page}&limit=${limit}`);
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
    const response = await api.post('/runs', runData);
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
    const response = await api.delete(`/runs/${runId}`);
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
    const response = await api.get(`/runs/${runId}`);
    console.log('✅ Run details retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get run details failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des détails');
  }
};

// Services de statistiques
export const getStats = async (period = 'week') => {
  console.log('📊 Getting stats for period:', period);
  try {
    const response = await api.get(`/stats?period=${period}`);
    console.log('✅ Stats retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get stats failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des statistiques');
  }
};

// Services de parcours proposés
export const getProposedRuns = async () => {
  console.log('🗺️ Getting proposed runs');
  try {
    const response = await api.get('/proposed-runs');
    console.log('✅ Proposed runs retrieved:', response);
    return response;
  } catch (error) {
    console.error('🚨 Get proposed runs failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des parcours');
  }
};

export const checkConnectivity = async () => {
  console.log('🌐 Checking connectivity');
  try {
    const response = await api.get('/health');
    console.log('✅ Connectivity check successful:', response);
    return { online: true, response };
  } catch (error) {
    console.error('🚨 Connectivity check failed:', error.message);
    return { online: false, error: error.message };
  }
};

export { api as axiosInstance };