import CryptoJS from 'crypto-js'

class CryptoService {
  constructor() {
    // Générer une clé unique basée sur l'URL et des données du navigateur
    this.secretKey = this.generateSecretKey()
  }

  /**
   * Génère une clé secrète unique pour cette page/application
   */
  generateSecretKey() {
    const baseData = [
      window.location.hostname,
      navigator.userAgent.substring(0, 50),
      'running-app-admin-2024'
    ].join('|')
    
    return CryptoJS.SHA256(baseData).toString()
  }

  /**
   * Chiffre des données avant de les stocker
   */
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data)
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.secretKey).toString()
      return encrypted
    } catch (error) {
      console.error('Erreur lors du chiffrement:', error)
      return null
    }
  }

  /**
   * Déchiffre des données récupérées du stockage
   */
  decrypt(encryptedData) {
    try {
      if (!encryptedData) return null
      
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey)
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8)
      
      if (!decryptedString) return null
      
      return JSON.parse(decryptedString)
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error)
      return null
    }
  }

  /**
   * Stocke des données chiffrées dans le localStorage
   */
  setSecureItem(key, data, expirationHours = 24) {
    try {
      const expirationTime = new Date().getTime() + (expirationHours * 60 * 60 * 1000)
      
      const dataWithExpiration = {
        data: data,
        expiration: expirationTime,
        timestamp: new Date().getTime()
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

  /**
   * Récupère des données chiffrées du localStorage
   */
  getSecureItem(key) {
    try {
      const encryptedData = localStorage.getItem(key)
      if (!encryptedData) return null
      
      const decryptedData = this.decrypt(encryptedData)
      if (!decryptedData) return null
      
      // Vérifier l'expiration
      if (decryptedData.expiration && new Date().getTime() > decryptedData.expiration) {
        this.removeSecureItem(key)
        return null
      }
      
      return decryptedData.data
    } catch (error) {
      console.error('Erreur lors de la récupération sécurisée:', error)
      return null
    }
  }

  /**
   * Supprime un élément du localStorage
   */
  removeSecureItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      return false
    }
  }

  /**
   * Nettoie tous les éléments expirés
   */
  cleanExpiredItems() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('running_app_')) {
          const data = this.getSecureItem(key)
          // Si getSecureItem retourne null, l'élément a été supprimé automatiquement
        }
      })
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error)
    }
  }

  /**
   * Vide complètement le stockage sécurisé de l'application
   */
  clearAllSecureData() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('running_app_')) {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch (error) {
      console.error('Erreur lors du vidage complet:', error)
      return false
    }
  }
}

// Instance singleton
const cryptoService = new CryptoService()

export default cryptoService