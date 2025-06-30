// // MainRunScreen.js - Design minimaliste vertical
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   Animated,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import MapView, { Polyline } from 'react-native-maps';
// import * as Location from 'expo-location';
// import AuthService from '../services/AuthService';
// import RunService from '../services/RunService';
// import { THEME } from '../config/config';

// export default function MainRunScreen({ navigation }) {
//   const [isRunning, setIsRunning] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const [time, setTime] = useState(0);
//   const [distance, setDistance] = useState(0);
//   const [averageSpeed, setAverageSpeed] = useState(0);
//   const [instantSpeed, setInstantSpeed] = useState(0);
//   const lastSpeedReadings = useRef([]);
//   const lastUpdateTime = useRef(null);
//   const [calories, setCalories] = useState(0);
//   const [route, setRoute] = useState([]);
//   const [region, setRegion] = useState(null);
//   const [user, setUser] = useState(null);

//   const intervalRef = useRef(null);
//   const lastPositionRef = useRef(null);
//   const startTimeRef = useRef(null);
//   const breatheAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     initializeApp();
//     startBreatheAnimation();
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, []);

//   const startBreatheAnimation = () => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(breatheAnim, {
//           toValue: 1.05,
//           duration: 2000,
//           useNativeDriver: true,
//         }),
//         Animated.timing(breatheAnim, {
//           toValue: 1,
//           duration: 2000,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   };

//   const initializeApp = async () => {
//     try {
//       const userData = await AuthService.getUser();
//       setUser(userData);

//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status === 'granted') {
//         const location = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.BestForNavigation,
//           maximumAge: 10000,
//         });
        
//         const initialRegion = {
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//           latitudeDelta: 0.005,
//           longitudeDelta: 0.005,
//         };
        
//         setRegion(initialRegion);
//         lastPositionRef.current = {
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//         };
        
//         console.log('Position initiale:', location.coords);
//       } else {
//         Alert.alert('GPS requis', 'Veuillez activer la géolocalisation');
//       }
//     } catch (error) {
//       console.error('Erreur GPS:', error);
//       Alert.alert('Erreur GPS', 'Impossible d\'obtenir votre position');
//     }
//   };

//   const startRun = () => {
//     setIsRunning(true);
//     setIsPaused(false);
//     startTimeRef.current = Date.now();
//     lastUpdateTime.current = Date.now();
    
//     // Réduire la fréquence à 3 secondes pour plus de précision
//     intervalRef.current = setInterval(() => {
//       if (!isPaused) {
//         setTime(prev => prev + 3);
//         setCalories(prev => prev + 0.3);
//         trackLocation();
//       }
//     }, 3000);
//   };

//   const pauseRun = () => setIsPaused(true);
//   const resumeRun = () => setIsPaused(false);

//   const stopRun = async () => {
//     if (intervalRef.current) clearInterval(intervalRef.current);
    
//     // Validation : course minimum 30 secondes
//     if (time < 30) {
//       Alert.alert('Course trop courte', 'Continuez à courir ! Minimum 30 secondes.');
//       return; // Ne pas reset, juste continuer
//     }

//     // Validation : distance minimum 200 mètres
//     if (distance < 200) {
//       Alert.alert('Distance insuffisante', 'Continuez à courir ! Minimum 200 mètres.');
//       return; // Ne pas reset, juste continuer
//     }
    
//     // Calculs validés
//     const avgSpeedKmh = (distance / 1000) / (time / 3600);
//     const maxSpeedFromArray = lastSpeedReadings.current.length > 0 ? Math.max(...lastSpeedReadings.current) : 0;
    
//     const runData = {
//       date: startTimeRef.current,
//       duration: time,
//       distance: distance,
//       route: route,
//       maxSpeed: Math.min(maxSpeedFromArray, 25), // Max réaliste 25 km/h
//       avgSpeed: Math.min(avgSpeedKmh, 20), // Max réaliste 20 km/h
//       status: 'finished',
//     };

//     console.log('🏃 Données course:', {
//       temps: `${time}s`,
//       distance: `${distance}m`,
//       vitesseMoy: `${runData.avgSpeed.toFixed(1)} km/h`
//     });

