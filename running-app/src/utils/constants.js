import { API_URL } from '@env';

// API Endpoints
export const API_BASE_URL = API_URL || 'http://192.168.0.47:5000/api';

// Endpoints spécifiques
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password',
    UPDATE_PASSWORD: '/auth/update-password',
    VALIDATE_TOKEN: '/auth/validate-token',
  },
  USERS: {
    ME: '/users/me',
    PROFILE: '/users/profile',
    PROFILE_IMAGE: '/users/profile/image',
  },
  RUNS: {
    LIST: '/runs',
    DETAILS: (id) => `/runs/${id}`,
    CREATE: '/runs',
    UPDATE: (id) => `/runs/${id}`,
    DELETE: (id) => `/runs/${id}`,
    LOCATION_UPDATE: '/runs/location-update',
    STATS: '/runs/stats',
  },
  EXERCISES: {
    RECOMMENDED: '/exercises/recommended',
    LIST: '/exercises',
    DETAILS: (id) => `/exercises/${id}`,
  },
  HEALTH: '/health',
};

// Statuts d'authentification
export const AUTH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Types d'exercices
export const EXERCISE_TYPES = {
  LIGHT_RUN: 'light_run',
  INTERVAL: 'interval',
  LONG_RUN: 'long_run',
  RECOVERY: 'recovery',
  STRENGTH: 'strength',
};

// Niveaux de difficulté
export const DIFFICULTY_LEVELS = {
  EASY: 'Facile',
  MODERATE: 'Modéré',
  DIFFICULT: 'Difficile',
};

// États de course
export const RUN_STATUS = {
  IDLE: 'idle',
  ACTIVE: 'active',
  PAUSED: 'paused',
  FINISHED: 'finished',
};

// Unités de mesure
export const UNITS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial',
};

// Constantes de conversion
export const CONVERSION = {
  KM_TO_MILES: 0.621371,
  MILES_TO_KM: 1.60934,
  M_TO_FT: 3.28084,
  FT_TO_M: 0.3048,
  KG_TO_LB: 2.20462,
  LB_TO_KG: 0.453592,
};

// Permissions
export const PERMISSIONS = {
  LOCATION: 'location',
  CAMERA: 'camera',
  MEDIA_LIBRARY: 'mediaLibrary',
  NOTIFICATIONS: 'notifications',
};

// Clés de stockage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  RUN_HISTORY: 'runHistory',
  USER_PREFERENCES: 'userPreferences',
  CURRENT_RUN: 'currentRun',
  API_URL: 'apiUrl',
  LAST_SYNC: 'lastSync',
};

// Formats de date
export const DATE_FORMATS = {
  FULL_DATE: 'dddd, D MMMM YYYY',
  SHORT_DATE: 'DD/MM/YYYY',
  TIME: 'HH:mm',
  DATETIME: 'DD/MM/YYYY HH:mm',
};

// Constantes liées aux courses
export const RUN_CONSTANTS = {
  MIN_VALID_SPEED: 0.5, // m/s (1.8 km/h) - vitesse minimale considérée comme valide
  MAX_VALID_SPEED: 8.33, // m/s (30 km/h) - vitesse maximale considérée comme valide
  CALORIES_PER_KM: 65, // calories brûlées par km (estimation moyenne)
  DEFAULT_MAP_ZOOM: 15,
  LOCATION_UPDATE_INTERVAL: 1000, // ms
  LOCATION_DISTANCE_INTERVAL: 5, // m
};

// Icônes par type d'exercice
export const EXERCISE_ICONS = {
  [EXERCISE_TYPES.LIGHT_RUN]: 'walk-outline',
  [EXERCISE_TYPES.INTERVAL]: 'speedometer-outline',
  [EXERCISE_TYPES.LONG_RUN]: 'fitness-outline',
  [EXERCISE_TYPES.RECOVERY]: 'heart-outline',
  [EXERCISE_TYPES.STRENGTH]: 'barbell-outline',
};

// Options pour les graphiques
export const CHART_OPTIONS = {
  TIME_PERIODS: ['Semaine', 'Mois', 'Année', 'Tous'],
  METRICS: ['Distance', 'Durée', 'Rythme', 'Calories'],
};

// Codes HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

export default {
  API_BASE_URL,
  ENDPOINTS,
  AUTH_STATUS,
  EXERCISE_TYPES,
  DIFFICULTY_LEVELS,
  RUN_STATUS,
  UNITS,
  CONVERSION,
  PERMISSIONS,
  STORAGE_KEYS,
  DATE_FORMATS,
  RUN_CONSTANTS,
  EXERCISE_ICONS,
  CHART_OPTIONS,
  HTTP_STATUS,
};