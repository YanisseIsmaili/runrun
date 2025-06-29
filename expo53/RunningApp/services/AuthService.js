// services/AuthService.js - VERSION AVEC DEBUGGING
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.27.77:5000/api';

class AuthService {
  async isAuthenticated() {
    console.log('🔵 Checking authentication...');
    
    try {
      const token = await this.getToken();
      console.log('🔑 Token retrieved:', !!token);
      
      if (!token) {
        console.log('❌ No token found');
        return false;
      }

      console.log('🔍 Starting token validation...');
      
      const validateEndpoints = [
        `${API_BASE_URL}/auth/validate`,
        `http://192.168.27.77:5000/auth/validate`,
        `${API_BASE_URL}/validate`,
        `http://192.168.27.77:5000/validate`
      ];

      console.log('📋 Testing endpoints:', validateEndpoints);

      for (let i = 0; i < validateEndpoints.length; i++) {
        const endpoint = validateEndpoints[i];
        console.log(`🌐 [${i+1}/${validateEndpoints.length}] Testing: ${endpoint}`);
        
        try {
          // Timeout de 5 secondes
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          console.log(`📡 Response status: ${response.status} for ${endpoint}`);

          if (response.status !== 404) {
            const data = await response.json();
            console.log('📄 Response data:', data);
            
            const isValid = data.status === 'success' || response.ok;
            console.log('✅ Authentication check completed:', isValid);
            return isValid;
          }
        } catch (error) {
          console.log(`❌ Error with ${endpoint}:`, error.message);
          continue;
        }
      }

      console.log('❌ No validate endpoint found');
      return false;
      
    } catch (error) {
      console.error('💥 Critical error in isAuthenticated:', error);
      return false;
    }
  }

  async getToken() {
    try {
      console.log('🔍 Getting token from storage...');
      const token = await AsyncStorage.getItem('access_token');
      console.log('📱 Token from storage:', token ? 'Found' : 'Not found');
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  }

  async testConnection() {
    console.log('🔵 Testing API connection...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://192.168.27.77:5000/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      console.log('📄 Health check data:', data);
      
      return { success: true, data };
    } catch (error) {
      console.error('🚨 Connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  async login(email, password) {
    console.log('🔵 Login attempt:', email);
    
    const possibleEndpoints = [
      `${API_BASE_URL}/auth/login`,
      `http://192.168.27.77:5000/auth/login`,
      `http://192.168.27.77:5000/login`,
      `${API_BASE_URL}/login`
    ];
    
    for (const endpoint of possibleEndpoints) {
      console.log(`🔗 Trying endpoint: ${endpoint}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`📡 Response status: ${response.status} for ${endpoint}`);
        
        if (response.status !== 404) {
          const data = await response.json();
          console.log('📄 Response data:', data);
          
          if (data.status === 'success' || response.ok) {
            const accessToken = data.data?.access_token || data.access_token;
            const userData = data.data?.user || data.user;
            
            if (accessToken && userData) {
              await AsyncStorage.setItem('access_token', accessToken);
              await AsyncStorage.setItem('user_data', JSON.stringify(userData));
              console.log('✅ Login successful with endpoint:', endpoint);
              return { success: true, data: { access_token: accessToken, user: userData } };
            }
          }
          
          return { success: false, message: data.message || 'Login failed', endpoint };
        }
        
      } catch (error) {
        console.log(`❌ Error with ${endpoint}:`, error.message);
        continue;
      }
    }
    
    return { success: false, message: 'Aucun endpoint d\'authentification trouvé' };
  }

  async register(userData) {
    console.log('🔵 Register attempt:', userData.email);
    
    const possibleEndpoints = [
      `${API_BASE_URL}/auth/register`,
      `http://192.168.27.77:5000/auth/register`,
      `http://192.168.27.77:5000/register`,
      `${API_BASE_URL}/register`
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(userData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        if (response.status !== 404) {
          const data = await response.json();
          
          if (data.status === 'success' || response.ok) {
            const accessToken = data.data?.access_token || data.access_token;
            const user = data.data?.user || data.user;
            
            if (accessToken && user) {
              await AsyncStorage.setItem('access_token', accessToken);
              await AsyncStorage.setItem('user_data', JSON.stringify(user));
              return { success: true, data: { access_token: accessToken, user } };
            }
          }
          
          return { success: false, message: data.message || 'Registration failed' };
        }
      } catch (error) {
        continue;
      }
    }
    
    return { success: false, message: 'Aucun endpoint d\'inscription trouvé' };
  }

  async logout() {
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

  async getUser() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return null;
    }
  }

  // Test simple pour vérifier la connectivité
  async simpleConnectionTest() {
    console.log('🧪 Simple connection test...');
    try {
      const response = await fetch(`http://192.168.27.77:5000/api/health`, {
        method: 'GET',
      });
      console.log('✅ Basic connection OK, status:', response.status);
      return true;
    } catch (error) {
      console.error('❌ Basic connection failed:', error.message);
      return false;
    }
  }
}

export default new AuthService();