import CryptoJS from 'crypto-js'

class CryptoService {
  constructor() {
    this.secretKey = this.generateSecretKey()
    this.fallbackMode = false
  }

  generateSecretKey() {
    const baseData = [
      window.location.hostname,
      navigator.userAgent.substring(0, 50),
      'running-app-admin-2024'
    ].join('|')
    
    return CryptoJS.SHA256(baseData).toString()
  }

  encrypt(data) {
    try {
      if (this.fallbackMode) {
        return JSON.stringify(data)
      }
      
      const jsonString = JSON.stringify(data)
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.secretKey).toString()
      return encrypted
    } catch (error) {
      console.error('Erreur lors du chiffrement:', error)
      this.fallbackMode = true
      return JSON.stringify(data)
    }
  }

  decrypt(encryptedData) {
    try {
      if (!encryptedData) return null
      
      // Tenter de parser directement si c'est du JSON non chiffré
      try {
        const parsed = JSON.parse(encryptedData)
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed
        }
      } catch (e) {
        // Ce n'est pas du JSON direct, continuer avec le déchiffrement
      }
      
      // Tenter le déchiffrement normal
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey)
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8)
      
      if (!decryptedString) {
        console.warn('Impossible de déchiffrer les données, nettoyage nécessaire')
        return null
      }
      
      return JSON.parse(decryptedString)
    } catch (error) {
      console.warn('Erreur lors du déchiffrement, données corrompues:', error.message)
      return null
    }
  }

  setSecureItem(key, data, expirationHours = 24) {
    try {
      const expirationTime = new Date().getTime() + (expirationHours * 60 * 60 * 1000)
      
      const dataWithExpiration = {
        data: data,
        expiration: expirationTime,
        timestamp: new Date().getTime(),
        version: '1.0'
      }
      
      const encrypted = this.encrypt(dataWithExpiration)
      if (encrypted) {
        localStorage.setItem(key, encrypted)
        return true
      }
      return false
    } catch (error) {
      console.error('Erreur lors de la sauvegarde sécurisée:', error)
      return false
    }
  }

  getSecureItem(key) {
    try {
      const encryptedData = localStorage.getItem(key)
      if (!encryptedData) return null
      
      const decryptedData = this.decrypt(encryptedData)
      if (!decryptedData) {
        this.removeSecureItem(key)
        return null
      }
      
      if (decryptedData.expiration && new Date().getTime() > decryptedData.expiration) {
        this.removeSecureItem(key)
        return null
      }
      
      return decryptedData.data
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

  cleanExpiredItems() {
    try {
      const keys = Object.keys(localStorage)
      const runningAppKeys = keys.filter(key => key.startsWith('running_app_'))
      
      runningAppKeys.forEach(key => {
        try {
          const rawData = localStorage.getItem(key)
          if (!rawData) return
          
          const decryptedData = this.decrypt(rawData)
          if (!decryptedData) {
            console.warn(`Suppression de l'élément corrompu: ${key}`)
            this.removeSecureItem(key)
            return
          }
          
          if (decryptedData.expiration && new Date().getTime() > decryptedData.expiration) {
            console.log(`Suppression de l'élément expiré: ${key}`)
            this.removeSecureItem(key)
          }
        } catch (error) {
          console.warn(`Suppression de l'élément défaillant: ${key}`, error.message)
          this.removeSecureItem(key)
        }
      })
      
      console.log(`Nettoyage terminé: ${runningAppKeys.length} éléments vérifiés`)
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error)
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
      return true
    } catch (error) {
      console.error('Erreur lors du vidage complet:', error)
      return false
    }
  }

  reset() {
    this.fallbackMode = false
    this.clearAllSecureData()
  }

  checkStorageIntegrity() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('running_app_'))
    let corruptedCount = 0
    
    keys.forEach(key => {
      try {
        const data = localStorage.getItem(key)
        this.decrypt(data)
      } catch (error) {
        corruptedCount++
        console.warn(`Élément corrompu détecté: ${key}`)
      }
    })
    
    return {
      totalItems: keys.length,
      corruptedItems: corruptedCount,
      isHealthy: corruptedCount === 0
    }
  }
}

const cryptoService = new CryptoService()
export default cryptoService