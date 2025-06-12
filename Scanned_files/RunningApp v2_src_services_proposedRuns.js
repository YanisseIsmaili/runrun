import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.27.66:5000/api';

const proposedRunsClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token
proposedRunsClient.interceptors.request.use(
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
proposedRunsClient.interceptors.response.use(
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

export const getProposedRuns = async () => {
  try {
    const response = await proposedRunsClient.get('/proposed-runs');
    return response || [];
  } catch (error) {
    console.error('Error fetching proposed runs:', error);
    throw error;
  }
};

export const getProposedRunById = async (runId) => {
  try {
    const response = await proposedRunsClient.get(`/proposed-runs/${runId}`);
    return response || {};
  } catch (error) {
    console.error('Error fetching proposed run details:', error);
    throw error;
  }
};

export const getProposedRunsByDifficulty = async (difficulty) => {
  try {
    const response = await proposedRunsClient.get(`/proposed-runs?difficulty=${difficulty}`);
    return response || [];
  } catch (error) {
    console.error('Error fetching proposed runs by difficulty:', error);
    throw error;
  }
};

export const searchProposedRuns = async (query) => {
  try {
    const response = await proposedRunsClient.get(`/proposed-runs/search?q=${encodeURIComponent(query)}`);
    return response || [];
  } catch (error) {
    console.error('Error searching proposed runs:', error);
    throw error;
  }
};

export default {
  getProposedRuns,
  getProposedRunById,
  getProposedRunsByDifficulty,
  searchProposedRuns
};