// RunningApp v3/src/services/api.js - VERSION CORRIGÉE BASÉE SUR PASTE.TXT
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration depuis .env ou valeur par défaut
const API_URL = process.env.API_BASE_URL || 'http://192.168.0.47:5000';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 30000;

// ✅ CLÉS UNIFIÉES - MÊMES QUE AUTHSERVICE ET AUTHCONTEXT
const STORAGE_KEYS = {
  TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'user_data'
};

// Configuration d'axios
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    // ✅ UTILISE LA CLÉ UNIFIÉE
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
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
        // ✅ UTILISE LA CLÉ UNIFIÉE
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          console.log('🔄 Refresh token found, requesting new token...');
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refreshToken,
          });

          const { token: newToken } = response.data;
          // ✅ STOCKE AVEC LA CLÉ UNIFIÉE
          await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
          console.log('✅ New token obtained and stored');

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          console.log('❌ No refresh token found');
        }
      } catch (refreshError) {
        console.error('🚨 Token refresh failed:', refreshError);
        // ✅ NETTOYAGE AVEC CLÉS UNIFIÉES
        await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
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
    
    // CORRECTION : L'API retourne {data: {access_token, user}, message, status}
    // Structure complète: response.data.data.access_token
    const responseData = response.data;
    
    if (responseData && responseData.data && responseData.data.access_token) {
      return {
        token: responseData.data.access_token,
        user: responseData.data.user,
        message: responseData.message
      };
    } else {
      console.error('🚨 Structure de réponse inattendue:', responseData);
      throw new Error('Format de réponse inattendu du serveur');
    }
  } catch (error) {
    console.error('🚨 Login failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de connexion');
  }
};

export const register = async (userData) => {
  console.log('📝 Register attempt for:', userData.email);
  
  try {
    // Étape 1: D'abord se connecter comme utilisateur normal
    console.log('🔄 Tentative de connexion pour vérifier si l\'utilisateur existe...');
    try {
      await login(userData.email, userData.password);
      throw new Error('Un compte avec cet email existe déjà');
    } catch (loginError) {
      // Si login échoue, l'utilisateur n'existe pas - on continue
      console.log('✅ Utilisateur n\'existe pas, on peut créer le compte');
    }

    // Étape 2: Message temporaire - demander à l'admin de créer le compte
    throw new Error(`Inscription temporairement indisponible.\n\nContactez un administrateur avec ces infos :\n• Email: ${userData.email}\n• Username: ${userData.username}\n• Nom: ${userData.first_name} ${userData.last_name}`);

  } catch (error) {
    console.error('🚨 Registration process failed:', error.message);
    throw error;
  }
};

export const logout = async () => {
  console.log('🔄 Logout attempt...');
  try {
    // Tentative de logout côté serveur
    await api.post('/api/auth/logout');
    console.log('✅ Server logout successful');
  } catch (error) {
    console.warn('⚠️ Server logout failed (route may not exist):', error.message);
    // Continue même si le logout serveur échoue
  }
  
  // ✅ NETTOYAGE LOCAL AVEC CLÉS UNIFIÉES
  await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  console.log('✅ Local cleanup completed');
};

// USER SERVICES - ENDPOINTS CORRIGÉS POUR PROFIL
export const getCurrentUser = async () => {
  console.log('👤 Getting current user...');
  try {
    const response = await api.get('/api/users/profile'); // CORRIGÉ: /users/profile
    console.log('✅ User data fetched');
    
    if (response.data?.status === 'success') {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('🚨 Failed to get current user:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des données utilisateur');
  }
};

export const updateProfile = async (userData) => {
  console.log('👤 Updating user profile...');
  try {
    const response = await api.put('/api/users/profile', userData); // CORRIGÉ: /users/profile
    console.log('✅ Profile updated');
    
    // ✅ MISE À JOUR DU STOCKAGE LOCAL
    const updatedUser = response.data.data || response.data;
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    
    return updatedUser;
  } catch (error) {
    console.error('🚨 Profile update failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
  }
};

// ✅ NOUVELLES FONCTIONS UTILITAIRES POUR LA PERSISTANCE
export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('❌ Error getting stored token:', error);
    return null;
  }
};

export const getStoredUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ Error getting stored user:', error);
    return null;
  }
};

