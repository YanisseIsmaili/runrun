import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const userData = await authService.getCurrentUser(token);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log('Error checking login status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Fonction pour gérer la connexion
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

  // Fonction pour gérer l'inscription
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

  // Fonction pour gérer la déconnexion
  const logout = async () => {
    try {
      setLoading(true);
      
      await AsyncStorage.removeItem('authToken');
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err.message || 'Erreur de déconnexion');
      throw err;
    } finally {
      setLoading(false);
    }
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
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};