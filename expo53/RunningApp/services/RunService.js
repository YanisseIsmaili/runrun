// services/RunService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';

const API_BASE_URL = 'http://192.168.27.77:5000/api';

class RunService {
  static async saveRun(runData) {
    try {
      console.log('💾 Saving run:', runData);
      
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
              'Accept': 'application/json',
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

          console.log('📡 Save run response status:', response.status);
          
          if (!response.ok) {
            console.log('⚠️ Server error:', response.status);
            throw new Error(`Server error: ${response.status}`);
          }

          const result = await response.json();
          console.log('📄 Save run response:', result);
          
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
    console.log('💾 Saving run locally:', runData);
    const existingRuns = await this.getAllRuns();
    const newRun = {
      id: Date.now().toString(),
      ...runData,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    
    const updatedRuns = [...existingRuns, newRun];
    await AsyncStorage.setItem('runs', JSON.stringify(updatedRuns));
    console.log('✅ Run saved locally with ID:', newRun.id);
    return newRun;
  }

  static async updateRunLocally(runData) {
    console.log('🔄 Updating run locally:', runData.id);
    const existingRuns = await this.getAllRuns();
    const updatedRuns = existingRuns.map(run => 
      run.id === runData.id ? { ...run, ...runData } : run
    );
    await AsyncStorage.setItem('runs', JSON.stringify(updatedRuns));
    console.log('✅ Run updated locally');
  }

  static async getUserRuns(page = 1, limit = 20) {
    try {
      console.log(`🔍 Getting user runs (page ${page}, limit ${limit})`);
      
      const token = await AuthService.getToken();
      if (!token) {
        console.log('❌ No token found, returning local runs');
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

      const response = await fetch(`${API_BASE_URL}/runs?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('📡 Get runs response status:', response.status);

      if (!response.ok) {
        console.log('❌ Server error, falling back to local runs');
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📄 Get runs response:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Erreur récupération courses API:', error);
      
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
      console.log('🗑️ Deleting run:', runId);
      
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
              'Accept': 'application/json',
            },
          });

          console.log('📡 Delete run response status:', response.status);

          if (response.ok) {
            const result = await response.json();
            console.log('📄 Delete run response:', result);
            return result;
          } else {
            console.log('⚠️ Server delete failed:', response.status);
          }
        } catch (error) {
          console.log('⚠️ Erreur suppression serveur:', error.message);
        }
      }
      
      return { success: true, message: 'Course supprimée localement' };
    } catch (error) {
      console.error('❌ Erreur suppression course:', error);
      throw error;
    }
  }

  static async deleteRunLocally(runId) {
    console.log('🗑️ Deleting run locally:', runId);
    const existingRuns = await this.getAllRuns();
    const filteredRuns = existingRuns.filter(run => run.id !== runId && run.id !== parseInt(runId));
    await AsyncStorage.setItem('runs', JSON.stringify(filteredRuns));
    console.log('✅ Run deleted locally');
  }
  
  static async getAllRuns() {
    try {
      const runsData = await AsyncStorage.getItem('runs');
      const runs = runsData ? JSON.parse(runsData) : [];
      console.log('📊 Local runs count:', runs.length);
      return runs;
    } catch (error) {
      console.error('❌ Erreur récupération courses locales:', error);
      return [];
    }
  }

  static async syncPendingRuns() {
    try {
      console.log('🔄 Syncing pending runs...');
      
      const token = await AuthService.getToken();
      if (!token) {
        console.log('❌ No token for sync');
        return;
      }

      const localRuns = await this.getAllRuns();
      const pendingRuns = localRuns.filter(run => !run.synced && !run.serverId);
      
      console.log(`📊 Found ${pendingRuns.length} pending runs to sync`);

      for (const run of pendingRuns) {
        try {
          console.log('🔄 Syncing run:', run.id);
          
      const response = await fetch(`${API_BASE_URL}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_time: new Date(runData.date).toISOString(),
          end_time: new Date(Date.now()).toISOString(),
          duration: runData.duration || 0,
          distance: runData.distance || 0, // ✅ Assurez-vous que c'est un nombre
          avg_speed: runData.distance && runData.duration ? (runData.distance / runData.duration) * 3.6 : 0,
          max_speed: runData.maxSpeed || 0,
          status: 'finished'
        }),
      }); 

          if (response.ok) {
            const result = await response.json();
            
            if (result.status === 'success') {
              run.serverId = result.data.id;
              run.synced = true;
              await this.updateRunLocally(run);
              console.log(`✅ Course ${run.id} synchronisée`);
            }
          } else {
            console.log(`⚠️ Sync failed for run ${run.id}:`, response.status);
          }
        } catch (error) {
          console.log(`⚠️ Erreur sync course ${run.id}:`, error.message);
        }
      }
      
      console.log('✅ Sync completed');
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
    }
  }

  static async clearLocalRuns() {
    try {
      await AsyncStorage.removeItem('runs');
      console.log('✅ Local runs cleared');
    } catch (error) {
      console.error('❌ Error clearing local runs:', error);
    }
  }
}

export default RunService;