export const clearStoredAuth = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    console.log('✅ All auth data cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

// RUN SERVICES
export const getUserRuns = async (page = 1, limit = 10) => {
  console.log(`📊 Getting user runs (page ${page}, limit ${limit})...`);
  try {
    const response = await api.get(`/api/runs?page=${page}&limit=${limit}`);
    console.log('✅ User runs fetched');
    
    const responseData = response.data;
    
    if (responseData?.runs) {
      console.log('📊 Courses extraites de response.runs');
      console.log(`📊 ${responseData.runs.length} courses reçues du serveur`);
      return responseData;
    } else if (responseData?.data?.runs) {
      console.log('📊 Courses extraites de response.data.runs');
      return responseData;
    } else if (Array.isArray(responseData?.data)) {
      console.log('📊 Courses extraites de response.data (array)');
      return { runs: responseData.data, pagination: {} };
    } else {
      console.log('⚠️ Structure de réponse inattendue:', Object.keys(responseData));
      return { runs: [], pagination: {} };
    }
  } catch (error) {
    console.error('🚨 Failed to get user runs:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des courses');
  }
};

export const createRun = async (runData) => {
  console.log('🏃 Creating new run...');
  try {
    const response = await api.post('/api/runs', runData);
    console.log('✅ Run created successfully');
    return response.data.data || response.data;
  } catch (error) {
    console.error('🚨 Failed to create run:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la création de la course');
  }
};

export const updateRun = async (runId, runData) => {
  console.log(`🏃 Updating run ${runId}...`);
  try {
    const response = await api.put(`/api/runs/${runId}`, runData);
    console.log('✅ Run updated successfully');
    return response.data.data || response.data;
  } catch (error) {
    console.error('🚨 Failed to update run:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la course');
  }
};

export const deleteRun = async (runId) => {
  console.log(`🗑️ Deleting run ${runId}...`);
  try {
    await api.delete(`/api/runs/${runId}`);
    console.log('✅ Run deleted successfully');
    return true;
  } catch (error) {
    console.error('🚨 Failed to delete run:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la course');
  }
};

export const getUserStats = async () => {
  console.log('📈 Getting user statistics...');
  try {
    const response = await api.get('/api/users/stats');
    console.log('✅ User stats fetched');
    return response.data.data || response.data;
  } catch (error) {
    console.error('🚨 Failed to get user stats:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des statistiques');
  }
};

// ROUTE SERVICES
export const getRoutes = async (location = null) => {
  console.log('🗺️ Getting available routes...');
  try {
    const params = location ? `?lat=${location.latitude}&lng=${location.longitude}` : '';
    const response = await api.get(`/api/routes${params}`);
    console.log('✅ Routes fetched');
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('🚨 Failed to get routes:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des parcours');
  }
};

export const saveRunLocation = async (runId, locationData) => {
  console.log(`📍 Saving location for run ${runId}...`);
  try {
    const response = await api.post(`/api/runs/${runId}/locations`, locationData);
    console.log('✅ Location saved');
    return response.data;
  } catch (error) {
    console.error('🚨 Failed to save location:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur lors de la sauvegarde de la position');
  }
};

// ✅ FONCTION DE TEST DE CONNECTIVITÉ
export const testConnection = async () => {
  console.log('🔗 Testing API connection...');
  try {
    const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    console.log('✅ API connection successful');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('🚨 API connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

// LEGACY ALIASES POUR COMPATIBILITÉ
export const getRunHistory = getUserRuns;
export const saveRun = createRun;
export const getRunDetails = async (runId) => {
  try {
    const response = await api.get(`/api/runs/${runId}`);
    return response.data.data || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération');
  }
};

export const getActiveRoutes = async () => {
  try {
    const response = await api.get('/api/routes/active-runs');
    return response.data.data || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération des parcours actifs');
  }
};

export const getStats = getUserStats;
export const checkConnectivity = testConnection;

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
  getUserRuns,
  getRunHistory,
  saveRun,
  createRun,
  deleteRun,
  getRunDetails,
  updateRun,
  // Routes
  getRoutes,
  getActiveRoutes,
  // Stats
  getUserStats,
  getStats,
  // Utils
  testConnection,
  checkConnectivity,
  axiosInstance: api,
};