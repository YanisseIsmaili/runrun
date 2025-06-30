import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRun } from '../../context/RunContext';
import * as apiService from '../../services/api';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const runContext = useRun();
  const { runHistory, formatDuration, formatDistance } = runContext || {};
  
  const [weeklyStats, setWeeklyStats] = useState({
    runs: 0,
    distance: 0,
    duration: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [runHistory]);

  const loadDashboardData = async () => {
    try {
      calculateWeeklyStats();
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  const calculateWeeklyStats = () => {
    if (!Array.isArray(runHistory)) return;
    
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyRuns = runHistory.filter(run => {
      const runDate = new Date(run.startTime || run.start_time || run.date);
      return runDate >= weekStart;
    });

    const stats = weeklyRuns.reduce((acc, run) => ({
      runs: acc.runs + 1,
      distance: acc.distance + (run.distance || 0),
      duration: acc.duration + (run.duration || 0),
    }), { runs: 0, distance: 0, duration: 0 });

    setWeeklyStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getInitials = () => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??';
  };

  const formatSafeDistance = (distance) => {
    return formatDistance ? formatDistance(distance / 1000) : `${(distance / 1000).toFixed(2)} km`;
  };

  const formatSafeDuration = (duration) => {
    if (typeof duration !== 'number' || isNaN(duration)) return '0:00';
    return formatDuration ? formatDuration(duration) : '0:00';
  };

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
      
      {/* En-tête avec image profil */}
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
          {user?.profile_picture ? (
            <Image
              source={{ uri: user.profile_picture }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitials}>{getInitials()}</Text>
            </View>
          )}
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
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('Run')}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.actionButtonText}>Commencer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => navigation.navigate('Proposed')}
            >
              <Ionicons name="map" size={24} color="white" />
              <Text style={styles.actionButtonText}>Parcours</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Courses récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernières courses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  motivationalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileButton: {
    marginLeft: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  runItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  runItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  runItemDetails: {
    flex: 1,
  },
  runItemDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  runItemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  runItemStats: {
    alignItems: 'flex-end',
  },
  runItemDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  runItemPace: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyStateContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    borderRadius: 8,
    marginTop: 16,
  },
  startRunButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontWeight: '600',
  },
});

export default DashboardScreen;