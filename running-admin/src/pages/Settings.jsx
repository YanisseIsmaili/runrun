import { useState, useEffect } from 'react'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import api from '../services/api'

// Données temporaires pour le développement
const tempSettings = {
  general: {
    appName: 'Running App',
    appLogo: null,
    allowRegistration: true,
    allowPasswordReset: true,
    defaultLanguage: 'fr',
    maintenanceMode: false
  },
  email: {
    smtpServer: 'smtp.example.com',
    smtpPort: '587',
    smtpUsername: 'noreply@example.com',
    smtpPassword: '••••••••••••',
    emailSender: 'Running App <noreply@example.com>',
    emailFooter: 'Running App - Tous droits réservés'
  },
  notifications: {
    enableEmailNotifications: true,
    notifyOnNewUser: true,
    notifyOnNewRun: false,
    adminEmails: 'admin@example.com, manager@example.com'
  },
  security: {
    sessionExpiration: '24',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true
  },
  integration: {
    enableGoogleFit: true,
    enableAppleHealth: true,
    enableStrava: false,
    stravaApiKey: '',
    enableFitbit: false,
    fitbitApiKey: ''
  }
}

const Settings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('general')
  
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Dans un projet réel, remplacez ceci par un appel API pour obtenir les paramètres réels
        // const response = await api.settings.get()
        // setSettings(response.data)
        
        // Utilisation des données temporaires pour le développement
        setSettings(tempSettings)
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres', err)
        setError('Impossible de charger les paramètres')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSettings()
  }, [])
  
  const handleChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    })
  }
  
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Dans un projet réel, remplacez ceci par un appel API pour enregistrer les paramètres
      // await api.settings.update(settings)
      
      // Simulation d'un délai pour le développement
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Paramètres enregistrés avec succès')
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des paramètres', err)
      setError('Impossible d\'enregistrer les paramètres')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (error && !settings) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Paramètres</h1>
          <p className="mt-1 text-sm text-gray-500">Configuration de l'application Running</p>
        </div>
        
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`btn btn-primary ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enregistrement...
            </span>
          ) : (
            <span className="flex items-center">
              <BookmarkIcon className="h-5 w-5 mr-2" />
              Enregistrer
            </span>
          )}
        </button>
      </div>
      
      {/* Messages de succès ou d'erreur */}
      {error && settings && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Onglets de paramètres */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('general')}
          >
            Général
          </button>
          <button
            className={`${
              activeTab === 'email'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('email')}
          >
            Email
          </button>
          <button
            className={`${
              activeTab === 'notifications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`${
              activeTab === 'security'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('security')}
          >
            Sécurité
          </button>
          <button
            className={`${
              activeTab === 'integration'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('integration')}
          >
            Intégrations
          </button>
        </nav>
      </div>
      
      {/* Contenu des onglets */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Paramètres généraux</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="appName" className="form-label">Nom de l'application</label>
                  <input
                    type="text"
                    id="appName"
                    className="form-input"
                    value={settings.general.appName}
                    onChange={(e) => handleChange('general', 'appName', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="appLogo" className="form-label">Logo</label>
                  <input
                    type="file"
                    id="appLogo"
                    className="form-input"
                    accept="image/*"
                    onChange={(e) => {
                      console.log('File selected:', e.target.files[0])
                    }}
                  />
                </div>
                
                <div>
                  <label htmlFor="defaultLanguage" className="form-label">Langue par défaut</label>
                  <select
                    id="defaultLanguage"
                    className="form-input"
                    value={settings.general.defaultLanguage}
                    onChange={(e) => handleChange('general', 'defaultLanguage', e.target.value)}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-3 pt-6">
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.general.allowRegistration}
                    onChange={(e) => handleChange('general', 'allowRegistration', e.target.checked)}
                  />
                  <label htmlFor="allowRegistration" className="text-sm text-gray-700">
                    Autoriser les nouvelles inscriptions
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowPasswordReset"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.general.allowPasswordReset}
                    onChange={(e) => handleChange('general', 'allowPasswordReset', e.target.checked)}
                  />
                  <label htmlFor="allowPasswordReset" className="text-sm text-gray-700">
                    Autoriser la réinitialisation des mots de passe
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => handleChange('general', 'maintenanceMode', e.target.checked)}
                  />
                  <label htmlFor="maintenanceMode" className="text-sm text-gray-700">
                    Mode maintenance
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'email' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configuration Email</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="smtpServer" className="form-label">Serveur SMTP</label>
                  <input
                    type="text"
                    id="smtpServer"
                    className="form-input"
                    value={settings.email.smtpServer}
                    onChange={(e) => handleChange('email', 'smtpServer', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="smtpPort" className="form-label">Port SMTP</label>
                  <input
                    type="text"
                    id="smtpPort"
                    className="form-input"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleChange('email', 'smtpPort', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="smtpUsername" className="form-label">Nom d'utilisateur SMTP</label>
                  <input
                    type="text"
                    id="smtpUsername"
                    className="form-input"
                    value={settings.email.smtpUsername}
                    onChange={(e) => handleChange('email', 'smtpUsername', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="smtpPassword" className="form-label">Mot de passe SMTP</label>
                  <input
                    type="password"
                    id="smtpPassword"
                    className="form-input"
                    value={settings.email.smtpPassword}
                    onChange={(e) => handleChange('email', 'smtpPassword', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="emailSender" className="form-label">Expéditeur des emails</label>
                  <input
                    type="text"
                    id="emailSender"
                    className="form-input"
                    value={settings.email.emailSender}
                    onChange={(e) => handleChange('email', 'emailSender', e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="emailFooter" className="form-label">Pied de page des emails</label>
                  <input
                    type="text"
                    id="emailFooter"
                    className="form-input"
                    value={settings.email.emailFooter}
                    onChange={(e) => handleChange('email', 'emailFooter', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                >
                  Tester la configuration
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Paramètres de notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableEmailNotifications"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.notifications.enableEmailNotifications}
                    onChange={(e) => handleChange('notifications', 'enableEmailNotifications', e.target.checked)}
                  />
                  <label htmlFor="enableEmailNotifications" className="text-sm text-gray-700">
                    Activer les notifications par email
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="notifyOnNewUser"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.notifications.notifyOnNewUser}
                    onChange={(e) => handleChange('notifications', 'notifyOnNewUser', e.target.checked)}
                  />
                  <label htmlFor="notifyOnNewUser" className="text-sm text-gray-700">
                    Notifier lors de l'inscription d'un nouvel utilisateur
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="notifyOnNewRun"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.notifications.notifyOnNewRun}
                    onChange={(e) => handleChange('notifications', 'notifyOnNewRun', e.target.checked)}
                  />
                  <label htmlFor="notifyOnNewRun" className="text-sm text-gray-700">
                    Notifier lors de l'enregistrement d'une nouvelle course
                  </label>
                </div>
                
                <div>
                  <label htmlFor="adminEmails" className="form-label">Emails des administrateurs</label>
                  <textarea
                    id="adminEmails"
                    className="form-input h-24"
                    value={settings.notifications.adminEmails}
                    onChange={(e) => handleChange('notifications', 'adminEmails', e.target.value)}
                    placeholder="Séparez les adresses par des virgules"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Paramètres de sécurité</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="sessionExpiration" className="form-label">Expiration de session (heures)</label>
                  <input
                    type="number"
                    id="sessionExpiration"
                    className="form-input"
                    value={settings.security.sessionExpiration}
                    onChange={(e) => handleChange('security', 'sessionExpiration', e.target.value)}
                    min="1"
                    max="720"
                  />
                </div>
                
                <div>
                  <label htmlFor="maxLoginAttempts" className="form-label">Tentatives de connexion maximales</label>
                  <input
                    type="number"
                    id="maxLoginAttempts"
                    className="form-input"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleChange('security', 'maxLoginAttempts', e.target.value)}
                    min="1"
                    max="20"
                  />
                </div>
                
                <div>
                  <label htmlFor="passwordMinLength" className="form-label">Longueur minimale du mot de passe</label>
                  <input
                    type="number"
                    id="passwordMinLength"
                    className="form-input"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleChange('security', 'passwordMinLength', e.target.value)}
                    min="6"
                    max="20"
                  />
                </div>
                
                <div className="flex items-center space-x-3 pt-6">
                  <input
                    type="checkbox"
                    id="passwordRequireSpecial"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.security.passwordRequireSpecial}
                    onChange={(e) => handleChange('security', 'passwordRequireSpecial', e.target.checked)}
                  />
                  <label htmlFor="passwordRequireSpecial" className="text-sm text-gray-700">
                    Exiger des caractères spéciaux dans le mot de passe
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="passwordRequireNumbers"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.security.passwordRequireNumbers}
                    onChange={(e) => handleChange('security', 'passwordRequireNumbers', e.target.checked)}
                  />
                  <label htmlFor="passwordRequireNumbers" className="text-sm text-gray-700">
                    Exiger des chiffres dans le mot de passe
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="passwordRequireUppercase"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.security.passwordRequireUppercase}
                    onChange={(e) => handleChange('security', 'passwordRequireUppercase', e.target.checked)}
                  />
                  <label htmlFor="passwordRequireUppercase" className="text-sm text-gray-700">
                    Exiger des majuscules dans le mot de passe
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'integration' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Intégrations externes</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableGoogleFit"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.integration.enableGoogleFit}
                    onChange={(e) => handleChange('integration', 'enableGoogleFit', e.target.checked)}
                  />
                  <label htmlFor="enableGoogleFit" className="text-sm text-gray-700">
                    Activer l'intégration avec Google Fit
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableAppleHealth"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.integration.enableAppleHealth}
                    onChange={(e) => handleChange('integration', 'enableAppleHealth', e.target.checked)}
                  />
                  <label htmlFor="enableAppleHealth" className="text-sm text-gray-700">
                    Activer l'intégration avec Apple Health
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableStrava"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.integration.enableStrava}
                    onChange={(e) => handleChange('integration', 'enableStrava', e.target.checked)}
                  />
                  <label htmlFor="enableStrava" className="text-sm text-gray-700">
                    Activer l'intégration avec Strava
                  </label>
                </div>
                
                {settings.integration.enableStrava && (
                  <div>
                    <label htmlFor="stravaApiKey" className="form-label">Clé API Strava</label>
                    <input
                      type="text"
                      id="stravaApiKey"
                      className="form-input"
                      value={settings.integration.stravaApiKey}
                      onChange={(e) => handleChange('integration', 'stravaApiKey', e.target.value)}
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-3 mt-4">
                  <input
                    type="checkbox"
                    id="enableFitbit"
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={settings.integration.enableFitbit}
                    onChange={(e) => handleChange('integration', 'enableFitbit', e.target.checked)}
                  />
                  <label htmlFor="enableFitbit" className="text-sm text-gray-700">
                    Activer l'intégration avec Fitbit
                  </label>
                </div>
                
                {settings.integration.enableFitbit && (
                  <div>
                    <label htmlFor="fitbitApiKey" className="form-label">Clé API Fitbit</label>
                    <input
                      type="text"
                      id="fitbitApiKey"
                      className="form-input"
                      value={settings.integration.fitbitApiKey}
                      onChange={(e) => handleChange('integration', 'fitbitApiKey', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings