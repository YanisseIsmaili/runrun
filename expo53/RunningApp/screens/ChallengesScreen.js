import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/config';

class ChallengeService {
  
  // Marquer un défi comme complété localement
  static async markChallengeCompleted(challengeId) {
    try {
      const completed = await this.getCompletedChallenges();
      if (!completed.includes(challengeId)) {
        completed.push(challengeId);
        await AsyncStorage.setItem('completed_challenges', JSON.stringify(completed));
      }
    } catch (error) {
      console.error('Erreur sauvegarde défi:', error);
    }
  }

  // Récupérer les défis complétés
  static async getCompletedChallenges() {
    try {
      const completed = await AsyncStorage.getItem('completed_challenges');
      return completed ? JSON.parse(completed) : [];
    } catch (error) {
      return [];
    }
  }

  // Vérifier automatiquement les défis après une course
  static async checkChallengesAfterRun(runData, userStats) {
    const newCompletions = [];
    
    // Logique de vérification basée sur les vraies données
    if (runData.distance >= 1000) {
      newCompletions.push(1); // Premier pas
    }
    
    if (userStats.totalRuns >= 3) {
      newCompletions.push(2); // Régularité
    }
    
    if (runData.duration >= 900) {
      newCompletions.push(3); // 15 minutes
    }
    
    // Marquer les nouveaux défis comme complétés
    for (const challengeId of newCompletions) {
      await this.markChallengeCompleted(challengeId);
    }
    
    return newCompletions;
  }

  // Afficher notification de défi complété
  static showChallengeNotification(challengeId, title) {
    // Vous pouvez utiliser Alert ou une lib de notification
    Alert.alert(
      '🎉 Défi accompli !',
      `Vous avez complété : ${title}`,
      [{ text: 'Super !', style: 'default' }]
    );
  }
}

export default ChallengeService;