import { API_URL } from '@env';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base de l'API 
const apiUrl = API_URL || 'http://192.168.0.47:5000/api';

// Configuration Axios avec des intercepteurs
const authClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Connexion utilisateur
export const login = async (email, password) => {
  try {
    // Déterminer si l'entrée est un email ou un nom d'utilisateur
    const isEmail = email.includes('@');
    
    const requestData = {
      password: password
    };
    
    if (isEmail) {
      requestData.email = email;
    } else {
      requestData.username = email;
    }
    
    console.log('Données de connexion à envoyer:', requestData);
    
    const response = await authClient.post('/auth/login', requestData);
    
    // Extraire les données selon le format de réponse standard
    const responseData = response.data.data || {};
    
    // Stocker les tokens JWT reçus
    if (responseData.access_token) {
      await AsyncStorage.setItem('authToken', responseData.access_token);
      
      if (responseData.refresh_token) {
        await AsyncStorage.setItem('refreshToken', responseData.refresh_token);
      }
    }
    
    return {
      user: responseData.user,
      token: responseData.access_token,
      refreshToken: responseData.refresh_token
    };
  } catch (error) {
    console.error('Login error:', error);
    
    let errorMessage = 'Erreur de connexion. Veuillez réessayer.';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Identifiants incorrects';
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data && error.response.data.errors) {
        errorMessage = Object.values(error.response.data.errors).join(', ');
      }
    }
    
    throw new Error(errorMessage);
  }
};

// Inscription utilisateur
export const register = async (userData) => {
  try {
    // Préparer les données au format attendu par l'API
    const requestData = {
      username: userData.username || userData.email.split('@')[0], // Créer un nom d'utilisateur par défaut si non fourni
      email: userData.email,
      password: userData.password,
    };
    
    // Ajouter les champs optionnels s'ils sont présents
    if (userData.name) {
      // Diviser le nom complet en prénom et nom de famille si un seul champ "name" est utilisé
      const nameParts = userData.name.split(' ');
      requestData.first_name = nameParts[0];
      if (nameParts.length > 1) {
        requestData.last_name = nameParts.slice(1).join(' ');
      }
    }
    
    // Ajouter directement les champs si déjà formatés correctement
    if (userData.first_name) requestData.first_name = userData.first_name;
    if (userData.last_name) requestData.last_name = userData.last_name;
    if (userData.date_of_birth) requestData.date_of_birth = userData.date_of_birth;
    if (userData.height) requestData.height = parseFloat(userData.height);
    if (userData.weight) requestData.weight = parseFloat(userData.weight);
    
    console.log('Données d\'inscription à envoyer:', requestData);
    
    const response = await authClient.post('/auth/register', requestData);
    
    // Extraire les données selon le format de réponse standard
    const responseData = response.data.data || {};
    
    // Stocker les tokens JWT reçus
    if (responseData.access_token) {
      await AsyncStorage.setItem('authToken', responseData.access_token);
      
      if (responseData.refresh_token) {
        await AsyncStorage.setItem('refreshToken', responseData.refresh_token);
      }
    }
    
    return {
      user: responseData.user,
      token: responseData.access_token,
      refreshToken: responseData.refresh_token
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Erreur d\'inscription. Veuillez réessayer.';
    
    if (error.response) {
      if (error.response.status === 400) {
        // Extraire le message d'erreur spécifique si disponible
        errorMessage = error.response.data.message || 
                      (error.response.data.errors ? Object.values(error.response.data.errors).join(', ') : 
                      'Données d\'inscription invalides');
      } else if (error.response.status === 409) {
        errorMessage = 'Cet email ou nom d\'utilisateur est déjà utilisé';
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }
    
    throw new Error(errorMessage);
  }
};

// Récupération du mot de passe
export const resetPassword = async (email) => {
  try {
    const response = await authClient.post('/auth/reset-password', { email });
    
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error);
    
    let errorMessage = 'Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.';
    
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Récupérer les informations de l'utilisateur courant
export const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    const response = await authClient.get('/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data.data || {};
  } catch (error) {
    console.error('Get current user error:', error);
    
    let errorMessage = 'Erreur lors de la récupération du profil utilisateur.';
    
    if (error.response && error.response.status === 401) {
      // Token invalide ou expiré
      await AsyncStorage.removeItem('authToken');
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
    }
    
    throw new Error(errorMessage);
  }
};

// Mettre à jour le mot de passe
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    const response = await authClient.put(
      '/users/change-password',
      {
        old_password: currentPassword,
        new_password: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Update password error:', error);
    
    let errorMessage = 'Erreur lors de la mise à jour du mot de passe.';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Mot de passe actuel incorrect';
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }
    
    throw new Error(errorMessage);
  }
};

// Vérifier si le token est valide
export const validateToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      return false;
    }
    
    // Vous pouvez utiliser l'endpoint /api/users/profile pour vérifier la validité du token
    // ou utiliser un endpoint dédié s'il existe
    const response = await authClient.get('/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Validate token error:', error);
    return false;
  }
};

// Rafraîchir le token
export const refreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('Token de rafraîchissement non disponible');
    }
    
    const response = await authClient.post('/auth/refresh', {}, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    
    const responseData = response.data.data || {};
    
    if (responseData.access_token) {
      await AsyncStorage.setItem('authToken', responseData.access_token);
      return responseData.access_token;
    }
    
    throw new Error('Impossible de rafraîchir le token');
  } catch (error) {
    console.error('Token refresh error:', error);
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    throw error;
  }
};

// Déconnexion (côté client uniquement - le token JWT doit être invalidé côté serveur)
export const logout = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    // Appeler l'API pour invalider le token côté serveur (si implémenté)
    if (token) {
      try {
        await authClient.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.log('Error with server logout, continuing client logout:', error);
      }
    }
    
    // Suppression des tokens côté client
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Erreur lors de la déconnexion.');
  }
};

export default {
  login,
  register,
  resetPassword,
  getCurrentUser,
  updatePassword,
  validateToken,
  refreshToken,
  logout,
};