// running-admin/src/services/cryptoService.js - VERSION CORRIGÉE
import CryptoJS from 'crypto-js'

class CryptoService {
  constructor() {
    this.secretKey = this.generateSecretKey()
    this.fallbackMode = false
    this.isReady = false
    this.init()
  }

  init() {
    try {
      // Test du chiffrement pour s'assurer que ça fonctionne
      const testData = { test: 'value', timestamp: Date.now() }
      const encrypted = this.encrypt(testData)
      const decrypted = this.decrypt(encrypted)
      
      if (JSON.stringify(testData) === JSON.stringify(decrypted)) {
        this.isReady = true
        console.log('✅ CryptoService initialisé avec succès')
      } else {
        throw new Error('Test de chiffrement échoué')
      }
    } catch (error) {
      console.warn('⚠️ Chiffrement indisponible, utilisation du mode fallback')
      this.fallbackMode = true
      this.isReady = true
    }
  }

  generateSecretKey() {
    const baseData = [
      window.location.hostname || 'localhost',
      navigator.userAgent.substring(0, 50),
      'running-app-admin-2024'
    ].join('|')
    
    return CryptoJS.SHA256(baseData).toString()
  }

  encrypt(data) {
    try {
      if (this.fallbackMode) {
        return btoa(JSON.stringify(data)) // Base64 simple en fallback
      }
      
      const jsonString = JSON.stringify(data)
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.secretKey).toString()
      return encrypted
    } catch (error) {
      console.error('Erreur lors du chiffrement:', error)
      this.fallbackMode = true
      return btoa(JSON.stringify(data))
    }
  }

  decrypt(encryptedData) {
    try {
      if (!encryptedData) return null
      
      // Si en mode fallback, décoder en Base64
      if (this.fallbackMode) {
        try {
          return JSON.parse(atob(encryptedData))
        } catch (e) {
          console.warn('Erreur décodage Base64:', e)
          return null
        }
      }
      
      // Tenter de parser directement si c'est du JSON non chiffré
      try {
        const parsed = JSON.parse(encryptedData)
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed
        }
      } catch (e) {
        // Ce n'est pas du JSON direct, continuer avec le déchiffrement
      }
      
      // Tenter le déchiffrement AES
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey)
        const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8)
        
        if (!decryptedString) {
          throw new Error('Chaîne vide après déchiffrement')
        }
        
        return JSON.parse(decryptedString)
      } catch (decryptError) {
        // Essayer en Base64 si le déchiffrement AES échoue
        try {
          return JSON.parse(atob(encryptedData))
        } catch (b64Error) {
          console.warn('Impossible de décrypter les données')
          return null
        }
      }
    } catch (error) {
      console.warn('Erreur lors du déchiffrement:', error.message)
      return null
    }
  }

  setSecureItem(key, data, expirationHours = 168) { // 7 jours par défaut
    try {
      const expirationTime = new Date().getTime() + (expirationHours * 60 * 60 * 1000)
      
      const dataWithExpiration = {
        data: data,
        expiration: expirationTime,
        timestamp: new Date().getTime(),
        version: '1.1'
      }
      
      const encrypted = this.encrypt(dataWithExpiration)
      if (encrypted) {
        localStorage.setItem(key, encrypted)
        return true
      }
      return false
    } catch (error) {
      console.error('Erreur lors de la sauvegarde sécurisée:', error)
      
      // Fallback : stockage direct
      try {
        localStorage.setItem(key, JSON.stringify(data))
        return true
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError)
        return false
      }
    }
  }

  getSecureItem(key) {
    try {
      const encryptedData = localStorage.getItem(key)
      if (!encryptedData) return null
      
      const decryptedData = this.decrypt(encryptedData)
      if (!decryptedData) {
        console.warn(`Données corrompues pour ${key}, suppression`)
        this.removeSecureItem(key)
        return null
      }
      
      // Vérifier l'expiration si présente
      if (decryptedData.expiration && new Date().getTime() > decryptedData.expiration) {
        console.log(`Données expirées pour ${key}, suppression`)
        this.removeSecureItem(key)
        return null
      }
      
      // Retourner les données ou l'objet entier si pas d'encapsulation
      return decryptedData.data !== undefined ? decryptedData.data : decryptedData
    } catch (error) {
      console.warn('Erreur lors de la récupération sécurisée:', error.message)
      this.removeSecureItem(key)
      return null
    }
  }

  removeSecureItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      return false
    }
  }

  // Méthodes pour diagnostiquer le stockage
  getStorageInfo() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('running_app_'))
      let validItems = 0
      let corruptedItems = 0
      
      keys.forEach(key => {
        try {
          const data = this.getSecureItem(key)
          if (data) validItems++
          else corruptedItems++
        } catch {
          corruptedItems++
        }
      })

      return {
        totalItems: keys.length,
        validItems,
        corruptedItems,
        isHealthy: corruptedItems === 0,
        fallbackMode: this.fallbackMode,
        isReady: this.isReady
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse du stockage:', error)
      return {
        totalItems: 0,
        validItems: 0,
        corruptedItems: 0,
        isHealthy: false,
        fallbackMode: this.fallbackMode,
        isReady: false,
        error: error.message
      }
    }
  }

  cleanExpiredItems() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('running_app_'))
      let cleanedCount = 0
      
      keys.forEach(key => {
        try {
          const rawData = localStorage.getItem(key)
          if (!rawData) return
          
          const decryptedData = this.decrypt(rawData)
          if (!decryptedData) {
            console.warn(`Suppression de l'élément corrompu: ${key}`)
            this.removeSecureItem(key)
            cleanedCount++
            return
          }
          
          if (decryptedData.expiration && new Date().getTime() > decryptedData.expiration) {
            console.log(`Suppression de l'élément expiré: ${key}`)
            this.removeSecureItem(key)
            cleanedCount++
          }
        } catch (error) {
          console.warn(`Suppression de l'élément défaillant: ${key}`, error.message)
          this.removeSecureItem(key)
          cleanedCount++
        }
      })
      
      console.log(`Nettoyage terminé: ${cleanedCount} éléments supprimés`)
      return cleanedCount
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error)
      return 0
    }
  }

  clearAllSecureData() {
    try {
      const keys = Object.keys(localStorage)
      const clearedKeys = []
      
      keys.forEach(key => {
        if (key.startsWith('running_app_')) {
          localStorage.removeItem(key)
          clearedKeys.push(key)
        }
      })
      
      console.log(`${clearedKeys.length} éléments supprimés du stockage`)
      return clearedKeys.length
    } catch (error) {
      console.error('Erreur lors du vidage complet:', error)
      return 0
    }
  }

  // Diagnostique complet
  diagnose() {
    const info = this.getStorageInfo()
    console.log('=== DIAGNOSTIC CRYPTOSERVICE ===')
    console.log('État:', this.isReady ? '✅ Prêt' : '❌ Non prêt')
    console.log('Mode:', this.fallbackMode ? '⚠️ Fallback (Base64)' : '🔒 Chiffré (AES)')
    console.log('Éléments total:', info.totalItems)
    console.log('Éléments valides:', info.validItems)
    console.log('Éléments corrompus:', info.corruptedItems)
    console.log('Santé globale:', info.isHealthy ? '✅ Saine' : '⚠️ Problèmes détectés')
    
    if (!info.isHealthy) {
      console.log('🔧 Exécution du nettoyage...')
      const cleaned = this.cleanExpiredItems()
      console.log(`🧹 ${cleaned} éléments nettoyés`)
    }
    
    return info
  }
}

const cryptoService = new CryptoService()
export default cryptoService