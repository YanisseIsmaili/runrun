import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRun } from '../../context/RunContext';
import { useAuth } from '../../context/AuthContext';

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

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { runHistory, loading, fetchRunHistory, formatDuration } = useRun();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRuns: 0,
    totalDistance: 0,
    totalDuration: 0,
    weeklyDistance: 0,
    weeklyDuration: 0,
    bestPace: 0,
  });

  useEffect(() => {
    fetchRunHistory();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [runHistory]);

  const calculateStats = () => {
    if (!runHistory || runHistory.length === 0) {
      return;
    }

    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    let totalDistance = 0;
    let totalDuration = 0;
    let weeklyDistance = 0;
    let weeklyDuration = 0;
    let bestPace = Infinity;

    runHistory.forEach(run => {
      totalDistance += run.distance || 0;
      totalDuration += run.duration || 0;

      const runDate = new Date(run.endTime || run.startTime);
      if (runDate >= startOfWeek) {
        weeklyDistance += run.distance || 0;
        weeklyDuration += run.duration || 0;
      }

      if (run.distance && run.duration) {
        const pace = (run.duration / 60) / (run.distance / 1000);
        if (pace < bestPace && pace > 0) {
          bestPace = pace;
        }
      }
    });

    setStats({
      totalRuns: runHistory.length,
      totalDistance,
      totalDuration,
      weeklyDistance,
      weeklyDuration,
      bestPace: bestPace === Infinity ? 0 : bestPace,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRunHistory();
    setRefreshing(false);
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const StatsCard = ({ title, value, icon }) => (
    <View style={styles.statsCard}>
      <Ionicons name={icon} size={24} color="#4CAF50" style={styles.cardIcon} />
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );

  const DailyExerciseCard = ({ title, description, difficulty, icon, onPress }) => {
    const getDifficultyColor = () => {
      switch (difficulty.toLowerCase()) {
        case 'facile':
          return '#4CAF50';
        case 'modéré':
          return '#FF9800';
        case 'difficile':
          return '#F44336';
        default:
          return '#4CAF50';
      }
    };

    return (
      <TouchableOpacity style={styles.exerciseCard} onPress={onPress}>
        <View style={styles.exerciseIconContainer}>
          <Ionicons name={icon} size={32} color={getDifficultyColor()} />
          <View 
            style={[
              styles.difficultyBadge, 
              { backgroundColor: getDifficultyColor() }
            ]}
          >
            <Text style={styles.difficultyText}>{difficulty.charAt(0)}</Text>
          </View>
        </View>
        
        <View style={styles.exerciseContentContainer}>
          <Text style={styles.exerciseTitle}>{title}</Text>
          <Text style={styles.exerciseDescription}>{description}</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
      </TouchableOpacity>
    );
  };

  const dailyExercises = [
    {
      id: '1',
      title: 'Course légère',
      description: '30 minutes à un rythme confortable',
      difficulty: 'Facile',
      icon: 'walk-outline'
    },
    {
      id: '2',
      title: 'Intervalles',
      description: '5 x 400m rapide avec 2 min de récupération',
      difficulty: 'Modéré',
      icon: 'speedometer-outline'
    },
    {
      id: '3',
      title: 'Course longue',
      description: '60 minutes à un rythme régulier',
      difficulty: 'Difficile',
      icon: 'fitness-outline'
    }
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
        />
      }
    >
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Bonjour, {user?.name || 'Coureur'}!
        </Text>
        <Text style={styles.subGreeting}>
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {/* Statistiques */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Vos statistiques</Text>
        
        {loading ? (
          <CustomActivityIndicator size={40} color="#4CAF50" style={styles.loader} />
        ) : (
          <View style={styles.statsGrid}>
            <StatsCard
              title="Courses"
              value={stats.totalRuns.toString()}
              icon="flag-outline"
            />
            <StatsCard
              title="Distance totale"
              value={`${formatDistance(stats.totalDistance)} km`}
              icon="trending-up-outline"
            />
            <StatsCard
              title="Cette semaine"
              value={`${formatDistance(stats.weeklyDistance)} km`}
              icon="calendar-outline"
            />
            <StatsCard
              title="Meilleur rythme"
              value={`${formatPace(stats.bestPace)} min/km`}
              icon="stopwatch-outline"
            />
          </View>
        )}
      </View>

      {/* Démarrer une course */}
      <TouchableOpacity
        style={styles.startRunButton}
        onPress={() => navigation.navigate('Running')}
      >
        <Ionicons name="play-circle-outline" size={24} color="white" />
        <Text style={styles.startRunButtonText}>Démarrer une course</Text>
      </TouchableOpacity>

      {/* Exercices quotidiens */}
      <View style={styles.exercisesSection}>
        <Text style={styles.sectionTitle}>Programme du jour</Text>
        
        {dailyExercises.map(exercise => (
          <DailyExerciseCard
            key={exercise.id}
            title={exercise.title}
            description={exercise.description}
            difficulty={exercise.difficulty}
            icon={exercise.icon}
            onPress={() => {
              console.log('Exercice sélectionné:', exercise.title);
            }}
          />
        ))}
      </View>

      {/* Dernières courses */}
      <View style={styles.recentRunsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Courses récentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {runHistory.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="fitness-outline" size={50} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>
              Vous n'avez pas encore enregistré de course.
            </Text>
          </View>
        ) : (
          runHistory
            .slice(0, 3)
            .map(run => (
              <View key={run.id} style={styles.runItem}>
                <View style={styles.runItemIconContainer}>
                  <Ionicons name="footsteps-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.runItemDetails}>
                  <Text style={styles.runItemDate}>
                    {new Date(run.startTime).toLocaleDateString('fr-FR')}
                  </Text>
                  <Text style={styles.runItemDistance}>
                    {formatDistance(run.distance)} km
                  </Text>
                </View>
                <View style={styles.runItemStats}>
                  <Text style={styles.runItemDuration}>
                    {formatDuration(run.duration)}
                  </Text>
                  <Text style={styles.runItemPace}>
                    {formatPace((run.duration / 60) / (run.distance / 1000))} min/km
                  </Text>
                </View>
              </View>
            ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    color: '#757575',
  },
  loader: {
    marginVertical: 20,
  },
  startRunButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  startRunButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  exercisesSection: {
    marginBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  difficultyBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  exerciseContentContainer: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 12,
    color: '#757575',
  },
  recentRunsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 40,
    marginBottom: 10,
  },
  emptyStateText: {
    color: '#757575',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  runItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  runItemIconContainer: {
    justifyContent: 'center',
    marginRight: 12,
  },
  runItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  runItemDate: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  runItemDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  runItemStats: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  runItemDuration: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  runItemPace: {
    fontSize: 12,
    color: '#757575',
  },
});

export default DashboardScreen;