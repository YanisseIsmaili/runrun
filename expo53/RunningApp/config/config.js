// config/config.js - Design System Modernisé
import { Platform } from 'react-native';

// Configuration API
export const API_CONFIG = {
  BASE_URL: 'http://192.168.27.77:5000/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Configuration app
export const APP_CONFIG = {
  NAME: 'RunTracker',
  VERSION: '2.0.0',
  LOCATION_PERMISSIONS: ['location'],
  BACKGROUND_MODES: ['location'],
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK: {
    NO_CONNECTION: 'Aucune connexion internet',
    SERVER_UNREACHABLE: 'Serveur inaccessible',
    TIMEOUT: 'Délai d\'attente dépassé',
    UNKNOWN: 'Erreur réseau inconnue',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Identifiants incorrects',
    ACCOUNT_DISABLED: 'Compte désactivé',
    TOKEN_EXPIRED: 'Session expirée',
    REGISTRATION_FAILED: 'Échec de l\'inscription',
  },
  GPS: {
    PERMISSION_DENIED: 'Autorisation GPS requise',
    UNAVAILABLE: 'GPS indisponible',
    ACCURACY_LOW: 'Précision GPS insuffisante',
    TIMEOUT: 'Impossible d\'obtenir la position',
  },
};

// Nouveau Design System
export const THEME = {
  colors: {
    // Couleurs principales
    primary: '#FF6B35',
    primaryDark: '#E55A2B',
    primaryLight: '#FF8A5C',
    
    secondary: '#4ECDC4',
    secondaryDark: '#26C6DA',
    secondaryLight: '#7FDEDB',
    
    accent: '#45B7D1',
    accentDark: '#2196F3',
    accentLight: '#73C9E8',
    
    // Backgrounds
    background: '#0A0A0F',
    backgroundSecondary: '#141420',
    backgroundTertiary: '#1E1E2E',
    
    // Surfaces
    surface: '#1E1E2E',
    surfaceElevated: '#252538',
    surfaceHighlight: '#2A2A42',
    
    // Textes
    textPrimary: '#FFFFFF',
    textSecondary: '#B8BCC8',
    textMuted: '#6B7280',
    textDisabled: '#4B5563',
    
    // États
    success: '#10B981',
    successDark: '#059669',
    warning: '#F59E0B',
    warningDark: '#D97706',
    error: '#EF4444',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoDark: '#2563EB',
    
    // Transparences
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(10, 10, 15, 0.9)',
    glassDark: 'rgba(30, 30, 46, 0.8)',
    glassLight: 'rgba(255, 255, 255, 0.1)',
  },
  
  gradients: {
    primary: ['#FF6B35', '#E55A2B', '#D44A1C'],
    secondary: ['#4ECDC4', '#26C6DA', '#00BCD4'],
    accent: ['#45B7D1', '#2196F3', '#1976D2'],
    background: ['#0A0A0F', '#141420', '#1E1E2E'],
    surface: ['#1E1E2E', '#252538', '#2A2A42'],
    success: ['#10B981', '#059669', '#047857'],
    error: ['#EF4444', '#DC2626', '#B91C1C'],
    warning: ['#F59E0B', '#D97706', '#B45309'],
    
    // Gradients spéciaux
    sunset: ['#FF6B35', '#FF8A5C', '#FFA07A'],
    ocean: ['#4ECDC4', '#45B7D1', '#3B82F6'],
    cosmic: ['#6366F1', '#8B5CF6', '#EC4899'],
  },
  
  // Espacement
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // Typographie
  typography: {
    display: {
      fontSize: 32,
      fontWeight: '800',
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    heading: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.3,
    },
    overline: {
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  },
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
      elevation: 16,
    },
  },
  
  // Animations
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
    
    easing: {
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    },
  },
};

// Utilitaires
export const getApiUrl = (endpoint = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getPlatformConfig = () => {
  return Platform.OS === 'ios' ? {
    statusBarStyle: 'light-content',
    hapticFeedback: true,
  } : {
    statusBarStyle: 'light-content',
    hapticFeedback: false,
  };
};

// Export par défaut
export default {
  API_CONFIG,
  APP_CONFIG,
  ERROR_MESSAGES,
  THEME,
  getApiUrl,
  getPlatformConfig,
};