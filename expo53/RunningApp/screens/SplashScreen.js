import React, { useEffect, useRef } from 'react';
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
  };

  const initializeApp = async () => {
    try {
      // Vérifier les permissions géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      // Vérifier l'authentification
      const isAuthenticated = await AuthService.isAuthenticated();
      
      // Délai minimum pour l'animation
      setTimeout(() => {
        if (status !== 'granted') {
          navigation.replace('Login'); // Rediriger vers login si pas de géoloc
        } else if (isAuthenticated) {
          navigation.replace('Main'); // Utilisateur connecté
        } else {
          navigation.replace('Login'); // Pas connecté
        }
      }, 2500);
      
    } catch (error) {
      console.error('Erreur initialisation:', error);
      setTimeout(() => {
        navigation.replace('Login');
      }, 2500);
    }
  };

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
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
          <Animated.View
            style={[
              styles.logoBackground,
              {
                transform: [{ rotate: logoRotate }],
              },
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049', '#2E7D32']}
              style={styles.logoGradient}
            >
              <Ionicons name="fitness" size={60} color="white" />
            </LinearGradient>
          </Animated.View>
          
          {/* Cercles décoratifs */}
          <View style={styles.decorativeRing1} />
          <View style={styles.decorativeRing2} />
        </View>

        {/* Titre de l'app */}
        <Text style={styles.appTitle}>RunTracker</Text>
        <Text style={styles.appSubtitle}>Votre compagnon de course intelligent</Text>

        {/* Indicateurs de chargement */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Initialisation...</Text>
        </View>

        {/* Fonctionnalités */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>GPS précis</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="fitness" size={20} color="#2196F3" />
            <Text style={styles.featureText}>Coach IA</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="analytics" size={20} color="#FF9800" />
            <Text style={styles.featureText}>Statistiques</Text>
          </View>
        </View>
      </Animated.View>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
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
  },
  logoBackground: {
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