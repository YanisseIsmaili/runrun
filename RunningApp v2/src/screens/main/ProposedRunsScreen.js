import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as proposedRunsService from '../../services/proposedRuns';
import { useRun } from '../../context/RunContext';

const { width } = Dimensions.get('window');

// Composant ActivityIndicator personnalisé
const CustomActivityIndicator = ({ size = 40, color = "#4CAF50", style }) => {
  const indicatorSize = typeof size === 'string' ? (size === 'large' ? 40 : 20) : size;
  
  return (
    <View style={[{ 
      width: indicatorSize, 
      height: indicatorSize,
      justifyContent: 'center',
      alignItems: 'center'
    }, style]}>
      <View
        style={{
          width: indicatorSize,
          height: indicatorSize,
          borderRadius: indicatorSize / 2,
          borderWidth: 2,
          borderColor: color,
          borderTopColor: 'transparent',
        }}
      />
    </View>
  );
};

const ProposedRunsScreen = ({ navigation }) => {
  const [proposedRuns, setProposedRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { startRun } = useRun();

  // Données de test en cas d'échec de l'API
  const mockData = [
    {
      id: 1,
      title: 'Course matinale facile',
      description: 'Une course parfaite pour commencer la journée en douceur. Idéale pour les débutants ou comme échauffement.',
      distance: 3000,
      estimated_duration: 1800,
      difficulty: 'facile',
      target_pace: '6:00',
      instructions: 'Commencez par 5 minutes de marche rapide, puis maintenez un rythme confortable pendant toute la course. Terminez par 5 minutes d\'étirements.',
      tags: ['débutant', 'matinal', 'échauffement', 'récupération']
    },
    {
      id: 2,
      title: 'Entraînement fractionné 5x400m',
      description: 'Séance d\'intervalles pour améliorer votre vitesse et votre capacité anaérobie.',
      distance: 4000,
      estimated_duration: 2100,
      difficulty: 'modéré',
      target_pace: '4:30',
      instructions: 'Échauffement 10 min, puis 5 répétitions de 400m rapide avec 90 secondes de récupération entre chaque. Retour au calme 10 min.',
      tags: ['intervalle', 'vitesse', 'fractionné', 'performance']
    },
    {
      id: 3,
      title: 'Course longue endurance',
      description: 'Course de fond pour développer votre endurance cardiovasculaire et votre résistance.',
      distance: 10000,
      estimated_duration: 3600,
      difficulty: 'difficile',
      target_pace: '6:00',
      instructions: 'Maintenez un rythme régulier et confortable. L\'objectif est de terminer sans être épuisé. Hydratez-vous régulièrement.',
      tags: ['endurance', 'fond', 'marathon', 'cardio']
    },
    {
      id: 4,
      title: 'Course en côte',
      description: 'Entraînement spécifique pour renforcer les jambes et améliorer la puissance.',
      distance: 2500,
      estimated_duration: 1200,
      difficulty: 'difficile',
      target_pace: '4:48',
      instructions: 'Trouvez une côte de 200-300m. Montez en effort soutenu, redescendez en récupération. Répétez 6-8 fois.',
      tags: ['côte', 'puissance', 'force', 'intensif']
    },
    {
      id: 5,
      title: 'Course de récupération',
      description: 'Course très douce pour favoriser la récupération après un entraînement intense.',
      distance: 4000,
      estimated_duration: 1800,
      difficulty: 'facile',
      target_pace: '7:30',
      instructions: 'Rythme très confortable, vous devez pouvoir tenir une conversation. L\'objectif est la récupération active.',
      tags: ['récupération', 'repos actif', 'détente', 'régénération']
    }
  ];

  useEffect(() => {
    loadProposedRuns();
  }, []);

  const loadProposedRuns = async () => {
    try {
      setLoading(true);
      // Tentative de chargement depuis l'API
      try {
        const runs = await proposedRunsService.getProposedRuns();
        setProposedRuns(runs);
      } catch (apiError) {
        console.log('API non disponible, utilisation des données de test');
        setProposedRuns(mockData);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les courses proposées');
      console.error('Error loading proposed runs:', error);
      setProposedRuns(mockData);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProposedRuns();
    setRefreshing(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile':
      case 'easy':
        return '#4CAF50';
      case 'modéré':
      case 'moderate':
        return '#FF9800';
      case 'difficile':
      case 'hard':
        return '#F44336';
      default:
        return '#4CAF50';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile':
      case 'easy':
        return 'walk-outline';
      case 'modéré':
      case 'moderate':
        return 'fitness-outline';
      case 'difficile':
      case 'hard':
        return 'flame-outline';
      default:
        return 'walk-outline';
    }
  };

  const formatDistance = (distance) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)} km`;
    }
    return `${distance} m`;
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const handleStartProposedRun = (run) => {
    Alert.alert(
      'Démarrer cette course',
      `Voulez-vous commencer la course "${run.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: () => {
            setModalVisible(false);
            navigation.navigate('Running', { proposedRun: run });
          }
        }
      ]
    );
  };

  const openRunDetails = (run) => {
    setSelectedRun(run);
    setModalVisible(true);
  };

  const ProposedRunItem = ({ run }) => (
    <TouchableOpacity
      style={styles.runCard}
      onPress={() => openRunDetails(run)}
    >
      <View style={styles.runHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.runTitle}>{run.title}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(run.difficulty) }]}>
            <Text style={styles.difficultyText}>{run.difficulty}</Text>
          </View>
        </View>
        <Ionicons
          name={getDifficultyIcon(run.difficulty)}
          size={24}
          color={getDifficultyColor(run.difficulty)}
        />
      </View>
      
      <Text style={styles.runDescription}>{run.description}</Text>
      
      <View style={styles.runStats}>
        <View style={styles.statItem}>
          <Ionicons name="trending-up-outline" size={16} color="#757575" />
          <Text style={styles.statText}>{formatDistance(run.distance)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#757575" />
          <Text style={styles.statText}>{formatDuration(run.estimated_duration)}</Text>
        </View>
        
        {run.target_pace && (
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={16} color="#757575" />
            <Text style={styles.statText}>{run.target_pace} min/km</Text>
          </View>
        )}
      </View>
      
      {run.tags && run.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {run.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {run.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{run.tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={60} color="#CCCCCC" />
      <Text style={styles.emptyText}>Aucune course proposée disponible</Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadProposedRuns}
      >
        <Text style={styles.refreshButtonText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomActivityIndicator size={40} color="#4CAF50" />
        <Text style={styles.loadingText}>Chargement des courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={proposedRuns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ProposedRunItem run={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
          />
        }
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de détails */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedRun && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Détails de la course</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.modalContent}>
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedRun.title}</Text>
                  <View style={[
                    styles.detailDifficultyBadge,
                    { backgroundColor: getDifficultyColor(selectedRun.difficulty) }
                  ]}>
                    <Ionicons
                      name={getDifficultyIcon(selectedRun.difficulty)}
                      size={20}
                      color="white"
                    />
                    <Text style={styles.detailDifficultyText}>{selectedRun.difficulty}</Text>
                  </View>
                </View>

                <Text style={styles.detailDescription}>{selectedRun.description}</Text>

                <View style={styles.detailStatsGrid}>
                  <View style={styles.detailStatItem}>
                    <Ionicons name="trending-up-outline" size={22} color="#4CAF50" />
                    <Text style={styles.detailStatValue}>{formatDistance(selectedRun.distance)}</Text>
                    <Text style={styles.detailStatLabel}>Distance</Text>
                  </View>

                  <View style={styles.detailStatItem}>
                    <Ionicons name="time-outline" size={22} color="#4CAF50" />
                    <Text style={styles.detailStatValue}>{formatDuration(selectedRun.estimated_duration)}</Text>
                    <Text style={styles.detailStatLabel}>Durée estimée</Text>
                  </View>

                  {selectedRun.target_pace && (
                    <View style={styles.detailStatItem}>
                      <Ionicons name="speedometer-outline" size={22} color="#4CAF50" />
                      <Text style={styles.detailStatValue}>{selectedRun.target_pace}</Text>
                      <Text style={styles.detailStatLabel}>Allure cible</Text>
                    </View>
                  )}
                </View>

                {selectedRun.instructions && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsTitle}>Instructions</Text>
                    <Text style={styles.instructionsText}>{selectedRun.instructions}</Text>
                  </View>
                )}

                {selectedRun.tags && selectedRun.tags.length > 0 && (
                  <View style={styles.detailTagsContainer}>
                    <Text style={styles.tagsTitle}>Tags</Text>
                    <View style={styles.detailTags}>
                      {selectedRun.tags.map((tag, index) => (
                        <View key={index} style={styles.detailTag}>
                          <Text style={styles.detailTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleStartProposedRun(selectedRun)}
                >
                  <Ionicons name="play-circle-outline" size={24} color="white" />
                  <Text style={styles.startButtonText}>Commencer cette course</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  runCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  runTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  runDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 20,
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  moreTagsText: {
    color: '#757575',
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  detailDifficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailDifficultyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  detailDescription: {
    fontSize: 16,
    color: '#757575',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  detailStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#757575',
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  detailTagsContainer: {
    marginBottom: 20,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  detailTagText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProposedRunsScreen;