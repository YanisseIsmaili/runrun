import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoadingAnimation({ 
  title = "Chargement...", 
  subtitle = "Veuillez patienter",
  icon = "location",
  iconColor = "#4CAF50"
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation pulsation de l'icône
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation rotation continue
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Animation des points de chargement
    const animateDots = () => {
      const animations = dotsAnim.map((dot, index) =>
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.loop(
        Animated.sequence([
          Animated.parallel(animations),
          Animated.delay(400),
        ])
      ).start();
    };

    animateDots();

    // Animation vague de fond
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Vague animée de fond */}
        <Animated.View 
          style={[
            styles.waveBackground,
            { transform: [{ translateX: waveTranslate }] }
          ]}
        />

        <View style={styles.content}>
          {/* Icône principale avec animations */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.iconBackground,
                {
                  transform: [
                    { scale: pulseAnim },
                    { rotate: rotate }
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[iconColor, iconColor + '80']}
                style={styles.iconGradient}
              >
                <Ionicons name={icon} size={50} color="white" />
              </LinearGradient>
            </Animated.View>

            {/* Cercles concentriques */}
            <View style={styles.ripple1} />
            <View style={styles.ripple2} />
            <View style={styles.ripple3} />
          </View>

          {/* Textes */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Points de chargement animés */}
          <View style={styles.dotsContainer}>
            {dotsAnim.map((dot, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    opacity: dot,
                    transform: [{
                      scale: dot.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      })
                    }]
                  },
                ]}
              />
            ))}
          </View>

          {/* Barre de progression stylisée */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  waveBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 2,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    transform: [{ skewX: '-15deg' }],
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ripple1: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  ripple2: {
    position: 'absolute',
    top: -35,
    left: -35,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  ripple3: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginHorizontal: 5,
  },
  progressContainer: {
    width: width * 0.6,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});