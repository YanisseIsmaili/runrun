import AsyncStorage from '@react-native-async-storage/async-storage';

class RunService {
  static async saveRun(runData) {
    try {
      const existingRuns = await this.getAllRuns();
      const newRun = {
        id: Date.now().toString(),
        ...runData,
        createdAt: new Date().toISOString(),
        start_time: runData.date || new Date().toISOString(),
        end_time: runData.date || new Date().toISOString(),
        status: 'finished',
        gps_data: JSON.stringify({
          coordinates: runData.route || []
        }),
        avg_speed: runData.avgSpeed || 0,
        max_speed: runData.maxSpeed || 0,
        notes: runData.notes || null
      };
      
      const updatedRuns = [...existingRuns, newRun];
      await AsyncStorage.setItem('runs', JSON.stringify(updatedRuns));
      
      return newRun;
    } catch (error) {
      console.error('Erreur sauvegarde course:', error);
      throw error;
    }
  }
  
  static async getAllRuns() {
    try {
      const runsData = await AsyncStorage.getItem('runs');
      return runsData ? JSON.parse(runsData) : [];
    } catch (error) {
      console.error('Erreur récupération courses:', error);
      return [];
    }
  }

  // Nouvelle méthode pour RunHistoryScreen
  static async getUserRuns(page = 1, limit = 20) {
    try {
      const allRuns = await this.getAllRuns();
      
      // Trier par date décroissante
      const sortedRuns = allRuns.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const runs = sortedRuns.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          runs,
          pagination: {
            page,
            pages: Math.ceil(sortedRuns.length / limit),
            total: sortedRuns.length
          }
        }
      };
    } catch (error) {
      console.error('Erreur getUserRuns:', error);
      return {
        success: false,
        message: 'Erreur lors du chargement des courses'
      };
    }
  }
  
  static async deleteRun(runId) {
    try {
      const existingRuns = await this.getAllRuns();
      const filteredRuns = existingRuns.filter(run => run.id !== runId);
      await AsyncStorage.setItem('runs', JSON.stringify(filteredRuns));
      
      return {
        success: true,
        message: 'Course supprimée'
      };
    } catch (error) {
      console.error('Erreur suppression course:', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression'
      };
    }
  }

  // Méthodes additionnelles pour compatibilité
  static async getRunById(runId) {
    try {
      const allRuns = await this.getAllRuns();
      const run = allRuns.find(r => r.id === runId);
      
      if (run) {
        return { success: true, data: run };
      } else {
        return { success: false, message: 'Course non trouvée' };
      }
    } catch (error) {
      return { success: false, message: 'Erreur lors du chargement' };
    }
  }

  static async updateRun(runId, updateData) {
    try {
      const allRuns = await this.getAllRuns();
      const runIndex = allRuns.findIndex(r => r.id === runId);
      
      if (runIndex !== -1) {
        allRuns[runIndex] = { ...allRuns[runIndex], ...updateData };
        await AsyncStorage.setItem('runs', JSON.stringify(allRuns));
        return { success: true, data: allRuns[runIndex] };
      } else {
        return { success: false, message: 'Course non trouvée' };
      }
    } catch (error) {
      return { success: false, message: 'Erreur lors de la mise à jour' };
    }
  }
}

export default RunService;