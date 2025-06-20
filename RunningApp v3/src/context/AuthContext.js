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

  const login = async (email, password) => {
    console.log('🔐 Starting login process for:', email);
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.login(email, password);
      console.log('✅ Login API response:', response);
      
      if (response.token) {
        console.log('💾 Storing tokens...');
        await AsyncStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('✅ Login successful, user authenticated');
      } else {
        console.error('🚨 No token in response:', response);
      }
      
      return response;
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
      console.log('✅ Registration API response:', response);
      
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
      
      try {
        await apiService.logout();
        console.log('✅ Server logout successful');
      } catch (apiError) {
        console.log('⚠️ Server logout failed, continuing with local logout');
      }
      
      console.log('🧹 Clearing local storage...');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('runHistory');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      console.log('✅ Logout completed');
    } catch (err) {
      const errorMessage = err.message || 'Erreur de déconnexion';
      console.error('🚨 Logout error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedData) => {
    console.log('📝 Updating user profile:', updatedData);
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await apiService.updateProfile(updatedData);
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

  const clearError = () => {
    console.log('🧹 Clearing error state');
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