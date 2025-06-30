import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AuthService from '../services/AuthService';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    initializeApp();
  }, []);

  const startAnimations = () => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation rotation continue du logo
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Animation des points de chargement
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const initializeApp = async () => {
    console.log('🚀 [SPLASH] Début initialisation app...');
    
    try {
      // Vérifier les permissions géolocalisation
      console.log('📍 [SPLASH] Demande permission géolocalisation...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 [SPLASH] Permission géoloc:', status);
      
      // Vérifier l'authentification avec la vraie méthode AuthService
      console.log('🔐 [SPLASH] Vérification authentification...');
      const isAuthenticated = await AuthService.isAuthenticated();
      console.log('✅ [SPLASH] Résultat authentification:', isAuthenticated);
      
      console.log('⏱️ [SPLASH] Attente animation (2.5s)...');
      
      // Délai minimum pour l'animation
      setTimeout(() => {
        console.log('🎯 [SPLASH] Navigation décision:');
        console.log('   - Géoloc:', status);
        console.log('   - Auth:', isAuthenticated);
        
        if (status !== 'granted') {
          console.log('🔄 [SPLASH] Redirection -> Login (pas de géoloc)');
          navigation.replace('Login');
        } else if (isAuthenticated) {
          console.log('🔄 [SPLASH] Redirection -> Main (connecté)');
          navigation.replace('Main');
        } else {
          console.log('🔄 [SPLASH] Redirection -> Login (pas connecté)');
          navigation.replace('Login');
        }
      }, 2500);
      
    } catch (error) {
      console.error('💥 [SPLASH] Erreur initialisation:', error);
      setTimeout(() => {
        console.log('🔄 [SPLASH] Redirection -> Login (erreur)');
        navigation.replace('Login');
      }, 2500);
    }
  };

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dotsOpacity = dotsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        {/* Logo principal */}
        <View style={styles.logoContainer}>
          <View style={styles.decorativeRing1} />
          <View style={styles.decorativeRing2} />
          
          <Animated.View
            style={[
              styles.logoGradient,
              {
                transform: [{ rotate: logoRotate }],
              },
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049', '#388e3c']}
              style={styles.logoGradient}
            >
              <Ionicons name="flash" size={48} color="white" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Titre et sous-titre */}
        <Text style={styles.appTitle}>RunTracker</Text>
        <Text style={styles.appSubtitle}>
          Votre compagnon de course intelligent
        </Text>

        {/* Indicateur de chargement */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDots,
              { opacity: dotsOpacity },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          </Animated.View>
          <Text style={styles.loadingText}>Initialisation...</Text>
        </View>

        {/* Fonctionnalités */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>GPS</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="analytics" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Stats</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="trophy" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Records</Text>
          </View>
        </View>
      </Animated.View>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  decorativeRing1: {
    position: 'absolute',
    top: -15,
    left: -15,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  decorativeRing2: {
    position: 'absolute',
    top: -25,
    left: -25,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 60,
    paddingHorizontal: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginHorizontal: 3,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width * 0.8,
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
    fontWeight: '500',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 30,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});