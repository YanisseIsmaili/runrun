// screens/SplashScreen.js - SYNTAXE CORRIGÉE
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Alert,
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

  const [initializationStatus, setInitializationStatus] = useState('starting');
  const [currentStep, setCurrentStep] = useState('Démarrage...');

  useEffect(() => {
    startAnimations();
    initializeApp();

    return () => {
      console.log('🔄 [SPLASH] Nettoyage du composant');
    };
  }, []);

  const startAnimations = () => {
    console.log('🎬 [SPLASH] Démarrage des animations');

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

    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

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
    setInitializationStatus('initializing');
    
    try {
      setCurrentStep('Vérification GPS...');
      console.log('📍 [SPLASH] Demande permission géolocalisation...');
      
      // LIGNE CORRIGÉE - suppression de la syntaxe cassée
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 [SPLASH] Permission géoloc:', status);
      
      if (status !== 'granted') {
        console.log('❌ [SPLASH] Permission géolocalisation refusée');
        setCurrentStep('Permission GPS requise');
        
        setTimeout(() => {
          Alert.alert(
            'Permission requise',
            'L\'accès à la géolocalisation est nécessaire pour utiliser cette application.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('🔄 [SPLASH] Redirection -> Login (pas de géoloc)');
                  navigation.replace('Login');
                }
              }
            ]
          );
        }, 1000);
        return;
      }

      setCurrentStep('Vérification compte...');
      console.log('🔐 [SPLASH] Vérification authentification...');
      
      let isAuthenticated = false;
      
      try {
        isAuthenticated = await AuthService.isAuthenticated();
        console.log('✅ [SPLASH] Résultat authentification:', isAuthenticated);
      } catch (authError) {
        console.error('❌ [SPLASH] Erreur authentification:', authError);
        isAuthenticated = false;
      }
      
      setCurrentStep('Vérification serveur...');
      console.log('🌐 [SPLASH] Test connectivité API...');
      
      try {
        const connectionTest = await AuthService.testConnection();
        console.log('📡 [SPLASH] Test connexion:', connectionTest.success);
        
        if (!connectionTest.success) {
          console.log('⚠️ [SPLASH] API non disponible, mode hors ligne');
        }
      } catch (networkError) {
        console.log('⚠️ [SPLASH] Erreur réseau (mode hors ligne):', networkError.message);
      }

      setCurrentStep('Chargement...');
      console.log('⏱️ [SPLASH] Attente animation (2.5s)...');
      
      setTimeout(() => {
        setInitializationStatus('completed');
        navigateToNextScreen(status, isAuthenticated);
      }, 2500);
      
    } catch (error) {
      console.error('💥 [SPLASH] Erreur critique initialisation:', error);
      setInitializationStatus('error');
      setCurrentStep('Erreur de connexion');
      
      setTimeout(() => {
        console.log('🔄 [SPLASH] Redirection -> Login (erreur)');
        navigation.replace('Login');
      }, 3000);
    }
  };

  const navigateToNextScreen = (locationStatus, isAuthenticated) => {
    console.log('🎯 [SPLASH] Navigation décision:');
    console.log('   - Géoloc:', locationStatus);
    console.log('   - Auth:', isAuthenticated);
    
    if (locationStatus !== 'granted') {
      console.log('🔄 [SPLASH] Redirection -> Login (pas de géoloc)');
      navigation.replace('Login');
    } else if (isAuthenticated) {
      console.log('🔄 [SPLASH] Redirection -> Main (connecté)');
      navigation.replace('Main');
    } else {
      console.log('🔄 [SPLASH] Redirection -> Login (pas connecté)');
      navigation.replace('Login');
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

  const getStatusColor = () => {
    switch (initializationStatus) {
      case 'starting': return '#4CAF50';
      case 'initializing': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'error': return '#f44336';
      default: return '#4CAF50';
    }
  };

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

        <Text style={styles.appTitle}>RunTracker</Text>
        <Text style={styles.appSubtitle}>
          Votre compagnon de course intelligent
        </Text>

        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDots,
              { opacity: dotsOpacity },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
            <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
            <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
          </Animated.View>
          <Text style={[styles.loadingText, { color: getStatusColor() }]}>
            {currentStep}
          </Text>
        </View>

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

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  decorativeRing1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    top: -10,
    left: -10,
  },
  decorativeRing2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
    top: -20,
    left: -20,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 60,
    fontWeight: '300',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 250,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 5,
    fontWeight: '500',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});