// utils/helpers.js
import { Alert } from 'react-native';

/**
 * Formate une durée en secondes en format HH:MM:SS ou MM:SS
 * @param {number} seconds - Durée en secondes
 * @returns {string} - Durée formatée
 */
export const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formate une distance en mètres
 * @param {number} meters - Distance en mètres
 * @returns {string} - Distance formatée
 */
export const formatDistance = (meters) => {
  if (!meters || meters <= 0) return '0m';
  
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(2)}km`;
  }
  return `${km.toFixed(1)}km`;
};

/**
 * Formate une vitesse en km/h
 * @param {number} speed - Vitesse en km/h
 * @returns {string} - Vitesse formatée
 */
export const formatSpeed = (speed) => {
  if (!speed || speed <= 0) return '0.0 km/h';
  return `${speed.toFixed(1)} km/h`;
};

/**
 * Formate une date
 * @param {string|Date} dateString - Date à formater
 * @param {boolean} includeTime - Inclure l'heure
 * @returns {string} - Date formatée
 */
export const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return 'Date inconnue';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('fr-FR', options);
  } catch (error) {
    console.log('⚠️ Erreur formatage date:', error);
    return 'Date invalide';
  }
};

/**
 * Calcule la distance entre deux coordonnées GPS
 * @param {Object} coord1 - {latitude, longitude}
 * @param {Object} coord2 - {latitude, longitude}
 * @returns {number} - Distance en mètres
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || !coord1.latitude || !coord1.longitude || !coord2.latitude || !coord2.longitude) {
    return 0;
  }
  
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) *
    Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Calcule la vitesse moyenne en km/h
 * @param {number} distance - Distance en mètres
 * @param {number} duration - Durée en secondes
 * @returns {number} - Vitesse en km/h
 */
export const calculateAverageSpeed = (distance, duration) => {
  if (!distance || !duration || duration <= 0) return 0;
  
  const distanceKm = distance / 1000;
  const durationHours = duration / 3600;
  
  return distanceKm / durationHours;
};

/**
 * Calcule l'allure en minutes par kilomètre
 * @param {number} distance - Distance en mètres
 * @param {number} duration - Durée en secondes
 * @returns {number} - Allure en min/km
 */
export const calculatePace = (distance, duration) => {
  if (!distance || !duration || distance <= 0) return 0;
  
  const distanceKm = distance / 1000;
  const durationMinutes = duration / 60;
  
  return durationMinutes / distanceKm;
};

/**
 * Formate une allure
 * @param {number} paceMinPerKm - Allure en min/km
 * @returns {string} - Allure formatée
 */
export const formatPace = (paceMinPerKm) => {
  if (!paceMinPerKm || paceMinPerKm <= 0) return '0:00 /km';
  
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
};

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean} - Email valide
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un mot de passe
 * @param {string} password - Mot de passe à valider
 * @param {number} minLength - Longueur minimale
 * @returns {Object} - {isValid, errors}
 */
export const validatePassword = (password, minLength = 6) => {
  const errors = [];
  
  if (!password) {
    errors.push('Le mot de passe est requis');
    return { isValid: false, errors };
  }
  
  if (password.length < minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Debounce une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai d'attente en ms
 * @returns {Function} - Fonction debouncée
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Affiche une alerte avec gestion d'erreur
 * @param {string} title - Titre de l'alerte
 * @param {string} message - Message de l'alerte
 * @param {Array} buttons - Boutons personnalisés
 */
export const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  try {
    Alert.alert(title, message, buttons);
  } catch (error) {
    console.error('Erreur affichage alerte:', error);
  }
};

/**
 * Affiche une alerte de confirmation
 * @param {string} title - Titre
 * @param {string} message - Message
 * @param {Function} onConfirm - Fonction appelée si confirmé
 * @param {Function} onCancel - Fonction appelée si annulé
 */
export const showConfirmAlert = (title, message, onConfirm, onCancel) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Annuler',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Confirmer',
        onPress: onConfirm,
      },
    ]
  );
};

/**
 * Log avec format amélioré (seulement en mode debug)
 * @param {string} level - Niveau de log (info, warn, error)
 * @param {string} message - Message
 * @param {*} data - Données additionnelles
 */
export const log = (level, message, data) => {
  if (!__DEV__) return;
  
  const timestamp = new Date().toISOString();
  const emoji = {
    info: '🔵',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  }[level] || '📝';
  
  console.log(`${emoji} [${timestamp}] ${message}`);
  
  if (data) {
    console.log('📄 Data:', data);
  }
};

/**
 * Génère un ID unique simple
 * @returns {string} - ID unique
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Vérifie si une valeur est vide (null, undefined, string vide)
 * @param {*} value - Valeur à vérifier
 * @returns {boolean} - True si vide
 */
export const isEmpty = (value) => {
  return value === null || value === undefined || value === '' || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && Object.keys(value).length === 0);
};

/**
 * Parse les données GPS de façon sécurisée
 * @param {string|Object} gpsData - Données GPS
 * @returns {Array} - Coordonnées parsées
 */
export const parseGpsData = (gpsData) => {
  if (!gpsData) return [];
  
  try {
    const data = typeof gpsData === 'string' ? JSON.parse(gpsData) : gpsData;
    
    if (data.coordinates && Array.isArray(data.coordinates)) {
      return data.coordinates.filter(coord => 
        coord && 
        coord.latitude && 
        coord.longitude &&
        typeof coord.latitude === 'number' && 
        typeof coord.longitude === 'number' &&
        coord.latitude >= -90 && 
        coord.latitude <= 90 &&
        coord.longitude >= -180 && 
        coord.longitude <= 180
      );
    }
    
    if (Array.isArray(data)) {
      return data.filter(coord => 
        coord && 
        coord.latitude && 
        coord.longitude &&
        typeof coord.latitude === 'number' && 
        typeof coord.longitude === 'number'
      );
    }
    
    return [];
  } catch (error) {
    console.log('⚠️ Erreur parsing GPS data:', error);
    return [];
  }
};

/**
 * Formate les statistiques d'une course
 * @param {Object} run - Données de la course
 * @returns {Object} - Statistiques formatées
 */
export const formatRunStats = (run) => {
  if (!run) return {};
  
  return {
    distance: formatDistance(run.distance),
    duration: formatTime(run.duration),
    speed: formatSpeed(run.avg_speed || 0),
    maxSpeed: formatSpeed(run.max_speed || 0),
    pace: formatPace(calculatePace(run.distance, run.duration)),
    date: formatDate(run.start_time || run.date),
    gpsPoints: parseGpsData(run.gps_data).length,
  };
};

// Export par défaut avec toutes les fonctions
export default {
  formatTime,
  formatDistance,
  formatSpeed,
  formatDate,
  formatPace,
  calculateDistance,
  calculateAverageSpeed,
  calculatePace,
  isValidEmail,
  validatePassword,
  debounce,
  showAlert,
  showConfirmAlert,
  log,
  generateId,
  isEmpty,
  parseGpsData,
  formatRunStats,
};