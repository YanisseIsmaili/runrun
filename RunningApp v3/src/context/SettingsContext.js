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
  distanceUnit: 'km',
  speedUnit: 'kmh',
  notificationsEnabled: true,
  voiceGuidanceEnabled: true,
  autoStartRun: false,
  autoPauseRun: true,
  gpsAccuracy: 'high',
  mapType: 'standard',
  weeklyDistanceGoal: 10,
  weeklyRunsGoal: 3,
  weight: 70,
  height: 175,
  age: 30,
  fitnessLevel: 'intermediate',
  theme: 'auto',
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

  const formatDistance = (distance) => {
    const convertedDistance = settings.distanceUnit === 'miles' 
      ? distance * 0.621371 
      : distance;
    
    if (convertedDistance < 1) {
      return `${Math.round(convertedDistance * 1000)} m`;
    } else {
      return `${convertedDistance.toFixed(2)} ${settings.distanceUnit}`;
    }
  };

  const formatSpeed = (speed) => {
    const convertedSpeed = settings.speedUnit === 'mph' 
      ? speed * 0.621371 
      : speed;
    
    return `${convertedSpeed.toFixed(1)} ${settings.speedUnit}`;
  };

  const value = {
    settings,
    loading,
    updateSettings,
    formatDistance,
    formatSpeed,
    DEFAULT_SETTINGS,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};