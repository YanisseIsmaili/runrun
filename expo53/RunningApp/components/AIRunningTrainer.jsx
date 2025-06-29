// components/AIRunningTrainer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Système d'IA pour l'entraînement
class TrainerAI {
  constructor() {
    this.profile = {
      fitnessLevel: 'intermediate', // beginner, intermediate, advanced
      goals: ['endurance', 'speed'], // endurance, speed, weight_loss, fun
      preferredPace: null,
      restHeartRate: 70,
      maxHeartRate: 190,
    };
    
    this.sessionData = {
      startTime: null,
      segments: [],
      currentSegment: null,
      totalDistance: 0,
      averagePace: 0,
      heartRateZones: {
        warmup: { min: 60, max: 70 },
        aerobic: { min: 70, max: 80 },
        threshold: { min: 80, max: 90 },
        anaerobic: { min: 90, max: 95 },
        neuromuscular: { min: 95, max: 100 }
      }
    };
    
    this.motivationalPhrases = {
      encouragement: [
        "Excellent rythme ! Continue comme ça ! 💪",
        "Tu es dans ta zone optimale ! 🎯",
        "Superbe performance ! 🌟",
        "Tu dépasses tes limites ! 🚀",
        "Quel mental d'acier ! 🔥"
      ],
      pacing: [
        "Ralentis un peu, garde de l'énergie ! 🐢",
        "Tu peux accélérer maintenant ! ⚡",
        "Rythme parfait pour ton objectif ! ✅",
        "Trouve ton rythme de croisière ! 🎵",
        "Écoute ton corps, ajuste ton allure ! 👂"
      ],
      milestone: [
        "1 km de fait ! Tu es lancé(e) ! 🎉",
        "Halfway done ! Plus que la moitié ! 🏁",
        "Dernière ligne droite ! 🏃‍♂️",
        "Tu viens de battre ton record ! 🏆",
        "Objectif distance atteint ! 🎯"
      ],
      recovery: [
        "Prends 30 secondes pour récupérer 😮‍💨",
        "Hydrate-toi maintenant ! 💧",
        "Quelques respirations profondes 🫁",
        "Relâche tes épaules, détends-toi 🧘‍♀️",
        "Parfait pour une pause technique ! ⏸️"
      ]
    };
  }

  // Analyse la performance en temps réel
  analyzePerformance(runData) {
    const { distance, speed, heartRate, duration } = runData;
    const currentPace = speed > 0 ? (1000 / speed) * 60 : 0; // min/km
    
    let analysis = {
      zone: this.getHeartRateZone(heartRate),
      paceStatus: this.analyzePace(currentPace),
      fatigueLevel: this.estimateFatigue(duration, speed),
      suggestions: []
    };

    // Générer des suggestions basées sur l'analyse
    if (analysis.paceStatus === 'too_fast') {
      analysis.suggestions.push({
        type: 'pacing',
        message: this.getRandomPhrase('pacing', 'slow_down'),
        priority: 'high'
      });
    } else if (analysis.paceStatus === 'too_slow') {
      analysis.suggestions.push({
        type: 'pacing',
        message: this.getRandomPhrase('pacing', 'speed_up'),
        priority: 'medium'
      });
    }

    if (analysis.fatigueLevel > 0.7) {
      analysis.suggestions.push({
        type: 'recovery',
        message: this.getRandomPhrase('recovery'),
        priority: 'high'
      });
    }

    return analysis;
  }

  getHeartRateZone(heartRate) {
    if (!heartRate) return 'unknown';
    
    const percentage = (heartRate / this.profile.maxHeartRate) * 100;
    
    if (percentage < 60) return 'warmup';
    if (percentage < 70) return 'aerobic';
    if (percentage < 80) return 'threshold';
    if (percentage < 90) return 'anaerobic';
    return 'neuromuscular';
  }

  analyzePace(currentPace) {
    if (!this.profile.preferredPace) return 'unknown';
    
    const difference = Math.abs(currentPace - this.profile.preferredPace);
    const tolerance = this.profile.preferredPace * 0.1; // 10% de tolérance
    
    if (difference <= tolerance) return 'optimal';
    if (currentPace < this.profile.preferredPace) return 'too_fast';
    return 'too_slow';
  }

  estimateFatigue(duration, currentSpeed) {
    // Estimation simple de la fatigue basée sur la durée et la vitesse
    const timeMinutes = duration / 60;
    const speedKmh = currentSpeed * 3.6;
    
    // Facteur de fatigue basé sur le temps et l'intensité
    const timeFactor = Math.min(timeMinutes / 60, 1); // Max 1 après 1h
    const intensityFactor = Math.min(speedKmh / 15, 1); // Max 1 à 15 km/h
    
    return (timeFactor * 0.6) + (intensityFactor * 0.4);
  }

