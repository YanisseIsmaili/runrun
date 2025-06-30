// config/config.js
import { Platform } from 'react-native';

// Configuration des URLs API
export const API_CONFIG = {
  // URL de base de l'API
  BASE_URL: 'http://192.168.27.77:5000/api',
  
  // URLs alternatives à tester en cas d'échec
  FALLBACK_URLS: [
    'http://192.168.27.77:5000/api',
    'http://127.0.0.1:5000/api',
    'http://localhost:5000/api',
  ],
  
  // Timeout pour les requêtes (en millisecondes)
  TIMEOUT: 10000,
  
  // Nombre de tentatives en cas d'échec
  RETRY_ATTEMPTS: 3,
  
  // Délai entre les tentatives (en millisecondes)
  RETRY_DELAY: 1000,
};

// Configuration de l'application
export const APP_CONFIG = {
  // Nom de l'application
  APP_NAME: 'RunTracker',
  
  // Version
  VERSION: '1.0.0',
  
  // Mode debug (activé automatiquement en développement)
  DEBUG_MODE: __DEV__,
  
  // Configuration GPS
  GPS: {
    // Précision requise
    ACCURACY: 'high',
    
    // Intervalle de mise à jour (millisecondes)
    UPDATE_INTERVAL: 1000,
    
    // Distance minimale pour déclencher une mise à jour (mètres)
    DISTANCE_FILTER: 2,
    
    // Timeout pour obtenir la position initiale
    INITIAL_TIMEOUT: 15000,
  },
  
  // Configuration de stockage local
  STORAGE: {
    // Clés de stockage
    KEYS: {
      ACCESS_TOKEN: 'access_token',
      USER_DATA: 'user_data',
      RUNS_DATA: 'runs',
      SETTINGS: 'app_settings',
    },
    
    // Durée de cache pour les données (millisecondes)
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  },
  
  // Configuration des courses
  RUNS: {
    // Nombre minimum de points GPS pour une course valide
    MIN_GPS_POINTS: 5,
    
    // Distance minimale pour une course valide (mètres)
    MIN_DISTANCE: 100,
    
    // Durée minimale pour une course valide (secondes)
    MIN_DURATION: 30,
    
    // Pagination
    ITEMS_PER_PAGE: 20,
  },
};

// Configuration spécifique à la plateforme
export const PLATFORM_CONFIG = {
  // Configuration iOS
  ios: {
    LOCATION_WHEN_IN_USE: 'Cette app a besoin d\'accéder à votre localisation pour enregistrer vos courses.',
    BACKGROUND_MODES: ['location'],
  },
  
  // Configuration Android
  android: {
    LOCATION_PERMISSION: 'Cette app a besoin d\'accéder à votre localisation pour enregistrer vos courses.',
    BACKGROUND_LOCATION: false, // Pas encore implémenté
  },
};

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  NETWORK: {
    NO_CONNECTION: 'Aucune connexion internet détectée',
    SERVER_UNREACHABLE: 'Impossible de contacter le serveur',
    TIMEOUT: 'Le serveur met trop de temps à répondre',
    UNKNOWN: 'Erreur de connexion inconnue',
  },
  
  AUTH: {
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    ACCOUNT_DISABLED: 'Votre compte a été désactivé',
    TOKEN_EXPIRED: 'Votre session a expiré, veuillez vous reconnecter',
    REGISTRATION_FAILED: 'Impossible de créer le compte',
  },
  
  GPS: {
    PERMISSION_DENIED: 'L\'accès à la localisation est requis pour utiliser cette application',
    UNAVAILABLE: 'Service de localisation indisponible',
    ACCURACY_LOW: 'Précision GPS insuffisante',
    TIMEOUT: 'Impossible d\'obtenir votre position',
  },
  
  RUNS: {
    SAVE_FAILED: 'Impossible de sauvegarder la course',
    LOAD_FAILED: 'Impossible de charger les courses',
    DELETE_FAILED: 'Impossible de supprimer la course',
    INVALID_DATA: 'Données de course invalides',
  },
};

// Configuration des couleurs (thème)
export const THEME = {
  colors: {
    primary: '#4CAF50',
    primaryDark: '#45a049',
    secondary: '#6366F1',
    accent: '#EC4899',
    background: '#0F0F23',
    backgroundLight: '#1A1A3A',
    surface: 'rgba(255, 255, 255, 0.1)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textDisabled: 'rgba(255, 255, 255, 0.5)',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
  },
  
  gradients: {
    primary: ['#4CAF50', '#45a049'],
    secondary: ['#6366F1', '#8B5CF6'],
    background: ['#0f0f23', '#1a1a2e', '#16213e', '#0f3460'],
    surface: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 50,
  },
};

// Utilitaires de configuration
export const getApiUrl = (endpoint = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const isDebugMode = () => {
  return APP_CONFIG.DEBUG_MODE;
};

export const getPlatformConfig = () => {
  return PLATFORM_CONFIG[Platform.OS] || {};
};

// Export par défaut avec toute la configuration
export default {
  API_CONFIG,
  APP_CONFIG,
  PLATFORM_CONFIG,
  ERROR_MESSAGES,
  THEME,
  getApiUrl,
  isDebugMode,
  getPlatformConfig,
};