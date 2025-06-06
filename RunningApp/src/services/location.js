import * as Location from 'expo-location';
import { Alert, Platform, Linking } from 'react-native';
import { API_URL } from '@env';
import axios from 'axios';

// URL de base de l'API pour envoyer les données de localisation (si nécessaire)
const apiUrl = API_URL || 'http://192.168.0.47:5000/api';

// Client axios pour les appels API liés à la localisation
const locationClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Demander les permissions de localisation
export const requestLocationPermissions = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Cette application a besoin d\'accéder à votre localisation pour suivre vos courses.',
        [
          { text: 'Annuler' },
          { 
            text: 'Paramètres', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la demande de permissions de localisation:', error);
    return false;
  }
};

// Obtenir la position actuelle avec une haute précision
export const getCurrentPosition = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    
    if (!hasPermission) {
      throw new Error('Permissions de localisation non accordées');
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    
    return location;
  } catch (error) {
    console.error('Erreur lors de la récupération de la position actuelle:', error);
    throw error;
  }
};

// Surveiller la position avec une haute précision et des mises à jour fréquentes
export const watchPosition = async (callback) => {
  try {
    const hasPermission = await requestLocationPermissions();
    
    if (!hasPermission) {
      throw new Error('Permissions de localisation non accordées');
    }
    
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,    // Mise à jour toutes les 1 secondes
        distanceInterval: 5,   // Ou tous les 5 mètres
      },
      callback
    );
    
    return subscription;
  } catch (error) {
    console.error('Erreur lors de la surveillance de la position:', error);
    throw error;
  }
};

// Calculer la distance entre deux points (formule de Haversine)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Rayon de la terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance en mètres

  return d;
};

// Calculer la distance totale d'un parcours
export const calculateTotalDistance = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return 0;

  let totalDistance = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const { latitude: lat1, longitude: lon1 } = coordinates[i];
    const { latitude: lat2, longitude: lon2 } = coordinates[i + 1];
    
    totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
  }
  
  return totalDistance;
};

// Convertir un tableau de coordonnées en format GeoJSON
export const toGeoJSON = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map(coord => [coord.longitude, coord.latitude]),
    },
  };
};

// Envoyer des données de localisation au serveur (pour synchronisation en temps réel si nécessaire)
export const sendLocationUpdate = async (token, runId, location) => {
  try {
    const response = await locationClient.post(
      '/runs/location-update',
      {
        runId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        timestamp: location.timestamp
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la mise à jour de position:', error);
    // Ne pas lancer d'erreur pour ne pas perturber le tracking en cas d'échec
    return null;
  }
};

// Récupérer l'adresse à partir des coordonnées (géocodage inverse)
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (results && results.length > 0) {
      return results[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors du géocodage inverse:', error);
    return null;
  }
};

export default {
  requestLocationPermissions,
  getCurrentPosition,
  watchPosition,
  calculateDistance,
  calculateTotalDistance,
  toGeoJSON,
  sendLocationUpdate,
  getAddressFromCoordinates
};