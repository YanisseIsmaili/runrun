import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.27.66:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses
apiClient.interceptors.response.use(
  (response) => {
    return response.data?.data || response.data || response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    }
    
    let errorMessage = 'Une erreur est survenue';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      errorMessage = Object.values(error.response.data.errors).join(', ');
    }
    
    throw new Error(errorMessage);
  }
);

export const getRunHistory = async () => {
  try {
    const response = await apiClient.get('/runs');
    return response || [];
  } catch (error) {
    console.error('Error fetching run history:', error);
    throw error;
  }
};

export const saveRun = async (runData) => {
  try {
    const response = await apiClient.post('/runs', runData);
    return response || {};
  } catch (error) {
    console.error('Error saving run:', error);
    throw error;
  }
};

export const getRunDetails = async (runId) => {
  try {
    const response = await apiClient.get(`/runs/${runId}`);
    return response || {};
  } catch (error) {
    console.error('Error fetching run details:', error);
    throw error;
  }
};

export const deleteRun = async (runId) => {
  try {
    await apiClient.delete(`/runs/${runId}`);
    return true;
  } catch (error) {
    console.error('Error deleting run:', error);
    throw error;
  }
};

export const updateRun = async (runId, runData) => {
  try {
    const response = await apiClient.put(`/runs/${runId}`, runData);
    return response || {};
  } catch (error) {
    console.error('Error updating run:', error);
    throw error;
  }
};

export const getGlobalStats = async () => {
  try {
    const response = await apiClient.get('/stats');
    return response || {};
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await apiClient.put('/users/profile', userData);
    return response || {};
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (imageUri) => {
  try {
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
    
    return response || {};
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
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
  updateUserProfile,
  uploadProfileImage,
  checkApiHealth
};