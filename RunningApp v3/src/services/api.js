// 📱 RunningApp V3 - Services API (COMPLET ET CORRIGÉ)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ CONFIGURATION DEPUIS .ENV OU VALEUR PAR DÉFAUT
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.0.47:5000';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT) || 30000;

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
        // ✅ UTILISE LA CLÉ UNIFIÉE POUR LE REFRESH TOKEN
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          console.log('🔄 Refresh token found, requesting new token...');
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
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

// 🔐 SERVICES D'AUTHENTIFICATION
export const login = async (email, password) => {
  console.log('🔐 Attempting login for:', email);
  try {
    const response = await api.post('/api/auth/login', { email, password });
    console.log('✅ Login successful');
    
    const responseData = response.data;
    
    if (responseData && responseData.data && responseData.data.access_token) {
      const { access_token, user } = responseData.data;
      
      // ✅ UTILISE LES CLÉS UNIFIÉES
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return { access_token, user };
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
  console.log('📝 Attempting registration...');
  try {
    const response = await api.post('/api/auth/register', userData);
    console.log('✅ Registration successful');
    return response.data.data || response.data;
  } catch (error) {
    console.error('🚨 Registration failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur d\'inscription');
  }
};

export const logout = async () => {
  console.log('🚪 Logging out...');
  try {
    await api.post('/api/auth/logout'); // ✅ CORRIGÉ: /api/auth/logout
    console.log('✅ Logout successful');
  } catch (error) {
    console.warn('⚠️ Logout API call failed:', error.message);
  } finally {
    await clearStoredAuth();
  }
};

export const getCurrentUser = async () => {
  console.log('👤 Getting current user...');
  try {
    const response = await api.get('/api/auth/validate');
    console.log('✅ Current user fetched');
    return response.data.data || response.data;
  } catch (error) {
    console.error('🚨 Failed to get current user:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération utilisateur');
  }
};

export const updateProfile = async (userData) => {
  console.log('👤 Updating profile...');
  try {
    const response = await api.put('/api/users/profile', userData);
    console.log('✅ Profile updated');
    
    const updatedUser = response.data.data || response.data;
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    
    return updatedUser;
  } catch (error) {
    console.error('🚨 Failed to update profile:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour du profil');
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

// 🛣️ SERVICES ROUTES - PARCOURS PROPOSÉS
export const getProposedRoutes = async (page = 1, limit = 10) => {
  console.log(`🗺️ Getting proposed routes (page ${page}, limit ${limit})...`);
  try {
    const response = await api.get(`/api/routes?page=${page}&limit=${limit}`);
    console.log('✅ Proposed routes fetched');
    console.log('🔍 Raw response:', response.data);
    
    const responseData = response.data;
    
    // Gestion standardisée de toutes les structures possibles
    let routes = [];
    let pagination = {};
    
    // Structure 1: {status: 'success', data: {routes: [...], pagination: {...}}}
    if (responseData?.status === 'success' && responseData?.data?.routes) {
      routes = responseData.data.routes;
      pagination = responseData.data.pagination || {};
      console.log('📊 Structure API standard détectée');
    }
    // Structure 2: {routes: [...], pagination: {...}}
    else if (responseData?.routes && Array.isArray(responseData.routes)) {
      routes = responseData.routes;
      pagination = responseData.pagination || {};
      console.log('📊 Structure routes directe détectée');
    }
    // Structure 3: {data: {routes: [...]}}
    else if (responseData?.data?.routes && Array.isArray(responseData.data.routes)) {
      routes = responseData.data.routes;
      pagination = responseData.data.pagination || {};
      console.log('📊 Structure data.routes détectée');
    }
    // Structure 4: {data: [...]} (array direct dans data)
    else if (Array.isArray(responseData?.data)) {
      routes = responseData.data;
      pagination = responseData.pagination || {};
      console.log('📊 Structure data array détectée');
    }
    // Structure 5: [...] (array direct)
    else if (Array.isArray(responseData)) {
      routes = responseData;
      pagination = {};
      console.log('📊 Structure array direct détectée');
    }
    // Aucune structure reconnue
    else {
      console.warn('⚠️ Structure de réponse non reconnue:', {
        type: typeof responseData,
        keys: responseData ? Object.keys(responseData) : 'null',
        data: responseData
      });
      routes = [];
      pagination = {};
    }

    console.log(`📊 ${routes.length} routes processed`);
    
    return {
      status: 'success',
      data: routes,
      pagination: pagination
    };
    
    
  } catch (error) {
    console.error('🚨 Get proposed routes failed:', error.response?.data || error.message);
    
    // Gestion d'erreur détaillée
    if (error.response?.status === 401) {
      throw new Error('Session expirée, veuillez vous reconnecter');
    } else if (error.response?.status === 403) {
      throw new Error('Accès non autorisé aux parcours');
    } else if (error.response?.status === 404) {
      throw new Error('Endpoint des parcours non trouvé');
    } else if (error.response?.status >= 500) {
      throw new Error('Erreur serveur, veuillez réessayer plus tard');
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      throw new Error('Erreur de connexion, vérifiez votre réseau');
    } else {
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des parcours');
    }
  }
};

// 🔄 VARIANTE ALTERNATIVE SI L'ENDPOINT EST DIFFÉRENT
export const getProposedRoutesAlt = async () => {
  console.log('🗺️ Getting proposed routes (alternative endpoint)...');
  try {
    // Essayer d'autres endpoints possibles
    const endpoints = [
      '/api/routes/proposed',
      '/api/proposed-routes', 
      '/api/routes/public',
      '/api/routes'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        console.log(`✅ Found routes at: ${endpoint}`);
        return response.data;
      } catch (err) {
        console.log(`❌ Failed endpoint: ${endpoint}`);
        continue;
      }
    }
    
    throw new Error('Aucun endpoint de parcours trouvé');
    
  } catch (error) {
    console.error('🚨 Get proposed routes (alt) failed:', error);
    throw error;
  }
};

// 🏃 SERVICES COURSES - VERSION CORRIGÉE
export const getUserRuns = async (page = 1, limit = 10) => {
  console.log(`📊 Getting user runs (page ${page}, limit ${limit})...`);
  try {
    const response = await api.get(`/api/runs?page=${page}&limit=${limit}`);
    console.log('✅ User runs fetched');
    console.log('🔍 Raw response:', response.data);
    
    const responseData = response.data;
    
    // Gestion standardisée de toutes les structures possibles
    let runs = [];
    let pagination = {};
    
    // Structure 1: {status: 'success', data: {runs: [...], pagination: {...}}}
    if (responseData?.status === 'success' && responseData?.data?.runs) {
      runs = responseData.data.runs;
      pagination = responseData.data.pagination || {};
      console.log('📊 Structure API standard détectée');
    }
    // Structure 2: {runs: [...], pagination: {...}}
    else if (responseData?.runs && Array.isArray(responseData.runs)) {
      runs = responseData.runs;
      pagination = responseData.pagination || {};
      console.log('📊 Structure runs directe détectée');
    }
    // Structure 3: {data: {runs: [...]}}
    else if (responseData?.data?.runs && Array.isArray(responseData.data.runs)) {
      runs = responseData.data.runs;
      pagination = responseData.data.pagination || {};
      console.log('📊 Structure data.runs détectée');
    }
    // Structure 4: {data: [...]} (array direct dans data)
    else if (Array.isArray(responseData?.data)) {
      runs = responseData.data;
      pagination = responseData.pagination || {};
      console.log('📊 Structure data array détectée');
    }
    // Structure 5: [...] (array direct)
    else if (Array.isArray(responseData)) {
      runs = responseData;
      pagination = {};
      console.log('📊 Structure array direct détectée');
    }
    // Aucune structure reconnue
    else {
      console.warn('⚠️ Structure de réponse non reconnue:', {
        type: typeof responseData,
        keys: responseData ? Object.keys(responseData) : [],
        sample: responseData
      });
      runs = [];
      pagination = {};
    }
    
    console.log(`📊 ${runs.length} courses extraites du serveur`);
    
    // Validation des données
    if (!Array.isArray(runs)) {
      console.error('❌ Les runs ne sont pas un tableau:', runs);
      runs = [];
    }
    
    // Retourner toujours la même structure normalisée
    return {
      runs: runs,
      pagination: pagination,
      success: true,
      total: pagination.total || runs.length
    };
    
  } catch (error) {
    console.error('🚨 Failed to get user runs:', error.response?.data || error.message);
    
    // Retourner une structure cohérente même en cas d'erreur
    return {
      runs: [],
      pagination: {},
      success: false,
      error: error.response?.data?.message || error.message || 'Erreur lors de la récupération des courses'
    };
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

// 🗺️ SERVICES PARCOURS
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

// 🔄 ALIAS POUR COMPATIBILITÉ
export const getRunHistory = async (page = 1, limit = 10) => {
  console.log('🔄 getRunHistory appelé - redirection vers getUserRuns');
  return await getUserRuns(page, limit);
};

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

// 📦 EXPORT PAR DÉFAUT
export default {
  // Auth
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  getStoredUser,
  clearStoredAuth,
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
  saveRunLocation,
  // Stats
  getUserStats,
  getStats,
  // Utils
  testConnection,
  checkConnectivity,
  axiosInstance: api,
};