//     try {
//       await RunService.saveRun(runData);
//       Alert.alert('✅ Course terminée', `Félicitations !\n${(distance/1000).toFixed(2)} km en ${formatTime(time)}\nVitesse: ${runData.avgSpeed.toFixed(1)} km/h`);
//       resetRun();
//     } catch (error) {
//       Alert.alert('❌ Erreur', 'Impossible de sauvegarder la course');
//     }
//   };

//   const resetRun = () => {
//     setIsRunning(false);
//     setIsPaused(false);
//     setTime(0);
//     setDistance(0);
//     setInstantSpeed(0);
//     setAverageSpeed(0);
//     setCalories(0);
//     setRoute([]);
//     lastSpeedReadings.current = [];
//   };

//   const trackLocation = async () => {
//     try {
//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.BestForNavigation,
//         maximumAge: 1000,
//         timeout: 10000,
//       });
      
//       const { latitude, longitude } = location.coords;
//       const newPoint = { latitude, longitude };
//       const currentTime = Date.now();
      
//       // Mettre à jour la région
//       setRegion({
//         latitude,
//         longitude,
//         latitudeDelta: 0.005,
//         longitudeDelta: 0.005,
//       });
      
//       if (lastPositionRef.current && lastUpdateTime.current) {
//         const dist = calculateDistance(lastPositionRef.current, newPoint);
//         const timeElapsed = (currentTime - lastUpdateTime.current) / 1000; // secondes
        
//         // Ignorer les distances > 50m en 3 secondes (= 60 km/h max)
//         if (dist < 50 && dist > 0.5) {
//           setDistance(prev => prev + dist);
          
//           // Calculer vitesse instantanée en km/h
//           const currentSpeed = (dist / timeElapsed) * 3.6;
          
//           // Lissage de la vitesse sur les 5 dernières mesures
//           lastSpeedReadings.current.push(currentSpeed);
//           if (lastSpeedReadings.current.length > 5) {
//             lastSpeedReadings.current.shift();
//           }
          
//           const smoothedSpeed = lastSpeedReadings.current.reduce((a, b) => a + b, 0) / lastSpeedReadings.current.length;
//           setInstantSpeed(Math.max(0, Math.min(smoothedSpeed, 30))); // Max 30 km/h
//         }
//       }
      
//       // Calculer vitesse moyenne totale
//       if (time > 0 && distance > 0) {
//         setAverageSpeed((distance / 1000) / (time / 3600)); // km/h
//       }
      
//       setRoute(prev => [...prev, newPoint]);
//       lastPositionRef.current = newPoint;
//       lastUpdateTime.current = currentTime;
      
//     } catch (error) {
//       console.error('GPS Error:', error);
//     }
//   };

//   const calculateDistance = (pos1, pos2) => {
//     const R = 6371000;
//     const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
//     const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
//     const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
//       Math.sin(dLon/2) * Math.sin(dLon/2);
//     return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//   };

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const pace = distance > 0 ? (time / (distance / 1000) / 60).toFixed(1) : '0.0';

//   return (
//     <SafeAreaView style={styles.container}>
//       <LinearGradient colors={THEME.gradients.background} style={styles.container}>
        
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()}>
//             <Ionicons name="chevron-back" size={28} color={THEME.colors.textPrimary} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Course</Text>
//           <TouchableOpacity onPress={() => navigation.navigate('RunHistory')}>
//             <Ionicons name="list-outline" size={28} color={THEME.colors.textPrimary} />
//           </TouchableOpacity>
//         </View>

//         <ScrollView showsVerticalScrollIndicator={false}>
          
//       {/* Main Timer */}
//       <View style={styles.timerSection}>
//         <Animated.View style={[styles.timerCircle, { transform: [{ scale: breatheAnim }] }]}>
//           <LinearGradient
//             colors={isRunning && !isPaused ? THEME.gradients.success : THEME.gradients.surface}
//             style={styles.timerGradient}
//           >
//             <Text style={styles.timeText}>{formatTime(time)}</Text>
//             <Text style={styles.statusText}>
//               {!isRunning ? 'Prêt' : isPaused ? 'Pause' : 'En cours'}
//             </Text>
//           </LinearGradient>
//         </Animated.View>

