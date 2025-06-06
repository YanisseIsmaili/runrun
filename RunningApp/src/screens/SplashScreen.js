import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomSplashScreen = () => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Utilisation d'une icône au lieu d'une image pour éviter les problèmes d'assets */}
        <View style={styles.logoBackground}>
          <Ionicons name="fitness" size={80} color="#FFFFFF" />
        </View>
        
        <Text style={styles.title}>Running App</Text>
        <Text style={styles.subtitle}>Suivez vos performances</Text>
        
        <View style={styles.versionContainer}>
          <Text style={styles.version}>v1.0.0</Text>
          <Text style={styles.sdk}>Expo SDK 53</Text>
        </View>
      </Animated.View>
      
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        <Text style={styles.loadingText}>Initialisation...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  version: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  sdk: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default SplashScreen;