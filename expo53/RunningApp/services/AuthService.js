import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.27.77:5000';

class AuthService {
  static async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_or_username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        await AsyncStorage.setItem('access_token', data.data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        console.log('👤 User retrieved:', data.data.user.username);
        
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Erreur de connexion'
        };
      }
    } catch (error) {
      console.error('Erreur login:', error);
      return {
        success: false,
        message: 'Erreur réseau - serveur indisponible'
      };
    }
  }

  static async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        await AsyncStorage.setItem('access_token', data.data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Erreur d\'inscription'
        };
      }
    } catch (error) {
      console.error('Erreur register:', error);
      return {
        success: false,
        message: 'Erreur réseau - serveur indisponible'
      };
    }
  }

  static async logout() {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Erreur logout:', error);
      return { success: false };
    }
  }

  static async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  static async getUser() {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  }

  static async getToken() {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      return null;
    }
  }

  // Test de connectivité API (pas de données fictives)
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          status: data.status,
          database: data.database
        };
      }
      
      return {
        success: false,
        message: `Serveur répond avec status ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Serveur inaccessible'
      };
    }
  }
}

export default AuthService;