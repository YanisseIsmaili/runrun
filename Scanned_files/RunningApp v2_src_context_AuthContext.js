import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/auth';

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
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.log('Error checking login status:', err);
      // Token invalide, nettoyer le stockage
      await AsyncStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(email, password);
      await AsyncStorage.setItem('authToken', response.token);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      await AsyncStorage.setItem('authToken', response.token);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      setError(err.message || 'Erreur d\'inscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erreur de déconnexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        clearError,
        checkLoginStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};