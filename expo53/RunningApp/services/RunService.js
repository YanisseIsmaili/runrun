import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';

const API_BASE_URL = 'http://192.168.27.77:5000/api';

class RunService {
  static async saveRun(runData) {
    try {
      // Sauvegarder localement d'abord
      const localRun = await this.saveRunLocally(runData);
      
      // Ensuite envoyer à l'API
      const token = await AuthService.getToken();
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/runs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              start_time: new Date(runData.date).toISOString(),
              end_time: new Date(Date.now()).toISOString(),
              duration: runData.duration,
              distance: runData.distance,
              avg_speed: runData.distance / runData.duration * 3.6, // km/h
              max_speed: runData.maxSpeed,
              gps_data: JSON.stringify({
                coordinates: runData.route || [],
                accuracy: 10
              }),
              status: 'finished'
            }),
          });

          const result = await response.json();
          
          if (result.status === 'success') {
            console.log('✅ Course sauvegardée sur le serveur');
            // Mettre à jour l'ID local avec l'ID serveur
            localRun.serverId = result.data.id;
            await this.updateRunLocally(localRun);
          } else {
            console.log('⚠️ Erreur serveur:', result.message);
          }
        } catch (error) {
          console.log('⚠️ Erreur réseau, sauvegarde locale uniquement:', error.message);
        }
      }
      
      return localRun;
    } catch (error) {
      console.error('❌ Erreur sauvegarde course:', error);
      throw error;
    }
  }

  static async saveRunLocally(runData) {
    const existingRuns = await this.getAllRuns();
    const newRun = {
      id: Date.now().toString(),
      ...runData,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    
    const updatedRuns = [...existingRuns, newRun];
    await AsyncStorage.setItem('runs', JSON.stringify(updatedRuns));
    return newRun;
  }

  static async updateRunLocally(runData) {
    const existingRuns = await this.getAllRuns();
    const updatedRuns = existingRuns.map(run => 
      run.id === runData.id ? { ...run, ...runData } : run
    );
    await AsyncStorage.setItem('runs', JSON.stringify(updatedRuns));
  }

  static async getUserRuns(page = 1, limit = 20) {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        return { success: false, message: 'Non authentifié' };
      }

      const response = await fetch(`${API_BASE_URL}/runs?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erreur récupération courses API:', error);
      // Fallback sur les données locales
      const localRuns = await this.getAllRuns();
      return {
        success: true,
        data: {
          runs: localRuns,
          pagination: {
            page: 1,
            pages: 1,
            total: localRuns.length
          }
        }
      };
    }
  }

  static async deleteRun(runId) {
    try {
      const token = await AuthService.getToken();
      
      // Supprimer localement
      await this.deleteRunLocally(runId);
      
      // Supprimer sur le serveur si possible
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/runs/${runId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const result = await response.json();
          return result;
        } catch (error) {
          console.log('⚠️ Erreur suppression serveur:', error.message);
          return { success: true, message: 'Supprimé localement' };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression course:', error);
      throw error;
    }
  }

  static async deleteRunLocally(runId) {
    const existingRuns = await this.getAllRuns();
    const filteredRuns = existingRuns.filter(run => run.id !== runId);
    await AsyncStorage.setItem('runs', JSON.stringify(filteredRuns));
  }
  
  static async getAllRuns() {
    try {
      const runsData = await AsyncStorage.getItem('runs');
      return runsData ? JSON.parse(runsData) : [];
    } catch (error) {
      console.error('Erreur récupération courses locales:', error);
      return [];
    }
  }

  static async syncPendingRuns() {
    try {
      const token = await AuthService.getToken();
      if (!token) return;

      const localRuns = await this.getAllRuns();
      const pendingRuns = localRuns.filter(run => !run.synced && !run.serverId);

      for (const run of pendingRuns) {
        try {
          const response = await fetch(`${API_BASE_URL}/runs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              start_time: new Date(run.date).toISOString(),
              end_time: new Date(Date.now()).toISOString(),
              duration: run.duration,
              distance: run.distance,
              avg_speed: run.distance / run.duration * 3.6,
              max_speed: run.maxSpeed,
              gps_data: JSON.stringify({
                coordinates: run.route || [],
                accuracy: 10
              }),
              status: 'finished'
            }),
          });

          const result = await response.json();
          
          if (result.status === 'success') {
            run.serverId = result.data.id;
            run.synced = true;
            await this.updateRunLocally(run);
            console.log(`✅ Course ${run.id} synchronisée`);
          }
        } catch (error) {
          console.log(`⚠️ Erreur sync course ${run.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    }
  }
}

export default RunService;