//         {/* ➕ Bouton Défis */}
//         <TouchableOpacity 
//           style={styles.challengesButton}
//           onPress={() => navigation.navigate('Challenges')}
//         >
//           <LinearGradient colors={THEME.gradients.cosmic} style={styles.challengesGradient}>
//             <Ionicons name="trophy" size={20} color="white" />
//             <Text style={styles.challengesButtonText}>Défis</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>


//           {/* Stats Grid */}
//           <View style={styles.statsGrid}>
//             <MetricCard
//               icon="location"
//               label="Distance"
//               value={`${(distance / 1000).toFixed(2)}`}
//               unit="km"
//               color={THEME.colors.secondary}
//             />
//             <MetricCard
//               icon="speedometer"
//               label="Vitesse"
//               value={instantSpeed.toFixed(1)}
//               unit="km/h"
//               color={THEME.colors.primary}
//             />
//             <MetricCard
//               icon="timer"
//               label="Allure"
//               value={pace}
//               unit="min/km"
//               color={THEME.colors.accent}
//             />
//             <MetricCard
//               icon="flame"
//               label="Calories"
//               value={Math.round(calories).toString()}
//               unit="kcal"
//               color={THEME.colors.warning}
//             />
//           </View>

//           {/* Map Preview */}
//           {region && (
//             <View style={styles.mapSection}>
//               <Text style={styles.sectionTitle}>Parcours</Text>
//               <View style={styles.mapContainer}>
//                 <MapView
//                   style={styles.map}
//                   region={region}
//                   scrollEnabled={false}
//                   zoomEnabled={false}
//                 >
//                   {route.length > 1 && (
//                     <Polyline
//                       coordinates={route}
//                       strokeColor={THEME.colors.accent}
//                       strokeWidth={3}
//                     />
//                   )}
//                 </MapView>
//               </View>
//             </View>
//           )}

//           {/* Controls */}
//           <View style={styles.controlsSection}>
//             {!isRunning ? (
//               <TouchableOpacity style={styles.startButton} onPress={startRun}>
//                 <LinearGradient colors={THEME.gradients.primary} style={styles.startGradient}>
//                   <Ionicons name="play" size={32} color="white" />
//                   <Text style={styles.startText}>Démarrer</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             ) : (
//               <View style={styles.runControls}>
//                 <TouchableOpacity
//                   style={styles.actionButton}
//                   onPress={isPaused ? resumeRun : pauseRun}
//                 >
//                   <LinearGradient
//                     colors={isPaused ? THEME.gradients.success : THEME.gradients.warning}
//                     style={styles.actionGradient}
//                   >
//                     <Ionicons name={isPaused ? "play" : "pause"} size={24} color="white" />
//                   </LinearGradient>
//                 </TouchableOpacity>
                
//                 <TouchableOpacity style={styles.stopButton} onPress={stopRun}>
//                   <LinearGradient colors={THEME.gradients.error} style={styles.stopGradient}>
//                     <Ionicons name="stop" size={28} color="white" />
//                     <Text style={styles.stopText}>Terminer</Text>
//                   </LinearGradient>
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                 style={styles.challengesButton}
//                 onPress={() => navigation.navigate('Challenges')}
//               >
//                 <LinearGradient colors={THEME.gradients.cosmic} style={styles.challengesGradient}>
//                   <Ionicons name="trophy" size={20} color="white" />
//                   <Text style={styles.challengesButtonText}>Défis</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//               </View>
//             )}
//           </View>

//         </ScrollView>
//       </LinearGradient>
//     </SafeAreaView>
//   );
// }

// const MetricCard = ({ icon, label, value, unit, color }) => (
//   <View style={styles.metricCard}>
//     <LinearGradient colors={THEME.gradients.surface} style={styles.metricGradient}>
//       <Ionicons name={icon} size={24} color={color} />
//       <Text style={styles.metricValue}>{value}</Text>
//       <Text style={styles.metricUnit}>{unit}</Text>
//       <Text style={styles.metricLabel}>{label}</Text>
//     </LinearGradient>
//   </View>
// );

