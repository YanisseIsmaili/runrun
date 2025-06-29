// services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.27.77:5000/api';

class AuthService {
  async login(email, password) {
    console.log('🔵 Login attempt:', email);
    console.log('🔗 API URL:', `${API_BASE_URL}/auth/login`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        console.log('❌ Response not OK:', response.status, response.statusText);
      }

      const data = await response.json();
      console.log('📄 Response data:', data);
      
      if (data.status === 'success') {
        await AsyncStorage.setItem('access_token', data.data.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.data.user));
        console.log('✅ Token saved successfully');
        return { success: true, data: data.data };
      } else {
        console.log('❌ Login failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('🚨 Network error:', error);
      return { success: false, message: 'Erreur de connexion au serveur: ' + error.message };
    }
  }

  async register(userData) {
    console.log('🔵 Register attempt:', userData.email);
    console.log('🔗 API URL:', `${API_BASE_URL}/auth/register`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📄 Response data:', data);
      
      if (data.status === 'success') {
        await AsyncStorage.setItem('access_token', data.data.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.data.user));
        console.log('✅ Registration successful');
        return { success: true, data: data.data };
      } else {
        console.log('❌ Registration failed:', data.message);
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error('🚨 Network error:', error);
      return { success: false, message: 'Erreur de connexion au serveur: ' + error.message };
    }
  }

  async logout() {
    console.log('🔵 Logout attempt');
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_data');
      console.log('✅ Logout successful');
      return true;
    } catch (error) {
      console.error('❌ Logout error:', error);
      return false;
    }
  }

  async getToken() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log('🔑 Token retrieved:', token ? 'Present' : 'Not found');
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  }

  async getUser() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const user = userData ? JSON.parse(userData) : null;
      console.log('👤 User retrieved:', user ? user.username : 'Not found');
      return user;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return null;
    }
  }

  async isAuthenticated() {
    console.log('🔵 Checking authentication...');
    const token = await this.getToken();
    if (!token) {
      console.log('❌ No token found');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Validation response:', response.status);
      const data = await response.json();
      console.log('📄 Validation data:', data);
      
      const isValid = data.status === 'success';
      console.log('✅ Authentication valid:', isValid);
      return isValid;
    } catch (error) {
      console.error('🚨 Validation error:', error);
      return false;
    }
  }

  async refreshToken() {
    console.log('🔵 Refreshing token...');
    try {
      const token = await this.getToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        await AsyncStorage.setItem('access_token', data.data.access_token);
        console.log('✅ Token refreshed');
        return true;
      }
      console.log('❌ Token refresh failed');
      return false;
    } catch (error) {
      console.error('🚨 Refresh error:', error);
      return false;
    }
  }

  async testConnection() {
    console.log('🔵 Testing API connection...');
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Health check status:', response.status);
      const data = await response.json();
      console.log('📄 Health check data:', data);
      
      return { success: true, data };
    } catch (error) {
      console.error('🚨 Connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService();