import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_TIMEOUT } from '@env';

// Configuration de base d'Axios
const api = axios.create({
  baseURL: API_URL || 'http://192.168.1.100:5000/api',
  timeout: API_TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est 401 (non autorisé) et qu'on n'a pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refreshToken,
          });

          const { token: newToken } = response.data;
          await AsyncStorage.setItem('authToken', newToken);

          // Refaire la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Le rafraîchissement a échoué, déconnecter l'utilisateur
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
        // Rediriger vers la page de connexion
        // Navigation sera gérée par AuthContext
      }
    }

    return Promise.reject(error);
  }
);

// Services d'authentification
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de connexion');
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur d\'inscription');
  }
};

export const logout = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération du profil');
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/auth/profile', userData);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour du profil');
  }
};

export const resetPassword = async (email) => {
  try {
    const response = await api.post('/auth/reset-password', { email });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
  }
};

// Services de courses
export const getRunHistory = async (page = 1, limit = 50) => {
  try {
    const response = await api.get(`/runs?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération de l\'historique');
  }
};

export const saveRun = async (runData) => {
  try {
    const response = await api.post('/runs', runData);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de sauvegarde de la course');
  }
};

export const updateRun = async (runId, runData) => {
  try {
    const response = await api.put(`/runs/${runId}`, runData);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour de la course');
  }
};

export const deleteRun = async (runId) => {
  try {
    const response = await api.delete(`/runs/${runId}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de suppression de la course');
  }
};

export const getRunDetails = async (runId) => {
  try {
    const response = await api.get(`/runs/${runId}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération des détails');
  }
};

// Services de statistiques
export const getStats = async (period = 'week') => {
  try {
    const response = await api.get(`/stats?period=${period}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération des statistiques');
  }
};

export const getLeaderboard = async (type = 'distance', period = 'week') => {
  try {
    const response = await api.get(`/leaderboard?type=${type}&period=${period}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération du classement');
  }
};

// Services de parcours proposés
export const getProposedRuns = async (location = null, difficulty = null) => {
  try {
    let url = '/proposed-runs';
    const params = new URLSearchParams();
    
    if (location) {
      params.append('lat', location.latitude);
      params.append('lng', location.longitude);
    }
    if (difficulty) {
      params.append('difficulty', difficulty);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération des parcours');
  }
};

export const getProposedRunDetails = async (runId) => {
  try {
    const response = await api.get(`/proposed-runs/${runId}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération du parcours');
  }
};

export const rateProposedRun = async (runId, rating, comment = '') => {
  try {
    const response = await api.post(`/proposed-runs/${runId}/rate`, {
      rating,
      comment,
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de l\'évaluation');
  }
};

// Services de géolocalisation et météo
export const getNearbyPoints = async (latitude, longitude, radius = 1000) => {
  try {
    const response = await api.get(`/geo/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de géolocalisation');
  }
};

export const getWeather = async (latitude, longitude) => {
  try {
    const response = await api.get(`/weather?lat=${latitude}&lng=${longitude}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur météo');
  }
};

// Services de notifications
export const subscribeToPushNotifications = async (pushToken, deviceInfo) => {
  try {
    const response = await api.post('/notifications/subscribe', {
      pushToken,
      deviceInfo,
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur d\'abonnement aux notifications');
  }
};

export const unsubscribeFromPushNotifications = async (pushToken) => {
  try {
    const response = await api.post('/notifications/unsubscribe', {
      pushToken,
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de désabonnement aux notifications');
  }
};

// Services d'objectifs
export const getGoals = async () => {
  try {
    const response = await api.get('/goals');
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération des objectifs');
  }
};

export const createGoal = async (goalData) => {
  try {
    const response = await api.post('/goals', goalData);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de création d\'objectif');
  }
};

export const updateGoal = async (goalId, goalData) => {
  try {
    const response = await api.put(`/goals/${goalId}`, goalData);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour d\'objectif');
  }
};

export const deleteGoal = async (goalId) => {
  try {
    const response = await api.delete(`/goals/${goalId}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de suppression d\'objectif');
  }
};

// Services sociaux
export const getFriends = async () => {
  try {
    const response = await api.get('/social/friends');
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de récupération des amis');
  }
};

export const sendFriendRequest = async (userId) => {
  try {
    const response = await api.post(`/social/friend-request/${userId}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur d\'envoi de demande d\'ami');
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await api.post(`/social/friend-request/${requestId}/accept`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur d\'acceptation de demande d\'ami');
  }
};

export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await api.post(`/social/friend-request/${requestId}/reject`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de refus de demande d\'ami');
  }
};

// Services de synchronisation offline
export const syncOfflineData = async () => {
  try {
    // Récupérer les données offline
    const offlineRuns = await AsyncStorage.getItem('offlineRuns');
    const pendingUploads = offlineRuns ? JSON.parse(offlineRuns) : [];

    const results = [];
    
    // Synchroniser chaque course
    for (const run of pendingUploads) {
      try {
        const response = await saveRun(run);
        results.push({ success: true, runId: run.id, serverResponse: response });
      } catch (error) {
        results.push({ success: false, runId: run.id, error: error.message });
      }
    }

    // Nettoyer les données synchronisées avec succès
    const failedUploads = pendingUploads.filter((run, index) => !results[index].success);
    await AsyncStorage.setItem('offlineRuns', JSON.stringify(failedUploads));

    return results;
  } catch (error) {
    throw new Error('Erreur de synchronisation des données offline');
  }
};

// Utilitaires
export const checkConnectivity = async () => {
  try {
    const response = await api.get('/health');
    return { online: true, response };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

export const getAppVersion = async () => {
  try {
    const response = await api.get('/version');
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur de vérification de version');
  }
};

// Export de l'instance axios pour usage avancé
export { api as axiosInstance };