// const styles = StyleSheet.create({
//   container: { flex: 1 },
  
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: THEME.spacing.lg,
//     paddingVertical: THEME.spacing.md,
//   },
//   headerTitle: {
//     ...THEME.typography.title,
//     color: THEME.colors.textPrimary,
//   },
  
//   timerSection: {
//     alignItems: 'center',
//     paddingVertical: THEME.spacing.xl,
//   },
//   timerCircle: {
//     width: 200,
//     height: 200,
//     borderRadius: 100,
//     overflow: 'hidden',
//     ...THEME.shadows.large,
//   },
//   timerGradient: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   timeText: {
//     fontSize: 36,
//     fontWeight: '700',
//     color: THEME.colors.textPrimary,
//   },
//   statusText: {
//     ...THEME.typography.bodySmall,
//     color: THEME.colors.textSecondary,
//     marginTop: THEME.spacing.sm,
//   },
//   challengesButton: {
//   borderRadius: THEME.borderRadius.lg,
//   overflow: 'hidden',
//   margin: THEME.spacing.md,
// },
// challengesGradient: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   justifyContent: 'center',
//   paddingVertical: THEME.spacing.md,
//   paddingHorizontal: THEME.spacing.lg,
// },
// challengesButtonText: {
//   ...THEME.typography.body,
//   color: 'white',
//   marginLeft: THEME.spacing.sm,
//   fontWeight: '600',
// },
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     paddingHorizontal: THEME.spacing.lg,
//     marginBottom: THEME.spacing.xl,
//   },
//   metricCard: {
//     width: '48%',
//     marginRight: '2%',
//     marginBottom: THEME.spacing.md,
//     borderRadius: THEME.borderRadius.lg,
//     overflow: 'hidden',
//   },
//   metricGradient: {
//     padding: THEME.spacing.lg,
//     alignItems: 'center',
//   },
//   metricValue: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: THEME.colors.textPrimary,
//     marginTop: THEME.spacing.sm,
//   },
//   metricUnit: {
//     ...THEME.typography.caption,
//     color: THEME.colors.textMuted,
//   },
//   metricLabel: {
//     ...THEME.typography.bodySmall,
//     color: THEME.colors.textSecondary,
//     marginTop: THEME.spacing.xs,
//   },
  
//   mapSection: {
//     paddingHorizontal: THEME.spacing.lg,
//     marginBottom: THEME.spacing.xl,
//   },
//   sectionTitle: {
//     ...THEME.typography.heading,
//     color: THEME.colors.textPrimary,
//     marginBottom: THEME.spacing.md,
//   },
//   mapContainer: {
//     height: 200,
//     borderRadius: THEME.borderRadius.lg,
//     overflow: 'hidden',
//     ...THEME.shadows.medium,
//   },
//   map: { flex: 1 },
  
//   controlsSection: {
//     paddingHorizontal: THEME.spacing.lg,
//     paddingBottom: THEME.spacing.xl,
//   },
  
//   startButton: {
//     borderRadius: THEME.borderRadius.lg,
//     overflow: 'hidden',
//     ...THEME.shadows.large,
//   },
//   startGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: THEME.spacing.xl,
//   },
//   startText: {
//     ...THEME.typography.title,
//     color: 'white',
//     marginLeft: THEME.spacing.md,
//   },
  
//   runControls: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
  
//   actionButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     overflow: 'hidden',
//     ...THEME.shadows.medium,
//   },
//   actionGradient: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
  
//   stopButton: {
//     flex: 1,
//     marginLeft: THEME.spacing.lg,
//     borderRadius: THEME.borderRadius.lg,
//     overflow: 'hidden',
//     ...THEME.shadows.large,
//   },
//   stopGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: THEME.spacing.lg,
//   },
//   stopText: {
//     ...THEME.typography.heading,
//     color: 'white',
//     marginLeft: THEME.spacing.sm,
//   },
// });