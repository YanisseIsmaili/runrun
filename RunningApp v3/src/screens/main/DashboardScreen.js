import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRun } from '../../context/RunContext';
import { useSettings } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    runHistory, 
    loading, 
    fetchRunHistory, 
    getWeeklyStats, 
    formatDuration 
  } = useRun();
  const { formatDistance } = useSettings();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await fetchRunHistory();
    } catch (error) {
      console.error('Erreur:', error);
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

  const weeklyStats = getWeeklyStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.first_name || 'Runner'} !
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
        {/* Statistiques rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cette semaine</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="fitness-outline" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{weeklyStats.runs}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="navigate-outline" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{formatDistance(weeklyStats.distance / 1000)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#FF9800" />
              <Text style={styles.statValue}>{formatDuration(weeklyStats.duration)}</Text>
              <Text style={styles.statLabel}>Temps</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="speedometer-outline" size={24} color="#9C27B0" />
              <Text style={styles.statValue}>{weeklyStats.averagePace}</Text>
              <Text style={styles.statLabel}>Allure</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('Running')}
            >
              <Ionicons name="play-circle" size={32} color="white" />
              <Text style={styles.quickActionText}>Nouvelle course</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => navigation.navigate('Proposed')}
            >
              <Ionicons name="map" size={32} color="white" />
              <Text style={styles.quickActionText}>Parcours</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => navigation.navigate('History')}
            >
              <Ionicons name="analytics" size={32} color="white" />
              <Text style={styles.quickActionText}>Historique</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#607D8B' }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="settings" size={32} color="white" />
              <Text style={styles.quickActionText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Courses récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses récentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {runHistory.length > 0 ? (
            runHistory.slice(0, 3).map((run) => (
              <TouchableOpacity
                key={run.id}
                style={styles.runItem}
                onPress={() => navigation.navigate('RunDetail', { runId: run.id })}
              >
                <View style={styles.runItemIconContainer}>
                  <Ionicons name="fitness" size={24} color="#4CAF50" />
                </View>
                <View style={styles.runItemDetails}>
                  <Text style={styles.runItemDistance}>
                    {formatDistance((run.distance || 0) / 1000)}
                  </Text>
                  <Text style={styles.runItemDate}>
                    {new Date(run.startTime).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.runItemStats}>
                  <Text style={styles.runItemDuration}>
                    {formatDuration(run.duration || 0)}
                  </Text>
                  <Text style={styles.runItemPace}>
                    {run.pace || '00:00'}/km
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="fitness-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                Aucune course enregistrée.{'\n'}Commencez votre première course !
              </Text>
              <TouchableOpacity
                style={styles.startRunButton}
                onPress={() => navigation.navigate('Running')}
              >
                <Text style={styles.startRunButtonText}>Démarrer une course</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  motivationalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: (width - 52) / 2,
    aspectRatio: 1.2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
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
  runItemDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  runItemDate: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    elevation: 1,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  startRunButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startRunButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default DashboardScreen;