  getRandomPhrase(category, subtype = null) {
    const phrases = this.motivationalPhrases[category] || [];
    if (phrases.length === 0) return "Continue ! Tu fais du super travail ! 💪";
    
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // Générer un plan d'entraînement pour la session
  generateWorkoutPlan(targetDistance, targetDuration) {
    const plan = {
      phases: [],
      totalDistance: targetDistance,
      estimatedDuration: targetDuration
    };

    // Phase d'échauffement (10% de la distance)
    plan.phases.push({
      name: 'Échauffement',
      distance: targetDistance * 0.1,
      intensity: 'low',
      description: 'Démarrage en douceur pour préparer le corps',
      targetHeartRateZone: 'warmup'
    });

    // Phase principale (80% de la distance)
    plan.phases.push({
      name: 'Phase principale',
      distance: targetDistance * 0.8,
      intensity: 'moderate',
      description: 'Maintenir un rythme constant et confortable',
      targetHeartRateZone: 'aerobic'
    });

    // Phase de récupération (10% de la distance)
    plan.phases.push({
      name: 'Récupération',
      distance: targetDistance * 0.1,
      intensity: 'low',
      description: 'Retour au calme progressif',
      targetHeartRateZone: 'warmup'
    });

    return plan;
  }
}

const AIRunningTrainer = ({ 
  isRunning, 
  runData, 
  onCoachingMessage, 
  onWorkoutSuggestion 
}) => {
  const [trainer] = useState(() => new TrainerAI());
  const [isVisible, setIsVisible] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [coachingMessages, setCoachingMessages] = useState([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  
  const animatedScale = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const lastAnalysisTime = useRef(0);

  // Animation d'apparition
  useEffect(() => {
    if (isVisible) {
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animatedScale, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // Analyse en temps réel des performances
  useEffect(() => {
    if (!isRunning || !runData) return;

    const now = Date.now();
    // Analyser toutes les 10 secondes pour éviter le spam
    if (now - lastAnalysisTime.current < 10000) return;
    
    lastAnalysisTime.current = now;
    
    const analysis = trainer.analyzePerformance(runData);
    setCurrentAnalysis(analysis);

    // Afficher les suggestions importantes
    analysis.suggestions.forEach(suggestion => {
      if (suggestion.priority === 'high') {
        showCoachingMessage(suggestion.message, suggestion.type);
      }
    });
  }, [isRunning, runData]);

  const showCoachingMessage = useCallback((message, type = 'info') => {
    const newMessage = {
      id: Date.now(),
      text: message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };

    setCoachingMessages(prev => [newMessage, ...prev.slice(0, 4)]); // Garder 5 messages max
    
    // Animation d'apparition du message
    Animated.sequence([
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Callback pour l'app principale
    if (onCoachingMessage) {
      onCoachingMessage(newMessage);
    }
  }, [onCoachingMessage]);

  const generateWorkout = () => {
    const plan = trainer.generateWorkoutPlan(5000, 1800); // 5km en 30min par défaut
    setWorkoutPlan(plan);
    setShowWorkoutModal(true);
  };

  const getZoneColor = (zone) => {
    const colors = {
      warmup: '#10B981',
      aerobic: '#3B82F6', 
      threshold: '#F59E0B',
      anaerobic: '#EF4444',
      neuromuscular: '#8B5CF6',
      unknown: '#6B7280'
    };
    return colors[zone] || colors.unknown;
  };

  const getZoneName = (zone) => {
    const names = {
      warmup: 'Échauffement',
      aerobic: 'Aérobie',
      threshold: 'Seuil',
      anaerobic: 'Anaérobie',
      neuromuscular: 'Neuromusculaire',
      unknown: 'Inconnue'
    };
    return names[zone] || names.unknown;
  };

  return (
    <>
      {/* Bouton d'activation du trainer */}
      <TouchableOpacity
        style={styles.trainerButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <LinearGradient
          colors={isVisible ? ['#8B5CF6', '#EC4899'] : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
          style={styles.trainerButtonGradient}
        >
          <Ionicons 
            name={isVisible ? "fitness" : "fitness-outline"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.trainerButtonText}>
            {isVisible ? 'COACH ON' : 'COACH'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Interface du trainer */}
      {isVisible && (
        <Animated.View 
          style={[
            styles.trainerPanel,
            {
              transform: [{ scale: animatedScale }]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(139,92,246,0.2)']}
            style={styles.trainerPanelGradient}
          >
            <View style={styles.trainerHeader}>
              <View style={styles.trainerTitle}>
                <Ionicons name="fitness" size={20} color="#8B5CF6" />
                <Text style={styles.trainerTitleText}>AI Coach</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Analyse en temps réel */}
            {currentAnalysis && isRunning && (
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>📊 Analyse temps réel</Text>
                
                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Zone FC</Text>
                    <View style={[
                      styles.zoneBadge, 
                      { backgroundColor: getZoneColor(currentAnalysis.zone) }
                    ]}>
                      <Text style={styles.zoneText}>
                        {getZoneName(currentAnalysis.zone)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Allure</Text>
                    <Text style={[
                      styles.metricValue,
                      { color: currentAnalysis.paceStatus === 'optimal' ? '#10B981' : '#F59E0B' }
                    ]}>
                      {currentAnalysis.paceStatus === 'optimal' ? '✅ Parfait' :
                       currentAnalysis.paceStatus === 'too_fast' ? '⚡ Trop rapide' :
                       currentAnalysis.paceStatus === 'too_slow' ? '🐢 Trop lent' : '❓ Analyse...'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fatigueBar}>
                  <Text style={styles.metricLabel}>Niveau fatigue</Text>
                  <View style={styles.fatigueBarContainer}>
                    <View 
                      style={[
                        styles.fatigueBarFill,
                        { 
                          width: `${(currentAnalysis.fatigueLevel || 0) * 100}%`,
                          backgroundColor: currentAnalysis.fatigueLevel > 0.7 ? '#EF4444' : 
                                         currentAnalysis.fatigueLevel > 0.5 ? '#F59E0B' : '#10B981'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.fatigueText}>
                    {Math.round((currentAnalysis.fatigueLevel || 0) * 100)}%
                  </Text>
                </View>
              </View>
            )}

            {/* Messages de coaching */}
            {coachingMessages.length > 0 && (
              <View style={styles.messagesSection}>
                <Text style={styles.sectionTitle}>💬 Messages du coach</Text>
                {coachingMessages.slice(0, 3).map(message => (
                  <View key={message.id} style={styles.messageItem}>
                    <Text style={styles.messageText}>{message.text}</Text>
                    <Text style={styles.messageTime}>{message.timestamp}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsSection}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={generateWorkout}
              >
                <Ionicons name="barbell-outline" size={16} color="white" />
                <Text style={styles.actionButtonText}>Nouveau Plan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => showCoachingMessage(trainer.getRandomPhrase('encouragement'))}
              >
                <Ionicons name="heart" size={16} color="white" />
                <Text style={styles.actionButtonText}>Motivation</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Messages flottants */}
      {coachingMessages.length > 0 && (
        <Animated.View 
          style={[
            styles.floatingMessage,
            { opacity: messageOpacity }
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.floatingMessageGradient}
          >
            <Ionicons name="chatbubble" size={16} color="white" />
            <Text style={styles.floatingMessageText}>
              {coachingMessages[0]?.text}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Modal Plan d'entraînement */}
      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#1F2937', '#374151']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📋 Plan d'Entraînement</Text>
                <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {workoutPlan && (
                <View style={styles.workoutContent}>
                  <Text style={styles.workoutDistance}>
                    🎯 Distance: {(workoutPlan.totalDistance / 1000).toFixed(1)}km
                  </Text>
                  
                  {workoutPlan.phases.map((phase, index) => (
                    <View key={index} style={styles.phaseItem}>
                      <View style={styles.phaseHeader}>
                        <Text style={styles.phaseName}>{phase.name}</Text>
                        <Text style={styles.phaseDistance}>
                          {(phase.distance / 1000).toFixed(1)}km
                        </Text>
                      </View>
                      <Text style={styles.phaseDescription}>{phase.description}</Text>
                      <View style={[
                        styles.intensityBadge,
                        { backgroundColor: getZoneColor(phase.targetHeartRateZone) }
                      ]}>
                        <Text style={styles.intensityText}>
                          Zone: {getZoneName(phase.targetHeartRateZone)}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity 
                    style={styles.startWorkoutButton}
                    onPress={() => {
                      setShowWorkoutModal(false);
                      if (onWorkoutSuggestion) {
                        onWorkoutSuggestion(workoutPlan);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.startWorkoutGradient}
                    >
                      <Ionicons name="play" size={20} color="white" />
                      <Text style={styles.startWorkoutText}>Commencer ce plan</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trainerButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  trainerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trainerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 4,
  },
  trainerPanel: {
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerTitleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  analysisSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  zoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoneText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  fatigueBar: {
    marginTop: 8,
  },
  fatigueBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginVertical: 4,
  },
  fatigueBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  fatigueText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
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
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 4,
  },
  floatingMessage: {
    position: 'absolute',
    top: height * 0.3,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  workoutContent: {
    maxHeight: height * 0.6,
  },
  workoutDistance: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  phaseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  phaseDistance: {
    color: '#8B5CF6',
    fontWeight: 'bold',
    fontSize: 12,
  },
  phaseDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 8,
  },
  intensityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  startWorkoutButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  startWorkoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default AIRunningTrainer;