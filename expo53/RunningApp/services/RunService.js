// services/RunService.js - API complète
import AuthService from './AuthService';

const API_BASE_URL = 'http://192.168.27.77:5000/api';

class RunService {
  // ========== RUNS ==========
  
  async createRun(runData) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      console.log('🔵 Création course:', runData);

      const response = await fetch(`${API_BASE_URL}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(runData),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error('Erreur création course:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getUserRuns(page = 1, limit = 10, filters = {}) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      let url = `${API_BASE_URL}/runs?page=${page}&limit=${limit}`;
      
      // Ajouter filtres
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.date_from) url += `&date_from=${filters.date_from}`;
      if (filters.date_to) url += `&date_to=${filters.date_to}`;
      if (filters.route_id) url += `&route_id=${filters.route_id}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur récupération courses:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getRunDetails(runId) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/runs/${runId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur détails course:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async updateRun(runId, updateData) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/runs/${runId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur mise à jour course:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async deleteRun(runId) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/runs/${runId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur suppression course:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async bulkDeleteRuns(runIds) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/runs/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ run_ids: runIds }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.details };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur suppression lot:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async exportRuns(filters = {}) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      let url = `${API_BASE_URL}/runs/export?`;
      if (filters.user_id) url += `user_id=${filters.user_id}&`;
      if (filters.date_from) url += `date_from=${filters.date_from}&`;
      if (filters.date_to) url += `date_to=${filters.date_to}&`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        return { success: true, data: blob };
      } else {
        return { success: false, message: 'Erreur export' };
      }
    } catch (error) {
      console.error('Erreur export:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getRunsSummary() {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/runs/stats/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur résumé courses:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ========== ROUTES ==========

  async getAllRoutes(page = 1, limit = 10, filters = {}) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      let url = `${API_BASE_URL}/routes?page=${page}&limit=${limit}`;
      if (filters.search) url += `&search=${filters.search}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.difficulty) url += `&difficulty=${filters.difficulty}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur routes:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getRouteDetails(routeId) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur détails route:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async createRoute(routeData) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/routes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur création route:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async updateRoute(routeId, routeData) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur mise à jour route:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async deleteRoute(routeId) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur suppression route:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getActiveRuns() {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/routes/active-runs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur runs actifs:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getRoutesStats() {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/routes/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur stats routes:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ========== USERS ==========

  async getUserProfile() {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur profil:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async updateUserProfile(profileData) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ========== STATS ==========

  async getGlobalStats() {
    try {
      const token = await AuthService.getToken();

      const response = await fetch(`${API_BASE_URL}/stats/global`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.stats };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur stats globales:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getUserStats() {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success' || data.total_runs !== undefined) {
        return { success: true, data: data };
      } else {
        return { success: false, message: 'Erreur stats utilisateur' };
      }
    } catch (error) {
      console.error('Erreur stats utilisateur:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getWeeklyStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/weekly`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.weekly_stats };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur stats hebdo:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getMonthlyStats(year, month) {
    try {
      let url = `${API_BASE_URL}/stats/monthly`;
      if (year && month) {
        url += `?year=${year}&month=${month}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.month };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur stats mensuelles:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ========== ADMIN ==========

  async getAdminStats() {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur stats admin:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async refreshAdminStats() {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/admin/stats/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erreur refresh admin:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ========== DASHBOARD ==========

  async getDashboardOverview(period = '30') {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/dashboard/overview?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.error || 'Erreur dashboard' };
      }
    } catch (error) {
      console.error('Erreur dashboard:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getRecentActivity(limit = 10) {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/dashboard/recent-activity?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.error || 'Erreur activité' };
      }
    } catch (error) {
      console.error('Erreur activité récente:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  async getSystemHealth() {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${API_BASE_URL}/dashboard/system-health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.error || 'Erreur système' };
      }
    } catch (error) {
      console.error('Erreur santé système:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ========== UTILITAIRES ==========

  formatRunDataForAPI(runData) {
    const {
      startTime,
      endTime,
      elapsedTime,
      distance,
      routeCoordinates,
      speed,
      maxSpeed,
      segments,
      trail
    } = runData;

    let validDistance = 0;
    if (distance && distance > 0) {
      validDistance = Number(distance);
    } else if (routeCoordinates && routeCoordinates.length > 1) {
      validDistance = this.calculateDistanceFromCoordinates(routeCoordinates);
    }

    if (validDistance < 1) {
      validDistance = 1;
    }

    let validDuration = 0;
    if (elapsedTime && elapsedTime > 0) {
      validDuration = Math.floor(elapsedTime / 1000);
    } else if (startTime && endTime) {
      validDuration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    }

    if (validDuration < 1) {
      validDuration = 1;
    }

    return {
      start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : new Date().toISOString(),
      duration: validDuration,
      distance: validDistance,
      avg_speed: this.calculateAverageSpeed(validDistance, validDuration),
      max_speed: maxSpeed || 0,
      status: 'finished',
      gps_data: JSON.stringify({
        coordinates: routeCoordinates || [],
        trail: trail || [],
        segments: segments || []
      }),
      elevation_gain: this.calculateElevationGain(routeCoordinates),
      calories_burned: this.estimateCalories(validDistance),
      notes: `Course avec ${(segments || []).length} segment(s) et ${(trail || []).length} points de traîner`,
      weather_conditions: null,
    };
  }

  calculateDistanceFromCoordinates(coordinates) {
    if (!coordinates || coordinates.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const dist = this.calculateDistanceBetweenPoints(
        coordinates[i - 1],
        coordinates[i]
      );
      totalDistance += dist;
    }
    return totalDistance;
  }

  calculateDistanceBetweenPoints(point1, point2) {
    const R = 6371000;
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.latitude * Math.PI / 180) *
      Math.cos(point2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  calculateAverageSpeed(distance, duration) {
    if (!distance || !duration || duration === 0) return 0;
    const timeInHours = duration / 3600;
    const distanceInKm = distance / 1000;
    return parseFloat((distanceInKm / timeInHours).toFixed(2));
  }

  calculateElevationGain(coordinates) {
    if (!coordinates || coordinates.length < 2) return 0;
    return Math.round(Math.random() * 50);
  }

  estimateCalories(distance) {
    if (!distance) return 0;
    const distanceInKm = distance / 1000;
    return Math.round(distanceInKm * 60);
  }
}

export default new RunService();