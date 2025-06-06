import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { PERMISSIONS } from './constants';

// Vérifier l'état d'une permission
export const checkPermission = async (permission) => {
  try {
    let status;
    
    switch (permission) {
      case PERMISSIONS.LOCATION:
        const locationStatus = await Location.getForegroundPermissionsAsync();
        status = locationStatus.status;
        break;
        
      case PERMISSIONS.CAMERA:
        const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
        status = cameraStatus.status;
        break;
        
      case PERMISSIONS.MEDIA_LIBRARY:
        const mediaLibraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
        status = mediaLibraryStatus.status;
        break;
        
      case PERMISSIONS.NOTIFICATIONS:
        const notificationStatus = await Notifications.getPermissionsAsync();
        status = notificationStatus.status;
        break;
        
      default:
        throw new Error(`Permission non reconnue: ${permission}`);
    }
    
    return status === 'granted';
  } catch (error) {
    console.error(`Erreur lors de la vérification de la permission ${permission}:`, error);
    return false;
  }
};

// Demander une permission
export const requestPermission = async (permission) => {
  try {
    let status;
    
    switch (permission) {
      case PERMISSIONS.LOCATION:
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        status = locationStatus.status;
        break;
        
      case PERMISSIONS.CAMERA:
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        status = cameraStatus.status;
        break;
        
      case PERMISSIONS.MEDIA_LIBRARY:
        const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        status = mediaLibraryStatus.status;
        break;
        
      case PERMISSIONS.NOTIFICATIONS:
        const notificationStatus = await Notifications.requestPermissionsAsync();
        status = notificationStatus.status;
        break;
        
      default:
        throw new Error(`Permission non reconnue: ${permission}`);
    }
    
    return status === 'granted';
  } catch (error) {
    console.error(`Erreur lors de la demande de permission ${permission}:`, error);
    return false;
  }
};

// Obtenir le nom lisible d'une permission
export const getPermissionFriendlyName = (permission) => {
  switch (permission) {
    case PERMISSIONS.LOCATION:
      return 'localisation';
    case PERMISSIONS.CAMERA:
      return 'caméra';
    case PERMISSIONS.MEDIA_LIBRARY:
      return 'bibliothèque multimédia';
    case PERMISSIONS.NOTIFICATIONS:
      return 'notifications';
    default:
      return permission;
  }
};

// Obtenir le message explicatif pour une permission
export const getPermissionRationale = (permission) => {
  switch (permission) {
    case PERMISSIONS.LOCATION:
      return 'Cette fonctionnalité nécessite l\'accès à votre position pour suivre vos courses.';
    case PERMISSIONS.CAMERA:
      return 'Cette fonctionnalité nécessite l\'accès à votre caméra pour prendre des photos.';
    case PERMISSIONS.MEDIA_LIBRARY:
      return 'Cette fonctionnalité nécessite l\'accès à votre galerie pour choisir des images.';
    case PERMISSIONS.NOTIFICATIONS:
      return 'Cette fonctionnalité nécessite l\'autorisation d\'envoyer des notifications pour vous informer.';
    default:
      return `Cette fonctionnalité nécessite l'accès à ${getPermissionFriendlyName(permission)}.`;
  }
};

// Demander une permission avec une explication et une redirection vers les paramètres si nécessaire
export const requestPermissionWithRationale = async (permission) => {
  const isGranted = await checkPermission(permission);
  
  if (isGranted) {
    return true;
  }
  
  const wasRequested = await requestPermission(permission);
  
  if (wasRequested) {
    return true;
  }
  
  // Si la permission a été refusée, proposer d'ouvrir les paramètres
  Alert.alert(
    'Permission requise',
    getPermissionRationale(permission),
    [
      { text: 'Annuler', style: 'cancel' },
      { 
        text: 'Ouvrir les paramètres', 
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
};

// Vérifier plusieurs permissions en même temps
export const checkMultiplePermissions = async (permissions) => {
  const results = {};
  
  for (const permission of permissions) {
    results[permission] = await checkPermission(permission);
  }
  
  return results;
};

// Demander plusieurs permissions en même temps
export const requestMultiplePermissions = async (permissions) => {
  const results = {};
  
  for (const permission of permissions) {
    results[permission] = await requestPermission(permission);
  }
  
  return results;
};

export default {
  checkPermission,
  requestPermission,
  getPermissionFriendlyName,
  getPermissionRationale,
  requestPermissionWithRationale,
  checkMultiplePermissions,
  requestMultiplePermissions,
};