import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RunHistoryScreen from './screens/RunHistoryScreen';

import AuthService from './services/AuthService';
import RunService from './services/RunService';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

function GeoDebugJoystick({ onLocationUpdate, children, isRunning = false }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

const AITrainer = ({ isRunning, runData, onMessage }) => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    if (isRunning && runData) {
      const interval = setInterval(() => {
        const motivationalMessages = [
          "💪 Excellent rythme ! Continue comme ça !",
          "🎯 Tu es dans ta zone optimale !",
          "🔥 Superbe performance !",
          "⚡ Tu peux accélérer maintenant !",
          "🏃‍♂️ Garde ce rythme parfait !",
          "🌟 Tu dépasses tes limites !",
          "💧 N'oublie pas de t'hydrater !",
          "🏆 Champion en action !"
        ];
        
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        
        setMessages(prev => [
          { id: Date.now(), text: randomMessage, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4)
        ]);
        
        onMessage && onMessage(randomMessage);
      }, 45000);
      
      return () => clearInterval(interval);
    }
  }, [isRunning, runData]);

  return (
    <>
      <TouchableOpacity
        style={styles.trainerButton}
        onPress={() => setVisible(!visible)}
      >
        <LinearGradient
          colors={visible ? ['#8B5CF6', '#EC4899'] : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
          style={styles.trainerButtonGradient}
        >
          <Ionicons name="fitness" size={16} color="white" />
          <Text style={styles.trainerText}>
            {visible ? 'COACH ON' : 'COACH'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {visible && (
        <View style={styles.trainerPanel}>
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(139,92,246,0.2)']}
            style={styles.trainerPanelGradient}
          >
            <View style={styles.trainerHeader}>
              <Text style={styles.trainerTitle}>🤖 AI Coach</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            {isRunning && runData && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>📊 Analyse temps réel</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statText}>
                    Distance: {(runData.distance / 1000).toFixed(2)}km
                  </Text>
                  <Text style={styles.statText}>
                    Vitesse: {runData.speed.toFixed(1)} km/h
                  </Text>
                </View>
              </View>
            )}
            
            {messages.length > 0 && (
              <View style={styles.messagesSection}>
                <Text style={styles.sectionTitle}>💬 Messages du coach</Text>
                {messages.slice(0, 3).map(message => (
                  <View key={message.id} style={styles.messageItem}>
                    <Text style={styles.messageText}>{message.text}</Text>
                    <Text style={styles.messageTime}>{message.time}</Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </View>
      )}
    </>
  );
};

function MainRunScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [previousLocation, setPreviousLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [followUser, setFollowUser] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [trainerMessage, setTrainerMessage] = useState('');

  const intervalRef = useRef(null);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    checkAuth();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, startTime]);

  const checkAuth = async () => {
    const isAuthenticated = await AuthService.isAuthenticated();
    if (!isAuthenticated) {
      navigation.replace('Login');
      return;
    }
    const userData = await AuthService.getUser();
    setUser(userData);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert('Permission refusée', 'Géolocalisation requise pour utiliser l\'app');
      }
    } catch (error) {
      console.error('Erreur permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      setMapInitialized(true);
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          onPress: async () => {
            await AuthService.logout();
            navigation.replace('Splash');
          }
        }
      ]
    );
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (newLocation) => {
          setLocation(newLocation);
          
          if (isRunning && !iPaused && previousLocation) {
            const currentSpeed = (newLocation.coords.speed && newLocation.coords.speed > 0) ? 
              newLocation.coords.speed * 3.6 : 0;
            setSpeed(currentSpeed);
            
            if (currentSpeed > maxSpeed) {
              setMaxSpeed(currentSpeed);
            }
            
            const newDistance = calculateDistance(
              previousLocation.coords,
              newLocation.coords
            );
            
            setDistance(prev => prev + newDistance);
            
            const newCoordinate = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            };
            setRouteCoordinates(prev => [...prev, newCoordinate]);
          }
          
          setPreviousLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Erreur tracking:', error);
    }
  };

  const calculateDistance = (coords1, coords2) => {
    const R = 6371000;
    const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coords1.latitude * Math.PI / 180) *
      Math.cos(coords2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startRun = () => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setDistance(0);
    setRouteCoordinates([]);
    setSpeed(0);
    setMaxSpeed(0);
    setFollowUser(true);
    
    if (location) {
      setRouteCoordinates([{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }]);
      setPreviousLocation(location);
    }
    
    startLocationTracking();
    setTrainerMessage("🚀 C'est parti ! Commence par un échauffement en douceur.");
  };

  const pauseRun = () => {
    setIsPaused(true);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setTrainerMessage("⏸️ Pause bien méritée ! Hydrate-toi et reprends quand tu es prêt.");
  };

  const resumeRun = () => {
    setIsPaused(false);
    startLocationTracking();
    setTrainerMessage("▶️ C'est reparti ! Retrouve ton rythme progressivement.");
  };

  const stopRun = async () => {
    Alert.alert(
      'Arrêter la course',
      'Voulez-vous vraiment arrêter la course ?',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: async () => {
            setIsRunning(false);
            setIsPaused(false);
            
            if (locationSubscription.current) {
              locationSubscription.current.remove();
              locationSubscription.current = null;
            }
            
            try {
              await RunService.saveRun({
                distance,
                duration: elapsedTime,
                route: routeCoordinates,
                maxSpeed,
                avgSpeed: distance > 0 ? (distance / (elapsedTime / 1000)) * 3.6 : 0,
                date: new Date().toISOString()
              });
              
              Alert.alert('Course sauvegardée !');
            } catch (error) {
              console.error('Erreur sauvegarde:', error);
            }
          }
        }
      ]
    );
  };

  const handleTrainerMessage = (message) => {
    setTrainerMessage(message);
    setTimeout(() => setTrainerMessage(''), 5000);
  };

  const formatTime = (time) => {
    const seconds = Math.floor(time / 1000) % 60;
    const minutes = Math.floor(time / (1000 * 60)) % 60;
    const hours = Math.floor(time / (1000 * 60 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!locationPermission) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={styles.loadingGradient}
        >
          <Ionicons name="location-outline" size={60} color="#FF6B6B" />
          <Text style={styles.loadingTitle}>Géolocalisation requise</Text>
          <Text style={styles.loadingText}>RunTracker a besoin d'accéder à votre position</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
            <Text style={styles.permissionButtonText}>Autoriser</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={styles.loadingGradient}
        >
          <Ionicons name="locate" size={60} color="#4CAF50" />
          <Text style={styles.loadingTitle}>Recherche position GPS</Text>
          <Text style={styles.loadingText}>Activation du GPS en cours...</Text>
        </LinearGradient>
      </View>
    );
  }

  const runData = {
    distance,
    speed,
    formattedTime: formatTime(elapsedTime),
    elapsedTime
  };

  return (
    <GeoDebugJoystick>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.userHeader}>
          <Text style={styles.welcomeText}>
            Salut {user?.username || 'Coureur'} ! 👋
          </Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <AITrainer
          isRunning={isRunning}
          runData={runData}
          onMessage={handleTrainerMessage}
        />
        
        {trainerMessage ? (
          <View style={styles.floatingMessage}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.floatingMessageGradient}
            >
              <Ionicons name="chatbubble" size={16} color="white" />
              <Text style={styles.floatingMessageText}>{trainerMessage}</Text>
            </LinearGradient>
          </View>
        ) : null}
        
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onPanDrag={() => setFollowUser(false)}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Ma position"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
          
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#4CAF50"
              strokeWidth={4}
            />
          )}
          
          <Circle
            center={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            radius={location.coords.accuracy || 10}
            fillColor="rgba(76, 175, 80, 0.1)"
            strokeColor="rgba(76, 175, 80, 0.3)"
            strokeWidth={1}
          />
        </MapView>
        
        <View style={styles.runInterface}>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Temps</Text>
              <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{(distance / 1000).toFixed(2)} km</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Vitesse</Text>
              <Text style={styles.statValue}>{speed.toFixed(1)} km/h</Text>
            </View>
          </View>
          
          <View style={styles.controlsContainer}>
            {!isRunning ? (
              <TouchableOpacity style={styles.startButton} onPress={startRun}>
                <Ionicons name="play" size={30} color="white" />
                <Text style={styles.buttonText}>Démarrer</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.runningControls}>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.pauseButton]} 
                  onPress={isPaused ? resumeRun : pauseRun}
                >
                  <Ionicons name={isPaused ? "play" : "pause"} size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.stopButton]} 
                  onPress={stopRun}
                >
                  <Ionicons name="stop" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => navigation.navigate('RunHistory')}
          >
            <Ionicons name="list" size={20} color="white" />
            <Text style={styles.historyButtonText}>Historique</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.centerButton}
          onPress={() => {
            setFollowUser(true);
            if (location && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }, 1000);
            }
          }}
        >
          <Ionicons name="locate" size={24} color={followUser ? "#4CAF50" : "#666"} />
        </TouchableOpacity>
      </View>
    </GeoDebugJoystick>
  );
}

