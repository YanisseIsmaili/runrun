/**
 * Service d'urgence pour gérer les erreurs critiques et les problèmes de localStorage
 * Version complète avec toutes les fonctionnalités de diagnostic et récupération
 */

class EmergencyService {
  constructor() {
    this.errorHistory = []
    this.maxErrorHistory = 50
    this.criticalErrorCount = 0
    this.lastCleanup = null
    this.sessionId = this.generateSessionId()
    this.isInitialized = false
    this.listeners = []
    this.performanceMetrics = {
      startTime: performance.now(),
      errorCount: 0,
      cleanupCount: 0
    }
  }

  /**
   * Génère un ID de session unique
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Initialise le service d'urgence
   */
  initialize() {
    if (this.isInitialized) return

    console.log(`🚀 Initialisation du service d'urgence - Session: ${this.sessionId}`)
    
    this.initializeGlobalErrorHandling()
    this.setupPerformanceMonitoring()
    this.scheduleMaintenanceTasks()
    this.validateEnvironment()
    
    this.isInitialized = true
    console.log('✅ Service d\'urgence initialisé avec succès')
  }

  /**
   * Valide l'environnement d'exécution
   */
  validateEnvironment() {
    const validation = {
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      indexedDB: this.testIndexedDB(),
      webWorkers: typeof Worker !== 'undefined',
      serviceWorkers: 'serviceWorker' in navigator,
      cryptoAPI: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
    }

    console.log('🔍 Validation de l\'environnement:', validation)
    
    if (!validation.localStorage) {
      this.logError(new Error('localStorage non disponible'), 'environment_validation')
    }

    return validation
  }

  /**
   * Test de fonctionnement du localStorage
   */
  testLocalStorage() {
    try {
      const testKey = '__emergency_test__'
      localStorage.setItem(testKey, 'test')
      const value = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      return value === 'test'
    } catch (error) {
      return false
    }
  }

  /**
   * Test de fonctionnement du sessionStorage
   */
  testSessionStorage() {
    try {
      const testKey = '__emergency_test__'
      sessionStorage.setItem(testKey, 'test')
      const value = sessionStorage.getItem(testKey)
      sessionStorage.removeItem(testKey)
      return value === 'test'
    } catch (error) {
      return false
    }
  }

  /**
   * Test de disponibilité d'IndexedDB
   */
  testIndexedDB() {
    return typeof indexedDB !== 'undefined'
  }

