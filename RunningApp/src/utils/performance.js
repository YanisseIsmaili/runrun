import { Platform } from 'react-native';

// Monitoring des performances pour Expo SDK 53
class PerformanceMonitor {
  constructor() {
    this.renderTimes = new Map();
    this.navigationTimes = new Map();
    this.memoryUsage = [];
    this.isMonitoring = false;
  }

  // Démarrer le monitoring
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🚀 Performance monitoring démarré pour Expo SDK 53');
    
    // Surveiller l'utilisation mémoire toutes les 30 secondes
    this.memoryInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);
    
    // Surveiller les performances de rendu
    this.startRenderMonitoring();
  }

  // Arrêter le monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    console.log('🛑 Performance monitoring arrêté');
  }

  // Enregistrer le temps de rendu d'un composant
  recordRenderTime(componentName, startTime, endTime) {
    const renderTime = endTime - startTime;
    
    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, []);
    }
    
    this.renderTimes.get(componentName).push(renderTime);
    
    // Alerter si le rendu est lent (>100ms)
    if (renderTime > 100) {
      console.warn(`⚠️ Rendu lent détecté: ${componentName} (${renderTime}ms)`);
    }
  }

  // Enregistrer le temps de navigation
  recordNavigationTime(screenName, startTime, endTime) {
    const navigationTime = endTime - startTime;
    
    if (!this.navigationTimes.has(screenName)) {
      this.navigationTimes.set(screenName, []);
    }
    
    this.navigationTimes.get(screenName).push(navigationTime);
    
    // Alerter si la navigation est lente (>500ms)
    if (navigationTime > 500) {
      console.warn(`⚠️ Navigation lente détectée vers ${screenName} (${navigationTime}ms)`);
    }
  }

  // Surveiller l'utilisation mémoire (approximative)
  recordMemoryUsage() {
    if (Platform.OS === 'web') {
      // Pour le web, utiliser performance.memory si disponible
      if (performance.memory) {
        const memoryInfo = {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
          timestamp: Date.now()
        };
        
        this.memoryUsage.push(memoryInfo);
        
        // Garder seulement les 100 dernières mesures
        if (this.memoryUsage.length > 100) {
          this.memoryUsage.shift();
        }
        
        // Alerter si l'utilisation mémoire est élevée
        const usagePercent = (memoryInfo.used / memoryInfo.limit) * 100;
        if (usagePercent > 80) {
          console.warn(`⚠️ Utilisation mémoire élevée: ${usagePercent.toFixed(1)}%`);
        }
      }
    } else {
      // Pour mobile, monitoring basique
      const estimatedMemory = {
        estimated: 'Mobile memory monitoring limited',
        timestamp: Date.now()
      };
      this.memoryUsage.push(estimatedMemory);
    }
  }

  // Surveiller les performances de rendu
  startRenderMonitoring() {
    // Hook pour React DevTools si disponible
    if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const devTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      devTools.onCommitFiberRoot = (id, root, priorityLevel) => {
        // Monitoring des commits React
        console.log('🔄 React commit:', { id, priorityLevel });
      };
    }
  }

  // Obtenir les statistiques de performance
  getPerformanceStats() {
    const stats = {
      renderTimes: this.getAverageRenderTimes(),
      navigationTimes: this.getAverageNavigationTimes(),
      memoryUsage: this.getMemoryStats(),
      recommendations: this.getRecommendations()
    };
    
    return stats;
  }

  // Calculer les temps de rendu moyens
  getAverageRenderTimes() {
    const averages = {};
    
    for (const [component, times] of this.renderTimes.entries()) {
      if (times.length > 0) {
        const average = times.reduce((sum, time) => sum + time, 0) / times.length;
        averages[component] = {
          average: Math.round(average),
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length
        };
      }
    }
    
    return averages;
  }

  // Calculer les temps de navigation moyens
  getAverageNavigationTimes() {
    const averages = {};
    
    for (const [screen, times] of this.navigationTimes.entries()) {
      if (times.length > 0) {
        const average = times.reduce((sum, time) => sum + time, 0) / times.length;
        averages[screen] = {
          average: Math.round(average),
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length
        };
      }
    }
    
    return averages;
  }

  // Obtenir les statistiques mémoire
  getMemoryStats() {
    if (this.memoryUsage.length === 0) return null;
    
    const recent = this.memoryUsage.slice(-10); // 10 dernières mesures
    
    if (Platform.OS === 'web' && recent[0].used !== undefined) {
      const avgUsed = recent.reduce((sum, mem) => sum + mem.used, 0) / recent.length;
      const maxUsed = Math.max(...recent.map(mem => mem.used));
      
      return {
        averageUsed: Math.round(avgUsed),
        maxUsed,
        currentUsed: recent[recent.length - 1].used,
        platform: 'web'
      };
    }
    
    return {
      platform: Platform.OS,
      note: 'Monitoring mémoire limité sur mobile'
    };
  }

  // Générer des recommandations de performance
  getRecommendations() {
    const recommendations = [];
    const renderStats = this.getAverageRenderTimes();
    const navStats = this.getAverageNavigationTimes();
    
    // Recommandations pour les rendus lents
    for (const [component, stats] of Object.entries(renderStats)) {
      if (stats.average > 50) {
        recommendations.push(`Optimiser le rendu de ${component} (${stats.average}ms moyen)`);
      }
    }
    
    // Recommandations pour la navigation lente
    for (const [screen, stats] of Object.entries(navStats)) {
      if (stats.average > 300) {
        recommendations.push(`Optimiser la navigation vers ${screen} (${stats.average}ms moyen)`);
      }
    }
    
    // Recommandations générales
    if (Object.keys(renderStats).length > 20) {
      recommendations.push('Considérer le lazy loading pour réduire le nombre de composants actifs');
    }
    
    return recommendations;
  }

  // Exporter les données de performance
  exportPerformanceData() {
    const data = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      sdk: 'Expo 53',
      stats: this.getPerformanceStats()
    };
    
    console.log('📊 Données de performance:', JSON.stringify(data, null, 2));
    return data;
  }
}

// Instance globale
const performanceMonitor = new PerformanceMonitor();

// Fonctions utilitaires pour les composants
export const measureComponentRender = (componentName) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    performanceMonitor.recordRenderTime(componentName, startTime, endTime);
  };
};

export const measureNavigation = (screenName) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    performanceMonitor.recordNavigationTime(screenName, startTime, endTime);
  };
};

// Fonctions principales
export const startPerformanceMonitoring = () => {
  performanceMonitor.startMonitoring();
};

export const stopPerformanceMonitoring = () => {
  performanceMonitor.stopMonitoring();
};

export const getPerformanceStats = () => {
  return performanceMonitor.getPerformanceStats();
};

export const exportPerformanceData = () => {
  return performanceMonitor.exportPerformanceData();
};

export default performanceMonitor;