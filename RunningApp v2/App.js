import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { RunProvider } from './src/context/RunContext';

// Composant ActivityIndicator personnalisé pour éviter les problèmes de taille
const CustomActivityIndicator = ({ size = 40, color = "#4CAF50", style }) => {
  const indicatorSize = typeof size === 'string' ? (size === 'large' ? 40 : 20) : size;
  
  return (
    <View style={[{ width: indicatorSize, height: indicatorSize }, style]}>
      <View
        style={{
          width: indicatorSize,
          height: indicatorSize,
          borderRadius: indicatorSize / 2,
          borderWidth: 2,
          borderColor: color,
          borderTopColor: 'transparent',
          transform: [{ rotate: '0deg' }],
        }}
      />
    </View>
  );
};

// Composant SplashScreen intégré
const SplashScreen = () => {
  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.logoContainer}>
        <Ionicons name="fitness" size={80} color="#4CAF50" />
      </View>
      <Text style={splashStyles.title}>Running App</Text>
      <Text style={splashStyles.subtitle}>Suivez vos performances</Text>
      <CustomActivityIndicator size={50} color="#4CAF50" style={splashStyles.loader} />
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 50,
  },
  loader: {
    marginTop: 20,
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement initial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
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