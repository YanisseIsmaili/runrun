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
  console.log('👋 Logout process started');
  try {
    // Tentative de logout côté serveur (optionnel)
    await api.post('/api/auth/logout');
    console.log('✅ Server logout successful');
  } catch (error) {
    // Si la route n'existe pas (404) ou autre erreur, on continue le logout local
    console.warn('⚠️ Server logout failed (route may not exist):', error.response?.data?.message || error.message);
    // Ne pas throw ici car on veut quand même nettoyer les tokens locaux
  }
};

export const getCurrentUser = async () => {
  console.log('👤 Getting current user');
  try {
    const response = await api.get('/api/auth/validate');
    console.log('✅ Current user retrieved:', response);
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else if (responseData && responseData.user) {
      return responseData.user;
    } else {
      return responseData;
    }
  } catch (error) {
    console.error('🚨 Get current user failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération du profil utilisateur');
  }
};

export const updateProfile = async (profileData) => {
  console.log('👤 Updating profile');
  try {
    const response = await api.put('/api/auth/profile', profileData);
    console.log('✅ Profile updated:', response);
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else {
      return responseData;
    }
  } catch (error) {
    console.error('🚨 Update profile failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour du profil');
  }
};

// Services de courses
export const getRunHistory = async (limit = 20, offset = 0) => {
  console.log('🏃 Getting run history');
  try {
    const response = await api.get(`/api/runs?limit=${limit}&offset=${offset}`);
    console.log('✅ Run history retrieved:', response);
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else {
      return responseData;
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
    console.log('✅ Run saved:', response);
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else {
      return responseData;
    }
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
    console.log('✅ Run details retrieved:', response);
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else {
      return responseData;
    }
  } catch (error) {
    console.error('🚨 Get run details failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de récupération des détails de la course');
  }
};

// Services de parcours/routes
export const getRoutes = async (params = {}) => {
  console.log('🗺️ Getting routes');
  try {
    const queryParams = new URLSearchParams(params);
    const url = Object.keys(params).length > 0 ? `/api/routes?${queryParams.toString()}` : '/api/routes';
    const response = await api.get(url);
    
    console.log('✅ Routes retrieved:', response);
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else {
      return responseData;
    }
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
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else {
      return responseData;
    }
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
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else {
      return responseData;
    }
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
    
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      return responseData.data;
    } else {
      return responseData;
    }
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