// screens/SplashScreen.js - Skeleton Loading moderne
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AuthService from '../services/AuthService';

const { width } = Dimensions.get('window');

// Composant Skeleton Card
const SkeletonCard = ({ width: cardWidth, height, delay = 0 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-cardWidth, cardWidth],
  });

  return (
    <Animated.View style={[styles.skeletonCard, { width: cardWidth, height, opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#2A2A42', '#1E1E2E', '#2A2A42']}
        style={styles.skeletonBackground}
      />
      <Animated.View
        style={[
          styles.shimmerOverlay,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.1)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </Animated.View>
  );
};

const SkeletonPulse = ({ width: pulseWidth, height, borderRadius = 8, delay = 0 }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeletonPulse,
        {
          width: pulseWidth,
          height,
          borderRadius,
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );
};

export default function SplashScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState('Initialisation...');
  const [progress, setProgress] = useState(0);
  const isMounted = useRef(true);

  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const containerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;
    startAnimations();
    initializeApp();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const startAnimations = () => {
    Animated.timing(containerFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.spring(logoScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      delay: 300,
      useNativeDriver: true,
    }).start();
  };

  const updateProgress = (newProgress, step) => {
    if (!isMounted.current) return;
    
    setProgress(newProgress);
    setCurrentStep(step);
    
    Animated.timing(progressAnim, {
      toValue: newProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const initializeApp = async () => {
    if (!isMounted.current) return;
    
    try {
      updateProgress(0.2, 'Vérification GPS...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (!isMounted.current) return;
      
      if (status !== 'granted') {
        updateProgress(0.5, 'Permission GPS requise');
        setTimeout(() => {
          if (!isMounted.current) return;
          Alert.alert(
            'Permission requise',
            'L\'accès à la géolocalisation est nécessaire.',
            [{ text: 'OK', onPress: () => safeNavigate('Login') }]
          );
        }, 1000);
        return;
      }

      updateProgress(0.5, 'Vérification compte...');
      
      let isAuthenticated = false;
      try {
        isAuthenticated = await AuthService.isAuthenticated();
      } catch (authError) {
        console.error('Erreur auth:', authError);
      }
      
      if (!isMounted.current) return;
      
      updateProgress(0.8, 'Connexion serveur...');
      
      try {
        await AuthService.testConnection();
      } catch (networkError) {
        console.log('Mode hors ligne');
      }

      if (!isMounted.current) return;
      
      updateProgress(1, 'Prêt !');
      
      setTimeout(() => {
        if (!isMounted.current) return;
        
        const targetScreen = status === 'granted' && isAuthenticated ? 'Main' : 'Login';
        safeNavigate(targetScreen);
      }, 800);
      
    } catch (error) {
      console.error('Erreur initialisation:', error);
      if (!isMounted.current) return;
      
      updateProgress(0, 'Erreur de connexion');
      
      setTimeout(() => {
        if (!isMounted.current) return;
        safeNavigate('Login');
      }, 2000);
    }
  };

  const safeNavigate = (screenName) => {
    if (!isMounted.current) return;
    
    try {
      if (navigation && navigation.replace) {
        navigation.replace(screenName);
      } else if (navigation && navigation.navigate) {
        navigation.navigate(screenName);
      }
    } catch (navError) {
      console.error('Erreur navigation:', navError);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - 80],
  });

  return (
    <LinearGradient
      colors={['#0A0A0F', '#141420', '#1E1E2E']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View
        style={[
          styles.content,
          { opacity: containerFadeAnim }
        ]}
      >
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: logoScaleAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#FF6B35', '#E55A2B', '#D44A1C']}
              style={styles.logoGradient}
            >
              <Ionicons name="flash" size={40} color="white" />
            </LinearGradient>
          </Animated.View>
          
          <Text style={styles.appTitle}>RunTracker</Text>
          <Text style={styles.appSubtitle}>Votre compagnon de course</Text>
        </View>

        <View style={styles.skeletonSection}>
          <View style={styles.skeletonRow}>
            <SkeletonCard width={(width - 80) / 2 - 10} height={80} delay={200} />
            <SkeletonCard width={(width - 80) / 2 - 10} height={80} delay={400} />
          </View>
          
          <SkeletonCard width={width - 80} height={60} delay={600} />
          
          <View style={styles.skeletonRow}>
            <SkeletonPulse width={60} height={60} borderRadius={30} delay={800} />
            <SkeletonPulse width={120} height={20} delay={1000} />
            <SkeletonPulse width={80} height={20} delay={1200} />
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth }
                ]}
              >
                <LinearGradient
                  colors={['#FF6B35', '#E55A2B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
          </View>
          
          <Text style={styles.statusText}>{currentStep}</Text>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>

        <View style={styles.featuresSection}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={styles.featureItem}>
              <SkeletonPulse width={24} height={24} borderRadius={12} delay={1400 + index * 200} />
              <SkeletonPulse width={40} height={12} delay={1600 + index * 200} />
            </View>
          ))}
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  skeletonSection: {
    width: '100%',
    marginBottom: 40,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonCard: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  shimmerGradient: {
    flex: 1,
  },
  skeletonPulse: {
    backgroundColor: '#2A2A42',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressGradient: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 200,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});