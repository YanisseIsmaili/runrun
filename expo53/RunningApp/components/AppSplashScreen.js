// components/AppSplashScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AppSplashScreen({ 
  isVisible = true, 
  onComplete 
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Séquence d'animations
      Animated.sequence([
        // Apparition du logo
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        
        // Animation du logo
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        
        // Barre de progression
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Disparition
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            onComplete && onComplete();
          });
        }, 500);
      });
    }
  }, [isVisible]);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.7],
  });

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D1B69', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Logo principal */}
        <Animated.View 
          style={[
            styles.logoContainer,
            { 
              transform: [
                { scale: scaleAnim },
                { rotate: logoRotateInterpolate }
              ] 
            }
          ]}
        >
          <LinearGradient
            colors={['#EC4899', '#8B5CF6', '#6366F1']}
            style={styles.logoBackground}
          >
            <Ionicons name="flash" size={60} color="white" />
          </LinearGradient>
        </Animated.View>

        {/* Titre de l'app */}
        <Animated.View 
          style={[
            styles.titleContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.appTitle}>RunTracker</Text>
          <Text style={styles.appSubtitle}>Votre compagnon de course</Text>
        </Animated.View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressBar,
                { width: progressWidth }
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>

        {/* Fonctionnalités */}
        <View style={styles.featuresContainer}>
          <Feature icon="location" text="GPS Précis" delay={500} />
          <Feature icon="analytics" text="Statistiques" delay={700} />
          <Feature icon="map" text="Tracés" delay={900} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Composant Feature
function Feature({ icon, text, delay = 0 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, [delay]);

  return (
    <Animated.View 
      style={[
        styles.feature,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        }
      ]}
    >
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={20} color="#6366F1" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logoContainer: {
    marginBottom: 40,
    elevation: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '300',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  progressTrack: {
    width: width * 0.7,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#EC4899',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
});