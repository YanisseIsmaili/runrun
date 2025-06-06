import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { LogBox, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { RunProvider } from './src/context/RunContext';
import SplashScreen from './src/screens/SplashScreen';

// Ignorer les warnings non critiques pour Expo SDK 53
LogBox.ignoreLogs([
  'Require cycle:',
  'Remote debugger',
  'Warning: componentWillMount',
  'Warning: componentWillReceiveProps',
  'Animated: `useNativeDriver`',
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'EdgeInsetsPropType will be removed',
]);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialisation de l'application pour Expo SDK 53
    const initializeApp = async () => {
      try {
        // Simulations d'initialisations nécessaires
        // Vous pouvez ajouter ici la vérification de l'authentification,
        // le chargement de données critiques, etc.
        
        // Délai minimal pour l'écran de démarrage
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('App initialisée avec Expo SDK 53');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <AuthProvider>
        <RunProvider>
          <StatusBar 
            style="light" 
            backgroundColor="#388E3C"
            translucent={false}
          />
          <AppNavigator />
        </RunProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}