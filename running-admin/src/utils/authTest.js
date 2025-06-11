const testAuth = async () => {
  const token = localStorage.getItem('auth_token')
  const userData = localStorage.getItem('user_data')
  
  console.log('%c=== TEST D\'AUTHENTIFICATION ===', 'color: blue; font-weight: bold')
  console.log('Token présent:', token ? '✅ Oui' : '❌ Non')
  
  if (token) {
    console.log('Token (premiers 50 chars):', token.substring(0, 50) + '...')
  }
  
  console.log('Données utilisateur stockées:', userData ? JSON.parse(userData) : '❌ Aucune')
  
  if (token) {
    try {
      console.log('%c🔄 Test de validation du token...', 'color: orange')
      const response = await fetch('http://localhost:5000/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Réponse de validation:', data)
      
      if (data.status === 'success') {
        console.log('%c✅ Token valide', 'color: green; font-weight: bold')
        console.log('Utilisateur:', data.data.user.username)
        console.log('Email:', data.data.user.email)
        console.log('Admin:', data.data.user.is_admin ? '✅ Oui' : '❌ Non')
        console.log('Actif:', data.data.user.is_active ? '✅ Oui' : '❌ Non')
        
        // Test d'accès aux routes admin
        console.log('%c🔄 Test d\'accès aux itinéraires...', 'color: orange')
        const routesResponse = await fetch('http://localhost:5000/api/routes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Routes response status:', routesResponse.status)
        if (routesResponse.status === 200) {
          console.log('%c✅ Accès aux itinéraires autorisé', 'color: green')
        } else if (routesResponse.status === 403) {
          console.log('%c🚫 Accès aux itinéraires refusé - Permissions insuffisantes', 'color: red')
          const errorData = await routesResponse.json()
          console.log('Détails de l\'erreur:', errorData)
        } else {
          console.log('%c❌ Erreur d\'accès aux itinéraires:', 'color: red', routesResponse.status)
        }
        
      } else {
        console.log('%c❌ Token invalide:', 'color: red', data.message)
      }
    } catch (error) {
      console.log('%c💥 Erreur de validation:', 'color: red', error)
      console.log('Détails:', error.message)
    }
  }
  
  console.log('%c=== FIN DU TEST ===', 'color: blue; font-weight: bold')
}

// Fonction pour promouvoir en admin (utilise la route temporaire)
const promoteToAdmin = async () => {
  const token = localStorage.getItem('auth_token')
  
  if (!token) {
    console.log('❌ Aucun token trouvé')
    return
  }
  
  try {
    console.log('%c🔄 Tentative de promotion admin...', 'color: orange')
    const response = await fetch('http://localhost:5000/api/auth/promote-admin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret_key: 'PROMOTE_ADMIN_SECRET_2025'
      })
    })
    
    const data = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', data)
    
    if (data.status === 'success') {
      console.log('%c✅ Promotion réussie!', 'color: green; font-weight: bold')
      console.log('Nouvel utilisateur:', data.data)
      
      // Mettre à jour les données locales
      localStorage.setItem('user_data', JSON.stringify(data.data))
      
      console.log('%c🔄 Rechargement de la page recommandé', 'color: orange')
      if (window.confirm('Promotion réussie! Recharger la page maintenant?')) {
        window.location.reload()
      }
    } else {
      console.log('%c❌ Échec de la promotion:', 'color: red', data.message)
    }
  } catch (error) {
    console.log('%c💥 Erreur lors de la promotion:', 'color: red', error)
  }
}

// Fonction de test de santé API
const testApiHealth = async () => {
  try {
    console.log('%c🔄 Test de santé API...', 'color: orange')
    const response = await fetch('http://localhost:5000/api/health')
    const data = await response.json()
    
    console.log('Santé API:', response.status === 200 ? '✅ OK' : '❌ Problème')
    console.log('Réponse:', data)
  } catch (error) {
    console.log('%c💥 API inaccessible:', 'color: red', error.message)
  }
}

// Exporter pour utilisation dans la console du navigateur
window.testAuth = testAuth
window.promoteToAdmin = promoteToAdmin
window.testApiHealth = testApiHealth

export { testAuth, promoteToAdmin, testApiHealth }