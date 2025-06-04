// Fix for setImmediate error
if (typeof global.setImmediate !== 'function') {
  global.setImmediate = function(callback, ...args) {
    return setTimeout(callback, 0, ...args);
  };
}
if (typeof global.clearImmediate !== 'function') {
  global.clearImmediate = clearTimeout;
}

// Ensuite vos imports normaux
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { RunProvider } from './src/context/RunContext';
import SplashScreen from './src/screens/SplashScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement initial (à remplacer par la logique réelle)
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <AuthProvider>
        <RunProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </RunProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}