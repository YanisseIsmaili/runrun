import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, loading, checkLoginStatus } = useAuth();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Démarrer les animations
    startAnimations();
    
    // Initialiser l'app
    initializeApp();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Navigation après chargement avec délai pour voir l'animation
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login'); // ✅ CORRIGÉ: 'Login' au lieu de 'Auth'
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, navigation]);

  const startAnimations = () => {
    // Animation séquentielle
    Animated.sequence([
      // Fade in et scale de l'icône
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Slide du texte
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation continue pour l'icône
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    // Démarrer la pulsation après un délai
    setTimeout(pulse, 1000);
  };

  const initializeApp = async () => {
    try {
      await checkLoginStatus();
    } catch (error) {
      console.error('Erreur initialisation:', error);
      // En cas d'erreur, rediriger vers l'auth
      setTimeout(() => {
        navigation.replace('Login'); // ✅ CORRIGÉ: 'Login' au lieu de 'Auth'
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      <SafeAreaView style={styles.content}>
        {/* Logo Container */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) }
              ]
            }
          ]}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="fitness" size={80} color="white" />
          </View>
        </Animated.View>

        {/* Title and subtitle */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Running App V3</Text>
          <Text style={styles.subtitle}>Votre compagnon de course</Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View 
          style={[
            styles.loadingContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.loadingBar}>
            <Animated.View 
              style={[
                styles.loadingProgress,
                {
                  transform: [{ scaleX: pulseAnim }]
                }
              ]} 
            />
          </View>
          <Text style={styles.loadingText}>
            {loading ? 'Chargement...' : 'Prêt !'}
          </Text>
        </Animated.View>

        {/* Version info */}
        <Animated.View 
          style={[
            styles.versionContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.versionText}>Version 3.0.0</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingBar: {
    width: 200,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default SplashScreen;