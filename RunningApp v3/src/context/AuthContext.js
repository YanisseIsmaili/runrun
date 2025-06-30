import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    console.log('🔍 Checking login status...');
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔐 Token from storage:', token ? 'Token found' : 'No token');
      
      if (token) {
        try {
          console.log('✅ Token found, verifying with API...');
          const userData = await apiService.getCurrentUser();
          console.log('👤 User data received:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          console.log('✅ User authenticated successfully');
        } catch (apiError) {
          console.error('🚨 Token verification failed:', apiError);
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('refreshToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('❌ No token found, user not authenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('🚨 Error checking login status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('✅ Login status check completed');
    }
  };

  const clearError = () => {
    console.log('🧹 Clearing error state');
    setError(null);
  };


  const login = async (email, password) => {
    console.log('🔐 Starting login process for:', email);
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.login(email, password);
      console.log('✅ Login API response:', {
        hasToken: !!response.access_token, // ✅ CORRIGÉ: access_token au lieu de token
        hasUser: !!response.user,
        message: response.message
      });
      
      if (response.access_token) { // ✅ CORRIGÉ: access_token au lieu de token
        console.log('💾 Storing tokens...');
        await AsyncStorage.setItem('authToken', response.access_token); // ✅ CORRIGÉ
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('✅ Login successful, user authenticated');
        
        return response;
      } else {
        console.error('🚨 No token in response:', response);
        throw new Error('Aucun token reçu du serveur');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur de connexion';
      console.error('🚨 Login failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    console.log('📝 Starting registration for:', userData.email);
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.register(userData);
      console.log('✅ Registration API response:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        message: response.message
      });
      
      if (response.token) {
        console.log('💾 Auto-login after registration...');
        await AsyncStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('✅ Registration and auto-login successful');
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur d\'inscription';
      console.error('🚨 Registration failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('👋 Starting logout process...');
    try {
      setLoading(true);
      
      // Tentative de logout côté serveur (optionnel)
      try {
        await apiService.logout();
        console.log('✅ Server logout successful');
      } catch (apiError) {
        console.warn('⚠️ Server logout failed (route may not exist), continuing local cleanup:', apiError.message);
      }
      
      // Nettoyage local - toujours effectué
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('✅ Logout completed - tokens cleared locally');
    } catch (error) {
      console.error('🚨 Error during logout:', error);
      // En cas d'erreur, forcer le nettoyage local
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
      } catch (storageError) {
        console.error('🚨 Error clearing storage:', storageError);
      }
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData) => {
    console.log('👤 Updating user profile...');
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await apiService.updateProfile(userData);
      console.log('✅ Profile updated:', updatedUser);
      
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur de mise à jour du profil';
      console.error('🚨 Profile update failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // État
    isAuthenticated,
    user,
    loading,
    error,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    checkLoginStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};