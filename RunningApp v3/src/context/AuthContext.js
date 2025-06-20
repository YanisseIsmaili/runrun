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
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (apiError) {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('refreshToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.login(email, password);
      
      await AsyncStorage.setItem('authToken', response.token);
      if (response.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.refreshToken);
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur de connexion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.register(userData);
      
      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur d\'inscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      try {
        await apiService.logout();
      } catch (apiError) {
        console.log('Erreur lors de la déconnexion côté serveur:', apiError);
      }
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('runHistory');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Erreur de déconnexion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await apiService.updateProfile(updatedData);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur de mise à jour du profil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
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