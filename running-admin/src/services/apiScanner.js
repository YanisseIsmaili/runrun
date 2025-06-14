// running-admin/src/services/apiScanner.js
class ApiScanner {
  constructor() {
    this.baseUrl = 'http://localhost:5000' // Par défaut
    this.discoveredApis = new Map()
    this.isScanning = false
  }

  // Méthode pour changer l'API cible
  setBaseUrl(newBaseUrl) {
    this.baseUrl = newBaseUrl
    console.log('🎯 API cible changée:', newBaseUrl)
  }

  getBaseUrl() {
    return this.baseUrl
  }

  // Routes communes à scanner
  commonRoutes = [
    // Auth routes
    { path: '/api/auth/login', method: 'POST', category: 'Auth', description: 'Connexion utilisateur' },
    { path: '/api/auth/register', method: 'POST', category: 'Auth', description: 'Inscription utilisateur' },
    { path: '/api/auth/logout', method: 'POST', category: 'Auth', description: 'Déconnexion' },
    
    // User routes
    { path: '/api/users', method: 'GET', category: 'Users', description: 'Liste des utilisateurs' },
    { path: '/api/users/profile', method: 'GET', category: 'Users', description: 'Profil utilisateur' },
    { path: '/api/users/profile', method: 'PUT', category: 'Users', description: 'Modifier profil' },
    
    // Runs routes
    { path: '/api/runs', method: 'GET', category: 'Runs', description: 'Liste des courses' },
    { path: '/api/runs', method: 'POST', category: 'Runs', description: 'Créer une course' },
    { path: '/api/runs/stats', method: 'GET', category: 'Runs', description: 'Statistiques courses' },
    
    // Routes routes
    { path: '/api/routes', method: 'GET', category: 'Routes', description: 'Liste des parcours' },
    { path: '/api/routes', method: 'POST', category: 'Routes', description: 'Créer un parcours' },
    
    // Admin routes
    { path: '/api/admin/users', method: 'GET', category: 'Admin', description: 'Gestion utilisateurs' },
    { path: '/api/admin/stats', method: 'GET', category: 'Admin', description: 'Statistiques admin' },
    
    // Dashboard routes (nouveaux)
    { path: '/api/dashboard/overview', method: 'GET', category: 'Dashboard', description: 'Vue d\'ensemble' },
    { path: '/api/dashboard/recent-activity', method: 'GET', category: 'Dashboard', description: 'Activité récente' },
    { path: '/api/dashboard/system-health', method: 'GET', category: 'Dashboard', description: 'Santé système' },
    
    // Stats routes
    { path: '/api/stats/global', method: 'GET', category: 'Stats', description: 'Statistiques globales' },
    { path: '/api/stats/users', method: 'GET', category: 'Stats', description: 'Stats utilisateurs' },
    
    // Health check
    { path: '/api/health', method: 'GET', category: 'System', description: 'État du serveur' },
    { path: '/api/health/auth', method: 'GET', category: 'System', description: 'Test authentification' }
  ]

  async scanAvailableApis() {
    this.isScanning = true
    const results = new Map()
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

    console.log('🔍 Démarrage du scan des APIs...')

    for (const route of this.commonRoutes) {
      try {
        const response = await this.testEndpoint(route, token)
        results.set(route.path, {
          ...route,
          status: response.status,
          available: response.available,
          responseTime: response.responseTime,
          lastChecked: new Date(),
          requiresAuth: response.status === 401
        })
      } catch (error) {
        results.set(route.path, {
          ...route,
          status: 'error',
          available: false,
          error: error.message,
          lastChecked: new Date()
        })
      }
    }

    this.discoveredApis = results
    this.isScanning = false
    
    console.log(`✅ Scan terminé: ${this.getAvailableCount()}/${this.commonRoutes.length} APIs disponibles`)
    return results
  }

  async testEndpoint(route, token) {
    const startTime = Date.now()
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      }

      // Ajouter le token pour les routes qui en ont besoin
      if (token && !route.path.includes('/login') && !route.path.includes('/register')) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const fetchOptions = {
        method: route.method,
        headers,
        // Pour les tests, on utilise un timeout court
        signal: AbortSignal.timeout(3000)
      }

      // Pour les requêtes POST, ajouter un body minimal pour éviter les erreurs
      if (route.method === 'POST') {
        if (route.path.includes('/login')) {
          fetchOptions.body = JSON.stringify({ username: 'test', password: 'test' })
        } else if (route.path.includes('/register')) {
          fetchOptions.body = JSON.stringify({ username: 'test', email: 'test@test.com', password: 'test' })
        } else {
          fetchOptions.body = JSON.stringify({})
        }
      }

      const response = await fetch(`${this.baseUrl}${route.path}`, fetchOptions)
      const responseTime = Date.now() - startTime

      return {
        status: response.status,
        available: response.status < 500, // Disponible si pas d'erreur serveur
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      if (error.name === 'TimeoutError') {
        return { status: 'timeout', available: false, responseTime }
      }
      
      return { status: 'error', available: false, responseTime, error: error.message }
    }
  }

  getAvailableApis() {
    return Array.from(this.discoveredApis.values()).filter(api => api.available)
  }

  getApisByCategory() {
    const categories = {}
    
    Array.from(this.discoveredApis.values()).forEach(api => {
      if (!categories[api.category]) {
        categories[api.category] = []
      }
      categories[api.category].push(api)
    })

    return categories
  }

  getAvailableCount() {
    return this.getAvailableApis().length
  }

  getTotalCount() {
    return this.discoveredApis.size
  }

  async quickHealthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Méthode pour tester une API spécifique
  async testSpecificApi(apiPath) {
    const api = this.discoveredApis.get(apiPath)
    if (!api) return null

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    const result = await this.testEndpoint(api, token)
    
    // Mettre à jour le cache
    this.discoveredApis.set(apiPath, {
      ...api,
      ...result,
      lastChecked: new Date()
    })

    return result
  }

  // Export des données pour debug
  exportScanResults() {
    const results = Array.from(this.discoveredApis.entries()).map(([path, data]) => ({
      path,
      ...data,
      lastChecked: data.lastChecked?.toISOString()
    }))

    console.table(results)
    return results
  }
}

// Instance singleton
const apiScanner = new ApiScanner()
export default apiScanner