import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

// Clés de stockage
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  RUN_HISTORY: 'runHistory',
  USER_PREFERENCES: 'userPreferences',
  CURRENT_RUN: 'currentRun',
  API_URL: 'apiUrl',
  LAST_SYNC: 'lastSync',
};

// Stocker l'URL de l'API (pour pouvoir la changer dynamiquement si nécessaire)
export const storeApiUrl = async (url) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.API_URL, url);
    return true;
  } catch (error) {
    console.error('Erreur lors du stockage de l\'URL de l\'API:', error);
    return false;
  }
};

// Récupérer l'URL de l'API stockée
export const getApiUrl = async () => {
  try {
    const storedUrl = await AsyncStorage.getItem(STORAGE_KEYS.API_URL);
    return storedUrl || API_URL || 'http://192.168.0.47:5000/api';
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL de l\'API:', error);
    return API_URL || 'http://192.168.0.47:5000/api';
  }
};

// Stocker une valeur
export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Erreur lors du stockage de la donnée (${key}):`, error);
    return false;
  }
};

// Récupérer une valeur
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la donnée (${key}):`, error);
    return null;
  }
};

// Supprimer une valeur
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la donnée (${key}):`, error);
    return false;
  }
};

// Vider tout le stockage
export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de toutes les données:', error);
    return false;
  }
};

// Fonctions spécifiques pour l'authentification
export const storeAuthToken = async (token) => {
  return await storeData(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = async () => {
  return await getData(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeAuthToken = async () => {
  return await removeData(STORAGE_KEYS.AUTH_TOKEN);
};

// Stocker le token de rafraîchissement
export const storeRefreshToken = async (token) => {
  return await storeData(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const getRefreshToken = async () => {
  return await getData(STORAGE_KEYS.REFRESH_TOKEN);
};

export const removeRefreshToken = async () => {
  return await removeData(STORAGE_KEYS.REFRESH_TOKEN);
};

// Fonctions spécifiques pour les données utilisateur
export const storeUserData = async (userData) => {
  return await storeData(STORAGE_KEYS.USER_DATA, userData);
};

export const getUserData = async () => {
  return await getData(STORAGE_KEYS.USER_DATA);
};

export const removeUserData = async () => {
  return await removeData(STORAGE_KEYS.USER_DATA);
};

// Fonctions spécifiques pour l'historique des courses
export const storeRunHistory = async (runHistory) => {
  return await storeData(STORAGE_KEYS.RUN_HISTORY, runHistory);
};

export const getRunHistory = async () => {
  return await getData(STORAGE_KEYS.RUN_HISTORY) || [];
};

export const addRunToHistory = async (run) => {
  try {
    const history = await getRunHistory();
    const updatedHistory = [...history, run];
    return await storeRunHistory(updatedHistory);
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'une course à l\'historique:', error);
    return false;
  }
};

// Stocker la dernière date de synchronisation
export const storeLastSync = async (timestamp = Date.now()) => {
  return await storeData(STORAGE_KEYS.LAST_SYNC, timestamp);
};

export const getLastSync = async () => {
  return await getData(STORAGE_KEYS.LAST_SYNC);
};

// Fonctions spécifiques pour les préférences utilisateur
export const storeUserPreferences = async (preferences) => {
  return await storeData(STORAGE_KEYS.USER_PREFERENCES, preferences);
};

export const getUserPreferences = async () => {
  return await getData(STORAGE_KEYS.USER_PREFERENCES) || {
    notificationsEnabled: true,
    darkModeEnabled: false,
    metricUnits: true,
    voiceFeedbackEnabled: true,
  };
};

// Fonctions spécifiques pour la course en cours
export const storeCurrentRun = async (run) => {
  return await storeData(STORAGE_KEYS.CURRENT_RUN, run);
};

export const getCurrentRun = async () => {
  return await getData(STORAGE_KEYS.CURRENT_RUN);
};

export const removeCurrentRun = async () => {
  return await removeData(STORAGE_KEYS.CURRENT_RUN);
};

// Vérifier s'il y a des données non synchronisées
export const hasUnsyncedData = async () => {
  const currentRun = await getCurrentRun();
  if (currentRun) return true;
  
  // Vous pourriez ajouter d'autres vérifications ici
  
  return false;
};

export default {
  storeData,
  getData,
  removeData,
  clearAll,
  storeAuthToken,
  getAuthToken,
  removeAuthToken,
  storeRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  storeUserData,
  getUserData,
  removeUserData,
  storeRunHistory,
  getRunHistory,
  addRunToHistory,
  storeUserPreferences,
  getUserPreferences,
  storeCurrentRun,
  getCurrentRun,
  removeCurrentRun,
  storeApiUrl,
  getApiUrl,
  storeLastSync,
  getLastSync,
  hasUnsyncedData,
  STORAGE_KEYS,
};