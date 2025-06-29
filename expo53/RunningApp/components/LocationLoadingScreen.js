// components/LocationLoadingScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LocationLoadingScreen({ 
  isVisible = true, 
  message = "Initialisation de la géolocalisation...",
  onLoadingComplete 
}) {
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Animations continues
      startContinuousAnimations();
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onLoadingComplete && onLoadingComplete();
      });
    }
  }, [isVisible]);

  const startContinuousAnimations = () => {
    // Animation de pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation de rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Animation des points
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D1B69']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Cercles d'arrière-plan animés */}
        <View style={styles.backgroundCircles}>
          <Animated.View 
            style={[
              styles.backgroundCircle,
              styles.circle1,
              { transform: [{ scale: pulseAnim }, { rotate: rotateInterpolate }] }
            ]}
          />
          <Animated.View 
            style={[
              styles.backgroundCircle,
              styles.circle2,
              { transform: [{ scale: pulseAnim }, { rotate: rotateInterpolate }] }
            ]}
          />
          <Animated.View 
            style={[
              styles.backgroundCircle,
              styles.circle3,
              { transform: [{ scale: pulseAnim }] }
            ]}
          />
        </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          {/* Icône GPS animée */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.iconBackground,
                { 
                  transform: [
                    { scale: pulseAnim },
                    { rotate: rotateInterpolate }
                  ] 
                }
              ]}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#EC4899']}
                style={styles.iconGradient}
              >
                <Ionicons name="location" size={40} color="white" />
              </LinearGradient>
            </Animated.View>
            
            {/* Ondes radar */}
            <Animated.View 
              style={[
                styles.radarWave,
                styles.wave1,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
            <Animated.View 
              style={[
                styles.radarWave,
                styles.wave2,
                { 
                  transform: [
                    { scale: pulseAnim },
                    { rotate: rotateInterpolate }
                  ] 
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.radarWave,
                styles.wave3,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
          </View>

          {/* Texte de chargement */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Géolocalisation</Text>
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{message}</Text>
              <AnimatedDots dotsAnim={dotsAnim} />
            </View>
          </View>

          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  transform: [{
                    scaleX: dotsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    })
                  }]
                }
              ]}
            />
          </View>

          {/* Indicateurs de statut */}
          <View style={styles.statusContainer}>
            <StatusIndicator 
              icon="wifi" 
              label="Connexion GPS" 
              active={true}
              pulseAnim={pulseAnim}
            />
            <StatusIndicator 
              icon="map" 
              label="Chargement carte" 
              active={true}
              pulseAnim={pulseAnim}
              delay={500}
            />
            <StatusIndicator 
              icon="location-sharp" 
              label="Position précise" 
              active={false}
              pulseAnim={pulseAnim}
              delay={1000}
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Composant pour les points animés
function AnimatedDots({ dotsAnim }) {
  return (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: dotsAnim.interpolate({
                inputRange: [0, 0.3, 0.6, 1],
                outputRange: index === 0 ? [0.3, 1, 0.3, 0.3] :
                           index === 1 ? [0.3, 0.3, 1, 0.3] :
                                        [0.3, 0.3, 0.3, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

// Composant pour les indicateurs de statut
function StatusIndicator({ icon, label, active, pulseAnim, delay = 0 }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, delay);
  }, [delay]);

  return (
    <Animated.View 
      style={[
        styles.statusItem,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Animated.View 
        style={[
          styles.statusIcon,
          active && { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Ionicons 
          name={icon} 
          size={16} 
          color={active ? '#10B981' : 'rgba(255, 255, 255, 0.4)'} 
        />
      </Animated.View>
      <Text style={[
        styles.statusLabel,
        { color: active ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)' }
      ]}>
        {label}
      </Text>
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
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircles: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    borderColor: 'rgba(139, 92, 246, 0.05)',
  },
  circle3: {
    width: width * 1.6,
    height: width * 1.6,
    borderColor: 'rgba(236, 72, 153, 0.03)',
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarWave: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  wave1: {
    width: 140,
    height: 140,
    top: -20,
    left: -20,
  },
  wave2: {
    width: 180,
    height: 180,
    top: -40,
    left: -40,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  wave3: {
    width: 220,
    height: 220,
    top: -60,
    left: -60,
    borderColor: 'rgba(236, 72, 153, 0.1)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 2,
  },
  progressContainer: {
    width: width * 0.6,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 40,
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 2,
    transformOrigin: 'left',
  },
  statusContainer: {
    width: '100%',
    maxWidth: 300,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIcon: {
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});