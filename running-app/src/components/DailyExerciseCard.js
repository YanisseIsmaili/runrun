import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DailyExerciseCard = ({ title, description, difficulty, icon, onPress }) => {
  // Déterminer la couleur en fonction de la difficulté
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
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
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
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  iconContainer: {
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
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#757575',
  },
});

export default DailyExerciseCard;