import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRun } from '../../context/RunContext';
import { useSettings } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // Protection complète du contexte RunContext
  const runContext = useRun();
  const {
    runHistory = [],
    loading = false,
    fetchRunHistory,
    getWeeklyStats,
    formatDuration
  } = runContext || {};
  
  // Protection du contexte SettingsContext
  const settingsContext = useSettings();
  const { formatDistance } = settingsContext || { formatDistance: (d) => `${d.toFixed(2)} km` };

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (fetchRunHistory) {
        await fetchRunHistory();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // Protection de getWeeklyStats avec valeurs par défaut
  const getDefaultWeeklyStats = () => ({
    runs: 0,
    distance: 0,
    duration: 0,
    calories: 0,
    averagePace: '00:00'
  });

  const weeklyStats = getWeeklyStats ? getWeeklyStats() : getDefaultWeeklyStats();

  // Formatage sécurisé des données
  const formatSafeDistance = (distance) => {
    if (typeof distance !== 'number' || isNaN(distance)) return '0.00 km';
    return formatDistance ? formatDistance(distance / 1000) : `${(distance / 1000).toFixed(2)} km`;
  };

  const formatSafeDuration = (duration) => {
    if (typeof duration !== 'number' || isNaN(duration)) return '0:00';
    return formatDuration ? formatDuration(duration) : '0:00';
  };

  // Assurer que runHistory est toujours un tableau
  const safeRunHistory = Array.isArray(runHistory) ? runHistory : [];
  const recentRuns = safeRunHistory.slice(0, 3);

  const formatRunDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.first_name || user?.firstName || 'Runner'} !
          </Text>
          <Text style={styles.motivationalText}>
            Prêt pour votre prochaine course ?
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={32} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques de la semaine */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cette semaine</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="footsteps-outline" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{weeklyStats.runs || 0}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="speedometer-outline" size={24} color="#FF9800" />
              <Text style={styles.statValue}>
                {formatSafeDistance(weeklyStats.distance || 0)}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#2196F3" />
              <Text style={styles.statValue}>
                {formatSafeDuration(weeklyStats.duration || 0)}
              </Text>
              <Text style={styles.statLabel}>Temps</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="flame-outline" size={24} color="#F44336" />
              <Text style={styles.statValue}>{weeklyStats.calories || 0}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('Run')}
            >
              <Ionicons name="play-circle-outline" size={32} color="white" />
              <Text style={styles.quickActionText}>Nouvelle course</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => navigation.navigate('History')}
            >
              <Ionicons name="list-outline" size={32} color="white" />
              <Text style={styles.quickActionText}>Historique</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => navigation.navigate('Statistics')}
            >
              <Ionicons name="bar-chart-outline" size={32} color="white" />
              <Text style={styles.quickActionText}>Statistiques</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={32} color="white" />
              <Text style={styles.quickActionText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Courses récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses récentes</Text>
            {safeRunHistory.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="refresh-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>Chargement...</Text>
            </View>
          ) : recentRuns.length > 0 ? (
            recentRuns.map((run, index) => (
              <TouchableOpacity 
                key={run.id || index} 
                style={styles.runItem}
                onPress={() => navigation.navigate('RunDetail', { run })}
              >
                <View style={styles.runItemIconContainer}>
                  <Ionicons name="footsteps" size={24} color="#4CAF50" />
                </View>
                
                <View style={styles.runItemDetails}>
                  <Text style={styles.runItemDistance}>
                    {formatSafeDistance(run.distance || 0)}
                  </Text>
                  <Text style={styles.runItemDate}>
                    {formatRunDate(run.startTime || run.date)}
                  </Text>
                </View>
                
                <View style={styles.runItemStats}>
                  <Text style={styles.runItemDuration}>
                    {formatSafeDuration(run.duration || 0)}
                  </Text>
                  <Text style={styles.runItemPace}>
                    {run.pace || '00:00'}/km
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="footsteps-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                Aucune course enregistrée.{'\n'}
                Commencez votre première course !
              </Text>
              <TouchableOpacity
                style={styles.startRunButton}
                onPress={() => navigation.navigate('Run')}
              >
                <Text style={styles.startRunButtonText}>Commencer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Objectif hebdomadaire */}
        <View style={styles.section}>
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="trophy-outline" size={24} color="#FFD700" />
              <Text style={styles.goalTitle}>Objectif hebdomadaire</Text>
            </View>
            
            <View style={styles.goalProgress}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min((weeklyStats.distance / 1000 / 10) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.goalText}>
                {(weeklyStats.distance / 1000).toFixed(1)} / 10.0 km
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  motivationalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 48) / 2,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 48) / 2,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  quickActionText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 14,
  },
  runItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  runItemIconContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  runItemDetails: {
    flex: 1,
  },
  runItemDistance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  runItemDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  runItemStats: {
    alignItems: 'flex-end',
  },
  runItemDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  runItemPace: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  startRunButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  startRunButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  goalProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 14,
    color: '#666',
  },
});

export default DashboardScreen;   