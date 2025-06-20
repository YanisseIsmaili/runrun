import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const DEFAULT_SETTINGS = {
  // Unités
  distanceUnit: 'km', // 'km' ou 'miles'
  speedUnit: 'kmh', // 'kmh' ou 'mph'
  
  // Notifications
  notificationsEnabled: true,
  progressNotifications: true,
  motivationalNotifications: true,
  
  // Audio
  voiceGuidanceEnabled: true,
  voiceLanguage: 'fr',
  
  // Suivi
  autoStartRun: false,
  autoPauseRun: true,
  gpsAccuracy: 'high', // 'high', 'medium', 'low'
  
  // Affichage
  mapType: 'standard', // 'standard', 'satellite', 'hybrid'
  showSpeedOnMap: true,
  showDistanceOnMap: true,
  
  // Objectifs
  weeklyDistanceGoal: 10, // km
  weeklyRunsGoal: 3,
  
  // Privacité
  shareLocation: false,
  shareStats: true,
  
  // Profil utilisateur
  weight: 70, // kg
  height: 175, // cm
  age: 30,
  fitnessLevel: 'intermediate', // 'beginner', 'intermediate', 'advanced'
  
  // Thème
  theme: 'auto', // 'light', 'dark', 'auto'
  primaryColor: '#4CAF50',
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('userSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      return false;
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.setItem('userSettings', JSON.stringify(DEFAULT_SETTINGS));
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des paramètres:', error);
      return false;
    }
  };

  // Fonctions utilitaires pour les conversions d'unités
  const convertDistance = (distance, fromUnit = 'km', toUnit = null) => {
    const targetUnit = toUnit || settings.distanceUnit;
    
    if (fromUnit === targetUnit) return distance;
    
    if (fromUnit === 'km' && targetUnit === 'miles') {
      return distance * 0.621371;
    } else if (fromUnit === 'miles' && targetUnit === 'km') {
      return distance / 0.621371;
    }
    
    return distance;
  };

  const convertSpeed = (speed, fromUnit = 'kmh', toUnit = null) => {
    const targetUnit = toUnit || settings.speedUnit;
    
    if (fromUnit === targetUnit) return speed;
    
    if (fromUnit === 'kmh' && targetUnit === 'mph') {
      return speed * 0.621371;
    } else if (fromUnit === 'mph' && targetUnit === 'kmh') {
      return speed / 0.621371;
    }
    
    return speed;
  };

  const formatDistance = (distance, unit = null) => {
    const targetUnit = unit || settings.distanceUnit;
    const convertedDistance = convertDistance(distance, 'km', targetUnit);
    
    if (convertedDistance < 1) {
      return `${Math.round(convertedDistance * 1000)} m`;
    } else {
      return `${convertedDistance.toFixed(2)} ${targetUnit}`;
    }
  };

  const formatSpeed = (speed, unit = null) => {
    const targetUnit = unit || settings.speedUnit;
    const convertedSpeed = convertSpeed(speed, 'kmh', targetUnit);
    
    return `${convertedSpeed.toFixed(1)} ${targetUnit}`;
  };

  const calculateBMI = () => {
    const heightInMeters = settings.height / 100;
    return settings.weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = () => {
    const bmi = calculateBMI();
    
    if (bmi < 18.5) return 'Insuffisance pondérale';
    if (bmi < 25) return 'Poids normal';
    if (bmi < 30) return 'Surpoids';
    return 'Obésité';
  };

  const getCaloriesPerKm = () => {
    // Formule approximative basée sur le poids
    // Calories par km = poids en kg × 1.036
    return settings.weight * 1.036;
  };

  const getRecommendedPace = () => {
    // Allure recommandée basée sur le niveau de forme physique
    switch (settings.fitnessLevel) {
      case 'beginner':
        return '7:00'; // 7 min/km
      case 'intermediate':
        return '5:30'; // 5:30 min/km
      case 'advanced':
        return '4:30'; // 4:30 min/km
      default:
        return '6:00'; // 6 min/km
    }
  };

  const value = {
    // État
    settings,
    loading,
    
    // Actions
    updateSettings,
    resetSettings,
    
    // Utilitaires de conversion
    convertDistance,
    convertSpeed,
    formatDistance,
    formatSpeed,
    
    // Calculs santé
    calculateBMI,
    getBMICategory,
    getCaloriesPerKm,
    getRecommendedPace,
    
    // Constantes
    DEFAULT_SETTINGS,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};