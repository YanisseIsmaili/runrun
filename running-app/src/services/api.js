import { API_URL } from '@env';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base de l'API 
const apiUrl = API_URL || 'http://192.168.27.77:5000/api';

// Configuration Axios avec des intercepteurs
const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Ajouter le token aux requêtes
apiClient.interceptors.request.use(
  async (config) => {
    // Si un token est explicitement passé dans config, l'utiliser
    if (config.token) {
      config.headers.Authorization = `Bearer ${config.token}`;
    } 
    // Sinon, essayer de récupérer le token depuis AsyncStorage
    else {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error retrieving auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepter les réponses pour gérer les erreurs 
apiClient.interceptors.response.use(
  (response) => {
    // Si la réponse contient des données dans le format standard de l'API
    if (response.data && response.data.data) {
      return response.data;
    }
    return response;
  },
  async (error) => {
    // Gérer les erreurs communes ici
    if (error.response) {
      // Erreur du serveur (4xx, 5xx)
      console.error('API Error:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        // Token expiré ou invalide - essayer de rafraîchir le token
        const originalRequest = error.config;
        
        // Éviter les boucles infinies
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              // Appeler l'endpoint de rafraîchissement
              const response = await axios.post(`${apiUrl}/auth/refresh`, {}, {
                headers: {
                  'Authorization': `Bearer ${refreshToken}`
                }
              });
              
              // Si on obtient un nouveau token
              if (response.data && response.data.data && response.data.data.access_token) {
                const newToken = response.data.data.access_token;
                
                // Stocker le nouveau token
                await AsyncStorage.setItem('authToken', newToken);
                
                // Configurer la nouvelle requête avec le nouveau token
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                
                // Réessayer la requête originale
                return axios(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            
            // Si le rafraîchissement échoue, déconnecter l'utilisateur
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('refreshToken');
          }
        }
      }
    } else if (error.request) {
      // La requête a été faite mais pas de réponse
      console.error('API No Response:', error.request);
    } else {
      // Erreur lors de la préparation de la requête
      console.error('API Request Error:', error.message);
    }
    
    // Extraire le message d'erreur si disponible
    let errorMessage = 'Une erreur est survenue';
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || (error.response.data.errors ? Object.values(error.response.data.errors).join(', ') : errorMessage);
    }
    
    error.userMessage = errorMessage;
    return Promise.reject(error);
  }
);

// Récupérer l'historique des courses
export const getRunHistory = async () => {
  try {
    const response = await apiClient.get('/runs');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching run history:', error);
    throw new Error(error.userMessage || 'Impossible de récupérer l\'historique des courses');
  }
};

// Enregistrer une nouvelle course
export const saveRun = async (runData) => {
  try {
    const response = await apiClient.post('/runs', runData);
    return response.data || {};
  } catch (error) {
    console.error('Error saving run:', error);
    throw new Error(error.userMessage || 'Impossible d\'enregistrer la course');
  }
};

// Récupérer les détails d'une course
export const getRunDetails = async (runId) => {
  try {
    const response = await apiClient.get(`/runs/${runId}`);
    return response.data || {};
  } catch (error) {
    console.error('Error fetching run details:', error);
    throw new Error(error.userMessage || 'Impossible de récupérer les détails de la course');
  }
};

// Supprimer une course
export const deleteRun = async (runId) => {
  try {
    const response = await apiClient.delete(`/runs/${runId}`);
    return response.status === 204; // Success with No Content
  } catch (error) {
    console.error('Error deleting run:', error);
    throw new Error(error.userMessage || 'Impossible de supprimer la course');
  }
};

// Mettre à jour une course
export const updateRun = async (runId, runData) => {
  try {
    const response = await apiClient.put(`/runs/${runId}`, runData);
    return response.data || {};
  } catch (error) {
    console.error('Error updating run:', error);
    throw new Error(error.userMessage || 'Impossible de mettre à jour la course');
  }
};

// Récupérer les statistiques globales
export const getGlobalStats = async () => {
  try {
    const response = await apiClient.get('/stats');
    return response.data || {};
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw new Error(error.userMessage || 'Impossible de récupérer les statistiques');
  }
};

// Récupérer les statistiques pour une période
export const getPeriodStats = async (startDate, endDate) => {
  try {
    const response = await apiClient.get('/stats/period', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data || {};
  } catch (error) {
    console.error('Error fetching period stats:', error);
    throw new Error(error.userMessage || 'Impossible de récupérer les statistiques pour cette période');
  }
};

// Récupérer l'évolution des statistiques
export const getStatsEvolution = async (grouping = 'weekly') => {
  try {
    const response = await apiClient.get('/stats/evolution', {
      params: { grouping }
    });
    return response.data || {};
  } catch (error) {
    console.error('Error fetching stats evolution:', error);
    throw new Error(error.userMessage || 'Impossible de récupérer l\'évolution des statistiques');
  }
};

// Récupérer les exercices recommandés
export const getRecommendedExercises = async () => {
  try {
    const response = await apiClient.get('/exercises/recommended');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching recommended exercises:', error);
    throw new Error(error.userMessage || 'Impossible de récupérer les exercices recommandés');
  }
};

// Mettre à jour le profil utilisateur
export const updateUserProfile = async (userData) => {
  try {
    const response = await apiClient.put('/users/profile', userData);
    return response.data || {};
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(error.userMessage || 'Impossible de mettre à jour le profil');
  }
};

// Charger une image de profil
export const uploadProfileImage = async (imageUri) => {
  try {
    // Créer un FormData pour l'upload d'image
    const formData = new FormData();
    
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';
    
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    });
    
    const response = await apiClient.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data || {};
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error(error.userMessage || 'Impossible de télécharger l\'image de profil');
  }
};

// Vérifier la santé de l'API
export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${apiUrl}/health`);
    return response.data || { status: 'success' };
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error' };
  }
};

export default {
  apiClient,
  getRunHistory,
  saveRun,
  getRunDetails,
  deleteRun,
  updateRun,
  getGlobalStats,
  getPeriodStats,
  getStatsEvolution,
  getRecommendedExercises,
  updateUserProfile,
  uploadProfileImage,
  checkApiHealth
};