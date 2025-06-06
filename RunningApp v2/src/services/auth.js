import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration par défaut de l'API
const API_BASE_URL = 'http://192.168.27.66:5000/api';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token aux requêtes
authClient.interceptors.request.use(
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

// Intercepteur pour gérer les réponses et erreurs
authClient.interceptors.response.use(
  (response) => {
    return response.data.data || response.data || response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, déconnecter l'utilisateur
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    }
    
    let errorMessage = 'Une erreur est survenue';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      errorMessage = Object.values(error.response.data.errors).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
);

export const login = async (email, password) => {
  try {
    const requestData = {
      password: password
    };
    
    // Déterminer si c'est un email ou un nom d'utilisateur
    if (email.includes('@')) {
      requestData.email = email;
    } else {
      requestData.username = email;
    }
    
    const response = await authClient.post('/auth/login', requestData);
    
    // Stocker les tokens
    if (response.access_token) {
      await AsyncStorage.setItem('authToken', response.access_token);
      
      if (response.refresh_token) {
        await AsyncStorage.setItem('refreshToken', response.refresh_token);
      }
    }
    
    return {
      user: response.user,
      token: response.access_token,
      refreshToken: response.refresh_token
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const requestData = {
      username: userData.username || userData.email.split('@')[0],
      email: userData.email,
      password: userData.password,
    };
    
    if (userData.name) {
      const nameParts = userData.name.split(' ');
      requestData.first_name = nameParts[0];
      if (nameParts.length > 1) {
        requestData.last_name = nameParts.slice(1).join(' ');
      }
    }
    
    if (userData.first_name) requestData.first_name = userData.first_name;
    if (userData.last_name) requestData.last_name = userData.last_name;
    if (userData.date_of_birth) requestData.date_of_birth = userData.date_of_birth;
    if (userData.height) requestData.height = parseFloat(userData.height);
    if (userData.weight) requestData.weight = parseFloat(userData.weight);
    
    const response = await authClient.post('/auth/register', requestData);
    
    // Stocker les tokens
    if (response.access_token) {
      await AsyncStorage.setItem('authToken', response.access_token);
      
      if (response.refresh_token) {
        await AsyncStorage.setItem('refreshToken', response.refresh_token);
      }
    }
    
    return {
      user: response.user,
      token: response.access_token,
      refreshToken: response.refresh_token
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    const response = await authClient.post('/auth/reset-password', { email });
    return response;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    const response = await authClient.get('/users/profile');
    return response;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await authClient.put('/users/change-password', {
      old_password: currentPassword,
      new_password: newPassword,
    });
    return response;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (token) {
      try {
        await authClient.post('/auth/logout');
      } catch (error) {
        console.log('Server logout failed, continuing with client logout');
      }
    }
    
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export default {
  login,
  register,
  resetPassword,
  getCurrentUser,
  updatePassword,
  logout,
};