// SplashScreen.js - Si nécessaire
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, loading, checkLoginStatus } = useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      await checkLoginStatus();
      
      setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      }, 2000);
    };

    initializeApp();
  }, [isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Running App V3</Text>
      <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      <Text style={styles.subtitle}>Chargement...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
});

export default SplashScreen;