  /**
   * Configure la surveillance des performances
   */
  setupPerformanceMonitoring() {
    // Surveiller l'utilisation mémoire
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.logError(new Error('Mémoire presque pleine'), 'memory_warning')
        }
      }, 30000) // Vérifier toutes les 30 secondes
    }

    // Surveiller les performances de navigation
    if ('navigation' in performance) {
      const navigation = performance.navigation
      if (navigation.type === navigation.TYPE_RELOAD && this.criticalErrorCount > 0) {
        console.warn('⚠️ Rechargement détecté après erreurs critiques')
      }
    }
  }

  /**
   * Programme les tâches de maintenance
   */
  scheduleMaintenanceTasks() {
    // Nettoyage périodique des erreurs anciennes
    setInterval(() => {
      this.cleanOldErrors()
    }, 5 * 60 * 1000) // Toutes les 5 minutes

    // Vérification de santé périodique
    setInterval(() => {
      this.performRoutineHealthCheck()
    }, 10 * 60 * 1000) // Toutes les 10 minutes

    // Nettoyage du localStorage expiré
    setInterval(() => {
      this.cleanExpiredStorage()
    }, 15 * 60 * 1000) // Toutes les 15 minutes
  }

  /**
   * Nettoie les erreurs anciennes
   */
  cleanOldErrors() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 heures
    const initialCount = this.errorHistory.length
    
    this.errorHistory = this.errorHistory.filter(error => {
      const errorTime = new Date(error.timestamp).getTime()
      return errorTime > cutoffTime
    })

    const cleaned = initialCount - this.errorHistory.length
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} erreurs anciennes nettoyées`)
    }
  }

  /**
   * Effectue une vérification de santé de routine
   */
  performRoutineHealthCheck() {
    const health = this.performHealthCheck()
    
    if (!health.localStorage) {
      this.handleCriticalError(new Error('localStorage défaillant'), 'routine_check')
    }

    if (health.errorCount > 20) {
      console.warn('⚠️ Nombre élevé d\'erreurs détecté:', health.errorCount)
    }

    if (health.storageQuota && health.storageQuota.percentage > 90) {
      this.handleStorageQuotaError()
    }
  }

  /**
   * Nettoie le stockage expiré
   */
  cleanExpiredStorage() {
    try {
      const keys = Object.keys(localStorage)
      let cleaned = 0

      keys.forEach(key => {
        if (key.startsWith('running_app_')) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              const parsed = JSON.parse(value)
              if (parsed.expiration && Date.now() > parsed.expiration) {
                localStorage.removeItem(key)
                cleaned++
              }
            }
          } catch (error) {
            // Si on ne peut pas parser, c'est probablement corrompu
            localStorage.removeItem(key)
            cleaned++
          }
        }
      })

      if (cleaned > 0) {
        console.log(`🗑️ ${cleaned} éléments expirés nettoyés`)
      }
    } catch (error) {
      this.logError(error, 'storage_cleanup')
    }
  }

  /**
   * Enregistre une erreur avec métadonnées enrichies
   */
  logError(error, context = 'unknown', additionalData = {}) {
    const errorEntry = {
      id: this.generateErrorId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      message: error.message || error.toString(),
      stack: error.stack,
      context,
      additionalData,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: this.getMemoryInfo(),
      performance: {
        now: performance.now(),
        timeOrigin: performance.timeOrigin
      }
    }

    this.errorHistory.unshift(errorEntry)
    this.performanceMetrics.errorCount++
    
    // Maintenir la taille de l'historique
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory)
    }

    // Déterminer la criticité
    if (this.isCriticalError(error)) {
      this.criticalErrorCount++
      this.handleCriticalError(error, context, errorEntry)
    }

    // Notifier les listeners
    this.notifyErrorListeners(errorEntry)

    console.warn('🚨 Erreur enregistrée:', errorEntry)
    return errorEntry.id
  }

  /**
   * Génère un ID unique pour l'erreur
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Obtient les informations mémoire si disponibles
   */
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }

  /**
   * Notifie les listeners d'erreur
   */
  notifyErrorListeners(errorEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(errorEntry)
      } catch (error) {
        console.error('Erreur dans un listener d\'erreur:', error)
      }
    })
  }

  /**
   * Ajoute un listener d'erreur
   */
  addErrorListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener)
      return () => {
        const index = this.listeners.indexOf(listener)
        if (index > -1) {
          this.listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * Détermine si une erreur est critique
   */
  isCriticalError(error) {
    const criticalKeywords = [
      'Malformed UTF-8',
      'localStorage',
      'QuotaExceededError',
      'SecurityError',
      'chunk load error',
      'Loading chunk',
      'ChunkLoadError',
      'Failed to fetch',
      'Network Error',
      'CORS',
      'Unexpected token',
      'SyntaxError',
      'ReferenceError'
    ]

    const errorMessage = error.message || error.toString()
    const isCritical = criticalKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword.toLowerCase())
    )

    // Considérer aussi la fréquence des erreurs
    const recentErrors = this.errorHistory.filter(e => {
      const errorTime = new Date(e.timestamp).getTime()
      return Date.now() - errorTime < 60000 // Dernière minute
    })

    return isCritical || recentErrors.length > 5
  }

  /**
   * Gère les erreurs critiques avec stratégies multiples
   */
  handleCriticalError(error, context, errorEntry = null) {
    console.error('💥 ERREUR CRITIQUE DÉTECTÉE:', {
      error: error.message,
      context,
      count: this.criticalErrorCount,
      sessionId: this.sessionId
    })

    // Stratégies graduelles basées sur le nombre d'erreurs
    if (this.criticalErrorCount >= 5) {
      this.performEmergencyCleanup('Trop d\'erreurs critiques consécutives')
      return
    }

    // Gestion spécifique par type d'erreur
    if (error.message && error.message.includes('Malformed UTF-8')) {
      this.handleCorruptedStorageError()
    } else if (error.message && error.message.includes('QuotaExceeded')) {
      this.handleStorageQuotaError()
    } else if (error.message && error.message.includes('chunk load')) {
      this.handleChunkLoadError()
    } else if (error.message && error.message.includes('Network')) {
      this.handleNetworkError()
    }

    // Créer un point de sauvegarde
    this.createRecoveryPoint()
  }

  /**
   * Gère les erreurs de données corrompues avec analyse approfondie
   */
  handleCorruptedStorageError() {
    console.log('🧹 Analyse et nettoyage des données corrompues...')
    
    try {
      const keys = Object.keys(localStorage)
      const analysis = {
        total: keys.length,
        runningApp: 0,
        corrupted: 0,
        recovered: 0,
        deleted: 0
      }

      const corruptedKeys = []
      const validKeys = []

      keys.forEach(key => {
        if (key.startsWith('running_app_')) {
          analysis.runningApp++
          
          try {
            const value = localStorage.getItem(key)
            if (value) {
              // Tentative de validation plus poussée
              const parsed = JSON.parse(value)
              
              // Vérifier la structure des données
              if (this.validateDataStructure(key, parsed)) {
                validKeys.push(key)
              } else {
                throw new Error('Structure de données invalide')
              }
            } else {
              corruptedKeys.push(key)
            }
          } catch (parseError) {
            analysis.corrupted++
            corruptedKeys.push(key)
          }
        }
      })

      // Nettoyer les clés corrompues
      corruptedKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
          analysis.deleted++
          console.log(`🗑️ Clé corrompue supprimée: ${key}`)
        } catch (error) {
          console.error(`❌ Impossible de supprimer ${key}:`, error)
        }
      })

      console.log('📊 Analyse du nettoyage:', analysis)
      this.lastCleanup = new Date().toISOString()
      this.performanceMetrics.cleanupCount++
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des données corrompues:', error)
      this.performEmergencyCleanup('Échec du nettoyage des données corrompues')
    }
  }

  /**
   * Valide la structure des données stockées
   */
  validateDataStructure(key, data) {
    // Validation basique de la structure
    if (typeof data !== 'object' || data === null) {
      return false
    }

    // Validation spécifique par type de clé
    if (key.includes('token')) {
      return typeof data.data === 'string' && typeof data.expiration === 'number'
    }

    if (key.includes('user')) {
      return data.data && typeof data.data.id !== 'undefined'
    }

    if (key.includes('session_prefs')) {
      return data.data && typeof data.data.lastLogin === 'string'
    }

    return true
  }

  /**
   * Gère les erreurs de quota de stockage
   */
  handleStorageQuotaError() {
    console.log('💾 Gestion intelligente du quota de stockage...')
    
    try {
      const keys = Object.keys(localStorage)
      const itemsBySize = []
      let totalSize = 0

      // Analyser la taille de chaque élément
      keys.forEach(key => {
        const value = localStorage.getItem(key)
        const size = value ? value.length : 0
        totalSize += size
        
        itemsBySize.push({
          key,
          size,
          isRunningApp: key.startsWith('running_app_'),
          priority: this.getCleanupPriority(key)
        })
      })

      // Trier par priorité de nettoyage (plus bas = nettoyer en premier)
      itemsBySize.sort((a, b) => a.priority - b.priority)

      let freedSpace = 0
      let itemsRemoved = 0

      // Supprimer les éléments non essentiels jusqu'à libérer 25% de l'espace
      const targetSpace = totalSize * 0.25

      for (const item of itemsBySize) {
        if (freedSpace >= targetSpace) break
        
        if (item.priority < 5) { // Ne pas supprimer les éléments essentiels
          try {
            localStorage.removeItem(item.key)
            freedSpace += item.size
            itemsRemoved++
          } catch (error) {
            console.warn(`Impossible de supprimer ${item.key}:`, error)
          }
        }
      }

      console.log(`🧹 Espace libéré: ~${Math.round(freedSpace / 1024)}KB (${itemsRemoved} éléments)`)
      
    } catch (error) {
      console.error('❌ Erreur lors de la libération d\'espace:', error)
    }
  }

  /**
   * Détermine la priorité de nettoyage (1 = supprimer en premier, 10 = garder)
   */
  getCleanupPriority(key) {
    if (key.includes('cache_')) return 1
    if (key.includes('temp_')) return 2
    if (key.includes('old_')) return 2
    if (key.includes('backup_')) return 3
    if (key.includes('running_app_token')) return 10
    if (key.includes('running_app_user')) return 9
    if (key.includes('running_app_session')) return 8
    if (key.startsWith('running_app_')) return 6
    return 4
  }

  /**
   * Gère les erreurs de chargement de chunks
   */
  handleChunkLoadError() {
    console.log('📦 Gestion de l\'erreur de chargement de chunk...')
    
    // Stratégies de récupération pour les erreurs de chunk
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister()
        })
        console.log('🔄 Service workers désenregistrés')
      })
    }

    // Forcer le rechargement après un délai
    setTimeout(() => {
      console.log('🔄 Rechargement forcé pour résoudre l\'erreur de chunk')
      window.location.reload(true)
    }, 2000)
  }

  /**
   * Gère les erreurs réseau
   */
  handleNetworkError() {
    console.log('🌐 Gestion de l\'erreur réseau...')
    
    // Vérifier la connectivité
    if (!navigator.onLine) {
      console.warn('⚠️ Connexion hors ligne détectée')
      this.showNetworkErrorMessage()
    }

    // Programmer une nouvelle tentative
    this.scheduleRetry()
  }

  /**
   * Affiche un message d'erreur réseau
   */
  showNetworkErrorMessage() {
    const message = document.createElement('div')
    message.className = 'fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50'
    message.innerHTML = `
      <div class="flex items-center">
        <div class="text-red-600 mr-2">📡</div>
        <div>
          <p class="text-red-800 font-medium">Connexion interrompue</p>
          <p class="text-red-600 text-sm">Vérification en cours...</p>
        </div>
      </div>
    `
    
    document.body.appendChild(message)
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message)
      }
    }, 5000)
  }

  /**
   * Programme une nouvelle tentative
   */
  scheduleRetry() {
    setTimeout(() => {
      if (navigator.onLine) {
        console.log('✅ Connexion rétablie')
        window.location.reload()
      } else {
        this.scheduleRetry()
      }
    }, 5000)
  }

  /**
   * Crée un point de sauvegarde pour la récupération
   */
  createRecoveryPoint() {
    try {
      const recoveryData = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        errorCount: this.criticalErrorCount,
        lastErrors: this.errorHistory.slice(0, 5)
      }

      localStorage.setItem('emergency_recovery_point', JSON.stringify(recoveryData))
      console.log('💾 Point de sauvegarde créé')
    } catch (error) {
      console.warn('⚠️ Impossible de créer un point de sauvegarde:', error)
    }
  }

  /**
   * Nettoyage d'urgence complet avec sauvegarde intelligente
   */
  performEmergencyCleanup(reason = 'Nettoyage d\'urgence') {
    console.warn(`🚨 NETTOYAGE D'URGENCE DÉCLENCHÉ: ${reason}`)
    
    try {
      // Créer un point de sauvegarde final
      this.createRecoveryPoint()
      
      // Sauvegarder les données essentielles
      const essentialData = this.backupEssentialData()
      
      // Analyser l'état avant nettoyage
      const preCleanupState = this.analyzeStorageState()
      console.log('📊 État avant nettoyage:', preCleanupState)

      // Nettoyage progressif
      this.progressiveCleanup()

      // Restaurer les données essentielles si valides
      if (essentialData && this.validateEssentialData(essentialData)) {
        this.restoreEssentialData(essentialData)
      }

      // Réinitialiser les compteurs
      this.criticalErrorCount = 0
      this.lastCleanup = new Date().toISOString()
      this.performanceMetrics.cleanupCount++

      // Afficher un message à l'utilisateur
      this.showEmergencyMessage(`Maintenance automatique effectuée: ${reason}`)

      console.log('✅ Nettoyage d\'urgence terminé avec succès')
      
    } catch (error) {
      console.error('💥 ÉCHEC CRITIQUE du nettoyage d\'urgence:', error)
      
      // Dernier recours: nettoyage brutal et rechargement
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (clearError) {
        console.error('❌ Impossible de nettoyer le stockage:', clearError)
      }
      
      setTimeout(() => {
        window.location.reload(true)
      }, 1000)
    }
  }

  /**
   * Analyse l'état du stockage
   */
  analyzeStorageState() {
    const keys = Object.keys(localStorage)
    const analysis = {
      totalItems: keys.length,
      runningAppItems: keys.filter(k => k.startsWith('running_app_')).length,
      totalSize: 0,
      itemTypes: {}
    }

    keys.forEach(key => {
      const value = localStorage.getItem(key)
      analysis.totalSize += value ? value.length : 0
      
      const type = key.split('_')[0]
      analysis.itemTypes[type] = (analysis.itemTypes[type] || 0) + 1
    })

    return analysis
  }

  /**
   * Nettoyage progressif par priorité
   */
  progressiveCleanup() {
    const keys = Object.keys(localStorage)
    const phases = [
      { name: 'Cache temporaire', filter: k => k.includes('cache_') || k.includes('temp_') },
      { name: 'Données anciennes', filter: k => k.includes('old_') || k.includes('backup_') },
      { name: 'Données non-running-app', filter: k => !k.startsWith('running_app_') },
      { name: 'Données running-app corrompues', filter: k => k.startsWith('running_app_') && this.isCorrupted(k) }
    ]

    phases.forEach(phase => {
      const keysToRemove = keys.filter(phase.filter)
      let removed = 0
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
          removed++
        } catch (error) {
          console.warn(`Impossible de supprimer ${key}:`, error)
        }
      })
      
      if (removed > 0) {
        console.log(`🗑️ Phase "${phase.name}": ${removed} éléments supprimés`)
      }
    })
  }

  /**
   * Vérifie si une clé de stockage est corrompue
   */
  isCorrupted(key) {
    try {
      const value = localStorage.getItem(key)
      if (!value) return true
      
      const parsed = JSON.parse(value)
      return !this.validateDataStructure(key, parsed)
    } catch (error) {
      return true
    }
  }

  /**
   * Sauvegarde les données essentielles avec validation
   */
  backupEssentialData() {
    try {
      const essentialKeys = [
        'running_app_token',
        'running_app_user',
        'running_app_session_prefs'
      ]

      const backup = {}
      let validItems = 0

      essentialKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const parsed = JSON.parse(value)
            if (this.validateDataStructure(key, parsed)) {
              backup[key] = value
              validItems++
            }
          }
        } catch (error) {
          console.warn(`Impossible de sauvegarder ${key}:`, error)
        }
      })

      return validItems > 0 ? backup : null
    } catch (error) {
      console.warn('⚠️ Erreur lors de la sauvegarde des données essentielles:', error)
      return null
    }
  }

  /**
   * Valide les données essentielles sauvegardées
   */
  validateEssentialData(data) {
    if (!data || typeof data !== 'object') return false

    try {
      // Vérifier chaque élément sauvegardé
      for (const [key, value] of Object.entries(data)) {
        const parsed = JSON.parse(value)
        if (!this.validateDataStructure(key, parsed)) {
          return false
        }
      }
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Restaure les données essentielles
   */
  restoreEssentialData(data) {
    try {
      let restored = 0
      
      for (const [key, value] of Object.entries(data)) {
        try {
          localStorage.setItem(key, value)
          restored++
        } catch (error) {
          console.warn(`Impossible de restaurer ${key}:`, error)
        }
      }
      
      console.log(`🔄 ${restored} éléments essentiels restaurés`)
    } catch (error) {
      console.warn('⚠️ Erreur lors de la restauration:', error)
    }
  }

  /**
   * Affiche un message d'urgence stylé
   */
  showEmergencyMessage(message, type = 'warning') {
    const colors = {
      warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚠️' },
      error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '❌' },
      success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✅' }
    }

    const style = colors[type] || colors.warning

    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 ${style.bg} ${style.border} rounded-lg p-4 shadow-lg z-50 max-w-sm animate-fade-in`
    toast.innerHTML = `
      <div class="flex items-start">
        <div class="text-2xl mr-3">${style.icon}</div>
        <div class="flex-1">
          <p class="font-medium ${style.text}">Service d'urgence</p>
          <p class="text-sm ${style.text} mt-1">${message}</p>
          <div class="mt-2 text-xs ${style.text} opacity-75">
            Session: ${this.sessionId.split('_')[2]}
          </div>
        </div>
        <button type="button" class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `

    document.body.appendChild(toast)

    // Auto-remove après 8 secondes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 8000)
  }

  /**
   * Effectue une vérification complète de santé du système
   */
  performHealthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      indexedDB: this.testIndexedDB(),
      navigator: {
        onLine: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform
      },
      performance: {
        sessionDuration: performance.now() - this.performanceMetrics.startTime,
        errorCount: this.performanceMetrics.errorCount,
        cleanupCount: this.performanceMetrics.cleanupCount,
        memory: this.getMemoryInfo()
      },
      storage: {
        total: localStorage.length,
        runningAppItems: Object.keys(localStorage).filter(k => k.startsWith('running_app_')).length,
        totalSize: this.calculateStorageSize(),
        quota: null
      },
      errors: {
        total: this.errorHistory.length,
        critical: this.criticalErrorCount,
        lastCleanup: this.lastCleanup,
        recentErrors: this.errorHistory.slice(0, 5)
      }
    }

    // Estimer l'utilisation du stockage si possible
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        health.storage.quota = {
          used: estimate.usage,
          total: estimate.quota,
          percentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : null
        }
      }).catch(error => {
        console.warn('Impossible d\'estimer le quota de stockage:', error)
      })
    }

    return health
  }

  /**
   * Calcule la taille totale du localStorage
   */
  calculateStorageSize() {
    let totalSize = 0
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key)
          totalSize += key.length + (value ? value.length : 0)
        }
      }
    } catch (error) {
      console.warn('Erreur lors du calcul de la taille du stockage:', error)
    }
    return totalSize
  }

  /**
   * Initialise la surveillance globale des erreurs
   */
  initializeGlobalErrorHandling() {
    // Gestionnaire d'erreurs JavaScript globales
    window.addEventListener('error', (event) => {
      this.logError(
        event.error || new Error(event.message), 
        'global_error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      )
    })

    // Gestionnaire d'erreurs de promesses non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason instanceof Error ? event.reason : new Error(event.reason), 
        'unhandled_promise_rejection',
        {
          reason: event.reason,
          promise: event.promise
        }
      )
    })

    // Gestionnaire de changement de connectivité
    window.addEventListener('online', () => {
      console.log('🌐 Connexion rétablie')
      this.logError(new Error('Connexion rétablie'), 'network_online')
    })

    window.addEventListener('offline', () => {
      console.log('📡 Connexion perdue')
      this.logError(new Error('Connexion perdue'), 'network_offline')
    })

    // Gestionnaire de changement de visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('👁️ Page cachée')
      } else {
        console.log('👁️ Page visible')
        // Vérifier la santé au retour sur la page
        setTimeout(() => this.performRoutineHealthCheck(), 1000)
      }
    })

    // Gestionnaire avant déchargement de la page
    window.addEventListener('beforeunload', () => {
      // Créer un point de sauvegarde final
      this.createRecoveryPoint()
    })

    console.log('🛡️ Surveillance globale des erreurs activée')
  }

  /**
   * Obtient un rapport de diagnostic complet
   */
  getDiagnosticReport() {
    return {
      meta: {
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        version: '2.0.0',
        userAgent: navigator.userAgent
      },
      health: this.performHealthCheck(),
      errorHistory: this.errorHistory,
      performance: {
        ...this.performanceMetrics,
        sessionDuration: performance.now() - this.performanceMetrics.startTime
      },
      environment: this.validateEnvironment(),
      recovery: this.getRecoveryInfo(),
      recommendations: this.generateRecommendations()
    }
  }

  /**
   * Obtient les informations de récupération
   */
  getRecoveryInfo() {
    try {
      const recoveryPoint = localStorage.getItem('emergency_recovery_point')
      return recoveryPoint ? JSON.parse(recoveryPoint) : null
    } catch (error) {
      return null
    }
  }

  /**
   * Génère des recommandations basées sur l'état du système
   */
  generateRecommendations() {
    const recommendations = []
    const health = this.performHealthCheck()

    if (!health.localStorage) {
      recommendations.push({
        level: 'critical',
        message: 'localStorage non fonctionnel - rechargement recommandé',
        action: 'reload'
      })
    }

    if (health.errors.critical > 3) {
      recommendations.push({
        level: 'warning',
        message: 'Nombre élevé d\'erreurs critiques détecté',
        action: 'cleanup'
      })
    }

    if (health.storage.totalSize > 5 * 1024 * 1024) { // 5MB
      recommendations.push({
        level: 'info',
        message: 'Stockage local volumineux - nettoyage recommandé',
        action: 'storage_cleanup'
      })
    }

    if (health.performance.sessionDuration > 30 * 60 * 1000) { // 30 minutes
      recommendations.push({
        level: 'info',
        message: 'Session longue - redémarrage recommandé pour les performances',
        action: 'refresh'
      })
    }

    return recommendations
  }

  /**
   * Exporte le diagnostic en format lisible
   */
  exportDiagnostic() {
    const report = this.getDiagnosticReport()
    const exportData = {
      ...report,
      exportedAt: new Date().toISOString(),
      url: window.location.href
    }

    // Créer un blob pour téléchargement
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emergency-diagnostic-${Date.now()}.json`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
    
    console.log('📋 Diagnostic exporté')
    return exportData
  }

  /**
   * Importe et applique un diagnostic
   */
  importDiagnostic(diagnosticData) {
    try {
      if (typeof diagnosticData === 'string') {
        diagnosticData = JSON.parse(diagnosticData)
      }

      console.log('📥 Import de diagnostic:', diagnosticData.meta)
      
      // Appliquer les recommandations si appropriées
      if (diagnosticData.recommendations) {
        diagnosticData.recommendations.forEach(rec => {
          if (rec.level === 'critical') {
            console.warn('🚨 Recommandation critique:', rec.message)
          }
        })
      }

      return true
    } catch (error) {
      console.error('❌ Erreur lors de l\'import du diagnostic:', error)
      return false
    }
  }

  /**
   * Réinitialise complètement le service d'urgence
   */
  reset() {
    console.log('🔄 Réinitialisation complète du service d\'urgence')
    
    this.errorHistory = []
    this.criticalErrorCount = 0
    this.lastCleanup = null
    this.sessionId = this.generateSessionId()
    this.performanceMetrics = {
      startTime: performance.now(),
      errorCount: 0,
      cleanupCount: 0
    }
    
    this.performEmergencyCleanup('Réinitialisation manuelle')
    console.log('✅ Service d\'urgence réinitialisé')
  }

  /**
   * Obtient les statistiques de performance
   */
  getPerformanceStats() {
    return {
      sessionDuration: performance.now() - this.performanceMetrics.startTime,
      errorsPerMinute: this.performanceMetrics.errorCount / ((performance.now() - this.performanceMetrics.startTime) / 60000),
      totalErrors: this.performanceMetrics.errorCount,
      totalCleanups: this.performanceMetrics.cleanupCount,
      memoryUsage: this.getMemoryInfo(),
      storageUsage: {
        size: this.calculateStorageSize(),
        items: localStorage.length
      }
    }
  }

  /**
   * Active le mode debug
   */
  enableDebugMode() {
    this.debugMode = true
    console.log('🐛 Mode debug activé')
    
    // Ajouter un panneau de debug si pas déjà présent
    if (!document.getElementById('emergency-debug-panel')) {
      this.createDebugPanel()
    }
  }

  /**
   * Crée un panneau de debug visuel
   */
  createDebugPanel() {
    const panel = document.createElement('div')
    panel.id = 'emergency-debug-panel'
    panel.className = 'fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50'
    panel.innerHTML = `
      <div class="font-bold mb-2">🛠️ Emergency Debug</div>
      <div id="debug-content"></div>
      <button onclick="this.parentElement.remove()" class="mt-2 bg-red-600 px-2 py-1 rounded text-xs">Fermer</button>
    `
    
    document.body.appendChild(panel)
    
    // Mettre à jour le contenu périodiquement
    setInterval(() => {
      const content = document.getElementById('debug-content')
      if (content) {
        const stats = this.getPerformanceStats()
        content.innerHTML = `
          <div>Session: ${Math.round(stats.sessionDuration / 1000)}s</div>
          <div>Erreurs: ${stats.totalErrors}</div>
          <div>Nettoyages: ${stats.totalCleanups}</div>
          <div>Stockage: ${Math.round(stats.storageUsage.size / 1024)}KB</div>
          <div>Mémoire: ${stats.memoryUsage ? Math.round(stats.memoryUsage.used / 1024 / 1024) + 'MB' : 'N/A'}</div>
        `
      }
    }, 1000)
  }

  /**
   * Désactive le mode debug
   */
  disableDebugMode() {
    this.debugMode = false
    const panel = document.getElementById('emergency-debug-panel')
    if (panel) {
      panel.remove()
    }
    console.log('🐛 Mode debug désactivé')
  }
}

// Création de l'instance singleton
const emergencyService = new EmergencyService()

// Auto-initialisation si dans un environnement navigateur
if (typeof window !== 'undefined') {
  // Initialiser après que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      emergencyService.initialize()
    })
  } else {
    emergencyService.initialize()
  }
  
  // Exposer certaines méthodes globalement pour le debugging
  window.emergencyService = {
    getHealth: () => emergencyService.performHealthCheck(),
    getDiagnostic: () => emergencyService.getDiagnosticReport(),
    exportDiagnostic: () => emergencyService.exportDiagnostic(),
    cleanup: () => emergencyService.performEmergencyCleanup('Manuel'),
    reset: () => emergencyService.reset(),
    enableDebug: () => emergencyService.enableDebugMode(),
    disableDebug: () => emergencyService.disableDebugMode()
  }
}

export default emergencyService