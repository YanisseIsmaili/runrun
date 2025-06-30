import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.27.77:5000';

class RunService {
  static async saveRun(runData) {
    try {
      console.log('🔍 RunService.saveRun appelé avec:', runData);
      
      // Validation minimale
      if (runData.duration < 1000) {
        console.log('❌ Course rejetée: durée < 1s');
        throw new Error('Course trop courte');
      }
      
      // Essayer d'abord l'API
      try {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/api/runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            distance: runData.distance,
            duration: runData.duration,
            start_time: runData.date,
            end_time: runData.date,
            route_data: JSON.stringify(runData.route || []),
            avg_speed: runData.avgSpeed || 0,
            max_speed: runData.maxSpeed || 0,
            status: 'finished'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Course sauvée via API');
          return result.data;
        }
      } catch (apiError) {
        console.log('⚠️ API indisponible, sauvegarde locale');
      }
      
      // Fallback local uniquement si API échoue
      const existingRuns = await this.getLocalRuns();
      const newRun = {
        id: Date.now().toString(),
        distance: runData.distance,
        duration: runData.duration,
        start_time: runData.date || new Date().toISOString(),
        end_time: runData.date || new Date().toISOString(),
        route_data: JSON.stringify(runData.route || []),
        avg_speed: runData.avgSpeed || 0,
        max_speed: runData.maxSpeed || 0,
        status: 'finished',
        created_at: new Date().toISOString(),
        sync_status: 'pending' // Pour sync ultérieure
      };
      
      const updatedRuns = [...existingRuns, newRun];
      await AsyncStorage.setItem('runs', JSON.stringify(updatedRuns));
      
      console.log('✅ Course sauvée localement');
      return newRun;
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      throw error;
    }
  }
  
  static async getLocalRuns() {
    try {
      const runsData = await AsyncStorage.getItem('runs');
      return runsData ? JSON.parse(runsData) : [];
    } catch (error) {
      console.error('❌ Erreur lecture locale:', error);
      return [];
    }
  }

  static async getUserRuns(page = 1, limit = 20) {
    try {
      // Essayer l'API d'abord
      const token = await this.getToken();
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/runs?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Courses récupérées via API');
          return result;
        }
      }
    } catch (apiError) {
      console.log('⚠️ API indisponible, utilisation cache local');
    }
    
    // Fallback local
    const allRuns = await this.getLocalRuns();
    const sortedRuns = allRuns.sort((a, b) => 
      new Date(b.created_at || b.start_time) - new Date(a.created_at || a.start_time)
    );
    
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
  }
  
  static async deleteRun(runId) {
    try {
      // Essayer l'API
      const token = await this.getToken();
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/runs/${runId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          console.log('✅ Course supprimée via API');
          return { success: true, message: 'Course supprimée' };
        }
      }
    } catch (apiError) {
      console.log('⚠️ Suppression locale seulement');
    }
    
    // Suppression locale
    const existingRuns = await this.getLocalRuns();
    const filteredRuns = existingRuns.filter(run => run.id !== runId);
    await AsyncStorage.setItem('runs', JSON.stringify(filteredRuns));
    
    return { success: true, message: 'Course supprimée localement' };
  }

  static async getToken() {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      return null;
    }
  }

  static async syncPendingRuns() {
    try {
      const localRuns = await this.getLocalRuns();
      const pendingRuns = localRuns.filter(run => run.sync_status === 'pending');
      
      if (pendingRuns.length === 0) return;

      const token = await this.getToken();
      if (!token) return;

      for (const run of pendingRuns) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/runs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(run),
          });

          if (response.ok) {
            // Marquer comme synchronisé
            run.sync_status = 'synced';
            console.log(`✅ Course ${run.id} synchronisée`);
          }
        } catch (error) {
          console.log(`❌ Échec sync course ${run.id}`);
        }
      }

      // Sauvegarder les changements
      await AsyncStorage.setItem('runs', JSON.stringify(localRuns));
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
    }
  }

  // Méthodes de compatibilité
  static async getAllRuns() {
    return await this.getLocalRuns();
  }

  static async getRunById(runId) {
    const runs = await this.getLocalRuns();
    const run = runs.find(r => r.id === runId);
    return run ? { success: true, data: run } : { success: false, message: 'Course non trouvée' };
  }
}

export default RunService;