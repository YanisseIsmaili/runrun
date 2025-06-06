import { CONVERSION, UNITS } from './constants';

// Formater la durée en heures:minutes:secondes
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '--:--:--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Formater la durée en minutes:secondes
export const formatShortDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '--:--';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Formater la distance en fonction des unités
export const formatDistance = (meters, unit = UNITS.METRIC) => {
  if (!meters && meters !== 0) return '-';
  
  if (unit === UNITS.METRIC) {
    // Afficher en km si > 1000m, sinon en m
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  } else {
    // Convertir en miles pour unités impériales
    const miles = meters * CONVERSION.KM_TO_MILES / 1000;
    
    if (miles >= 0.1) {
      return `${miles.toFixed(2)} mi`;
    }
    // Convertir en pieds pour de courtes distances
    const feet = meters * CONVERSION.M_TO_FT;
    return `${Math.round(feet)} ft`;
  }
};

// Formater la vitesse en km/h ou mph
export const formatSpeed = (metersPerSecond, unit = UNITS.METRIC) => {
  if (!metersPerSecond && metersPerSecond !== 0) return '-';
  
  if (unit === UNITS.METRIC) {
    return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
  } else {
    return `${(metersPerSecond * 3.6 * CONVERSION.KM_TO_MILES).toFixed(1)} mph`;
  }
};

// Calculer et formater le rythme (min/km ou min/mile)
export const formatPace = (metersPerSecond, unit = UNITS.METRIC) => {
  if (!metersPerSecond || metersPerSecond === 0) return '--:--';
  
  let paceInMinutes;
  
  if (unit === UNITS.METRIC) {
    // Minutes par km
    paceInMinutes = 16.6667 / metersPerSecond;
  } else {
    // Minutes par mile
    paceInMinutes = 26.8224 / metersPerSecond;
  }
  
  const minutes = Math.floor(paceInMinutes);
  const seconds = Math.floor((paceInMinutes - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Calculer les calories brûlées (estimation)
export const calculateCalories = (distanceInMeters, weightInKg = 70) => {
  if (!distanceInMeters) return 0;
  
  // Formule simplifiée : environ 1 kcal par kg par km
  return Math.round((distanceInMeters / 1000) * weightInKg * 0.9);
};

// Formater une date
export const formatDate = (date, format = 'full') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'time':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'datetime':
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    case 'weekday':
      return d.toLocaleDateString('fr-FR', { weekday: 'long' });
    case 'month':
      return d.toLocaleDateString('fr-FR', { month: 'long' });
    case 'monthYear':
      return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    case 'full':
    default:
      return d.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
  }
};

// Générer un identifiant unique
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Limiter une valeur entre min et max
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

// Attendre un délai spécifié
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Filtrer les courses par période
export const filterRunsByPeriod = (runs, period) => {
  if (!runs || runs.length === 0) return [];
  
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return runs;
  }
  
  return runs.filter(run => new Date(run.startTime) >= startDate);
};

// Récupérer les statistiques des courses
export const getRunStats = (runs) => {
  if (!runs || runs.length === 0) {
    return {
      totalRuns: 0,
      totalDistance: 0,
      totalDuration: 0,
      averageDistance: 0,
      averageDuration: 0,
      averagePace: 0,
      bestPace: 0,
      totalCalories: 0,
    };
  }
  
  const totalRuns = runs.length;
  const totalDistance = runs.reduce((total, run) => total + (run.distance || 0), 0);
  const totalDuration = runs.reduce((total, run) => total + (run.duration || 0), 0);
  
  const averageDistance = totalDistance / totalRuns;
  const averageDuration = totalDuration / totalRuns;
  const averagePace = totalDuration > 0 ? (totalDuration / 60) / (totalDistance / 1000) : 0;
  
  let bestPace = Infinity;
  runs.forEach(run => {
    if (run.distance && run.duration) {
      const pace = (run.duration / 60) / (run.distance / 1000);
      if (pace < bestPace && pace > 0) {
        bestPace = pace;
      }
    }
  });
  
  if (bestPace === Infinity) bestPace = 0;
  
  const totalCalories = runs.reduce((total, run) => {
    return total + calculateCalories(run.distance || 0);
  }, 0);
  
  return {
    totalRuns,
    totalDistance,
    totalDuration,
    averageDistance,
    averageDuration,
    averagePace,
    bestPace,
    totalCalories,
  };
};

// Formater un nombre avec séparateur de milliers
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Extraire l'initiale d'un nom (pour photo de profil)
export const getInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

export default {
  formatDuration,
  formatShortDuration,
  formatDistance,
  formatSpeed,
  formatPace,
  calculateCalories,
  formatDate,
  generateUniqueId,
  clamp,
  delay,
  filterRunsByPeriod,
  getRunStats,
  formatNumber,
  getInitials,
};