function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !username || !firstName || !lastName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await AuthService.register({
        email,
        password,
        username,
        first_name: firstName,
        last_name: lastName
      });
      
      if (result.success) {
        Alert.alert('Succès', 'Inscription réussie !', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Main')
          }
        ]);
      } else {
        Alert.alert('Erreur', result.message || 'Échec de l\'inscription');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inscription</Text>
        </View>

        <ScrollView style={styles.registerForm} showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              placeholderTextColor="#666"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor="#666"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="at-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmer mot de passe"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.registerSubmitButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#666', '#555'] : ['#4CAF50', '#45a049']}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>Inscription...</Text>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="white" />
                  <Text style={styles.buttonText}>S'inscrire</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ? 
              <Text style={styles.linkHighlight}> Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainRunScreen} />
        <Stack.Screen name="RunHistory" component={RunHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  welcomeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 5,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    position: 'absolute',
    top: 3,
    left: 3,
  },
  trainerButton: {
    position: 'absolute',
    top: 110,
    left: 20,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 5,
  },
  trainerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trainerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 4,
  },
  trainerPanel: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 10,
  },
  trainerPanelGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  trainerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trainerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  messagesSection: {
    marginBottom: 16,
  },
  messageItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
  },
  floatingMessage: {
    position: 'absolute',
    top: height * 0.25,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 998,
  },
  floatingMessageGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  floatingMessageText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  runInterface: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: 20,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 5,
  },
  centerButton: {
    position: 'absolute',
    top: 160,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  registerForm: {
    flex: 1,
    paddingHorizontal: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: 'white',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  registerSubmitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  loginLink: {
    padding: 15,
    alignItems: 'center',
  },
  loginLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  linkHighlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});