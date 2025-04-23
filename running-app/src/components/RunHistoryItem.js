import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RunHistoryItem = ({ 
  run, 
  onPress, 
  formatDate, 
  formatDistance, 
  formatDuration, 
  calculatePace 
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(run)}>
      <View style={styles.dateContainer}>
        <Text style={styles.date}>{formatDate(run.startTime)}</Text>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={16} color="#4CAF50" />
            <Text style={styles.statValue}>{formatDistance(run.distance)} km</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#4CAF50" />
            <Text style={styles.statValue}>{formatDuration(run.duration)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={16} color="#4CAF50" />
            <Text style={styles.statValue}>{calculatePace(run.distance, run.duration)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  date: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  chevronContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});

export default RunHistoryItem;