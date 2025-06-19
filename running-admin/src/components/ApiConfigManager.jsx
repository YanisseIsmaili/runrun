// running-admin/src/components/ApiConfigManager.jsx
import { useState, useEffect } from 'react'
import {
  Cog6ToothIcon,
  ServerIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

import apiConfigUtils from '../utils/apiConfig'

const ApiConfigManager = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(() => apiConfigUtils.getCompleteApiConfig())
  const [editingApis, setEditingApis] = useState([])
  const [newApi, setNewApi] = useState({ ip: '', name: '' })
  const [activeTab, setActiveTab] = useState('apis') // apis, settings, import-export
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [validationErrors, setValidationErrors] = useState([])

  // Recharger la configuration quand le composant s'ouvre
  useEffect(() => {
    if (isOpen) {
      const newConfig = apiConfigUtils.getCompleteApiConfig()
      setConfig(newConfig)
      setEditingApis([...newConfig.defaultApis, ...newConfig.customApis])
    }
  }, [isOpen])

  // Validation en temps réel
  useEffect(() => {
    const errors = []
    editingApis.forEach((api, index) => {
      if (!apiConfigUtils.validateApiConfig(api)) {
        errors.push(`API ${index + 1}: Configuration invalide`)
      }
    })
    setValidationErrors(errors)
  }, [editingApis])

  const handleAddApi = () => {
    if (!newApi.ip.trim() || !newApi.name.trim()) {
      alert('Veuillez remplir l\'IP/hostname et le nom')
      return
    }

    if (!apiConfigUtils.validateApiConfig(newApi)) {
      alert('Adresse IP ou hostname invalide')
      return
    }

    if (editingApis.some(api => api.ip === newApi.ip)) {
      alert('Cette IP existe déjà')
      return
    }

    setEditingApis([...editingApis, { ...newApi }])
    setNewApi({ ip: '', name: '' })
  }

  const handleRemoveApi = (index) => {
    setEditingApis(editingApis.filter((_, i) => i !== index))
  }

  const handleUpdateApi = (index, field, value) => {
    const updated = [...editingApis]
    updated[index] = { ...updated[index], [field]: value }
    setEditingApis(updated)
  }

  const handleSaveConfiguration = () => {
    if (validationErrors.length > 0) {
      alert('Veuillez corriger les erreurs avant de sauvegarder')
      return
    }

    // Séparer les APIs par défaut et personnalisées
    const defaultIps = config.defaultApis.map(api => api.ip)
    const customApis = editingApis.filter(api => !defaultIps.includes(api.ip))

    // Sauvegarder les APIs personnalisées
    apiConfigUtils.saveCustomApis(customApis)

    alert('Configuration sauvegardée ! Rechargez la page pour appliquer les changements.')
    onClose()
  }

  const handleExportConfig = () => {
    const exportConfig = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      apis: editingApis,
      settings: {
        defaultPort: config.config.defaultPort,
        apiTimeout: config.config.apiTimeout,
        debugMode: config.config.debugMode,
        monitoringInterval: config.config.monitoringInterval
      }
    }
    setExportData(JSON.stringify(exportConfig, null, 2))
  }

  const handleImportConfig = () => {
    try {
      const imported = JSON.parse(importData)
      
      if (!imported.apis || !Array.isArray(imported.apis)) {
        alert('Format d\'import invalide: apis manquants')
        return
      }

      const validApis = apiConfigUtils.validateApiList(imported.apis)
      if (validApis.length === 0) {
        alert('Aucune API valide trouvée dans l\'import')
        return
      }

      setEditingApis(validApis)
      setImportData('')
      alert(`${validApis.length} API(s) importée(s) avec succès`)
      
    } catch (error) {
      alert('Erreur de parsing JSON: ' + error.message)
    }
  }

  const downloadConfig = () => {
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `running-admin-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-5/6 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-semibold">Gestionnaire de Configuration API</h2>
                <p className="text-blue-100 text-sm">Gérez vos serveurs API et paramètres</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'apis', label: 'APIs', icon: ServerIcon },
              { id: 'settings', label: 'Paramètres', icon: Cog6ToothIcon },
              { id: 'import-export', label: 'Import/Export', icon: ArrowUpTrayIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Onglet APIs */}
          {activeTab === 'apis' && (
            <div className="space-y-6">
              
              {/* Informations actuelles */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Configuration actuelle</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">APIs par défaut:</span>
                    <div className="text-blue-600">{config.defaultApis.length}</div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">APIs personnalisées:</span>
                    <div className="text-blue-600">{config.customApis.length}</div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Port par défaut:</span>
                    <div className="text-blue-600">{config.config.defaultPort}</div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Timeout:</span>
                    <div className="text-blue-600">{config.config.apiTimeout}ms</div>
                  </div>
                </div>
              </div>

              {/* Erreurs de validation */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-900">Erreurs de validation</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Formulaire d'ajout */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Ajouter une nouvelle API</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="IP ou hostname (ex: 192.168.1.100)"
                    value={newApi.ip}
                    onChange={(e) => setNewApi({ ...newApi, ip: e.target.value })}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Nom de l'API"
                    value={newApi.name}
                    onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                    className="input"
                  />
                  <button
                    onClick={handleAddApi}
                    className="btn bg-green-600 hover:bg-green-700 text-white"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Liste des APIs */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">APIs configurées ({editingApis.length})</h3>
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {editingApis.map((api, index) => {
                    const isDefault = config.defaultApis.some(defaultApi => defaultApi.ip === api.ip)
                    const isValid = apiConfigUtils.validateApiConfig(api)
                    
                    return (
                      <div key={index} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                IP/Hostname
                              </label>
                              <input
                                type="text"
                                value={api.ip}
                                onChange={(e) => handleUpdateApi(index, 'ip', e.target.value)}
                                disabled={isDefault}
                                className={`input ${!isValid ? 'border-red-300' : ''} ${
                                  isDefault ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Nom
                              </label>
                              <input
                                type="text"
                                value={api.name}
                                onChange={(e) => handleUpdateApi(index, 'name', e.target.value)}
                                disabled={isDefault}
                                className={`input ${!isValid ? 'border-red-300' : ''} ${
                                  isDefault ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {isDefault && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Défaut
                              </span>
                            )}
                            {isValid ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                            )}
                            {!isDefault && (
                              <button
                                onClick={() => handleRemoveApi(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer cette API"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* URL générée */}
                        <div className="mt-2 text-xs text-gray-500">
                          <GlobeAltIcon className="h-3 w-3 inline mr-1" />
                          URL: {apiConfigUtils.generateApiUrl(api)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Paramètres */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-900">Configuration via .env</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  Ces paramètres sont définis dans le fichier .env et ne peuvent pas être modifiés via cette interface.
                  Modifiez le fichier .env et redémarrez l'application pour changer ces valeurs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port par défaut
                    </label>
                    <div className="input bg-gray-100 cursor-not-allowed">
                      {config.config.defaultPort}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Variable: REACT_APP_DEFAULT_API_PORT
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout (ms)
                    </label>
                    <div className="input bg-gray-100 cursor-not-allowed">
                      {config.config.apiTimeout}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Variable: REACT_APP_API_TIMEOUT
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode Debug
                    </label>
                    <div className="input bg-gray-100 cursor-not-allowed">
                      {config.config.debugMode ? 'Activé' : 'Désactivé'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Variable: REACT_APP_DEBUG_MODE
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intervalle de monitoring (ms)
                    </label>
                    <div className="input bg-gray-100 cursor-not-allowed">
                      {config.config.monitoringInterval}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Variable: REACT_APP_MONITORING_INTERVAL
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API par défaut
                    </label>
                    <div className="input bg-gray-100 cursor-not-allowed">
                      {config.config.defaultSelectedApi || 'Aucune'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Variable: REACT_APP_DEFAULT_SELECTED_API
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total APIs configurées
                    </label>
                    <div className="input bg-gray-100 cursor-not-allowed">
                      {config.allApis.length}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      APIs par défaut + APIs personnalisées
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions pour modifier les paramètres */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Comment modifier ces paramètres</h4>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                  <li>Ouvrez le fichier <code className="bg-blue-100 px-1 rounded">.env</code> ou <code className="bg-blue-100 px-1 rounded">.env.local</code> à la racine du projet</li>
                  <li>Modifiez les variables REACT_APP_* selon vos besoins</li>
                  <li>Redémarrez l'application pour appliquer les changements</li>
                  <li>Utilisez le script <code className="bg-blue-100 px-1 rounded">node scripts/init-config.js</code> pour une configuration assistée</li>
                </ol>
              </div>
            </div>
          )}

          {/* Onglet Import/Export */}
          {activeTab === 'import-export' && (
            <div className="space-y-6">
              
              {/* Export */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Exporter la configuration</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleExportConfig}
                    className="btn bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Générer export JSON
                  </button>
                  
                  {exportData && (
                    <div className="space-y-2">
                      <textarea
                        value={exportData}
                        readOnly
                        rows={8}
                        className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
                      />
                      <button
                        onClick={downloadConfig}
                        className="btn bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Télécharger fichier
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Import */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Importer une configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collez le JSON de configuration
                    </label>
                    <textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder={`{
  "version": "1.0",
  "apis": [
    {"ip": "192.168.1.100", "name": "Mon API"},
    {"ip": "localhost", "name": "Local"}
  ]
}`}
                      rows={8}
                      className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleImportConfig}
                    disabled={!importData.trim()}
                    className="btn bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    Importer configuration
                  </button>
                </div>
              </div>

              {/* Informations sur le format */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Format de fichier attendu</h4>
                <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
{`{
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "apis": [
    {
      "ip": "192.168.1.100",
      "name": "Production API"
    },
    {
      "ip": "localhost", 
      "name": "Development API"
    }
  ],
  "settings": {
    "defaultPort": 5000,
    "apiTimeout": 5000,
    "debugMode": true,
    "monitoringInterval": 30000
  }
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {validationErrors.length > 0 ? (
                <span className="text-red-600">
                  ⚠️ {validationErrors.length} erreur(s) de validation
                </span>
              ) : (
                <span className="text-green-600">
                  ✅ Configuration valide
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              {activeTab === 'apis' && (
                <button
                  onClick={handleSaveConfiguration}
                  disabled={validationErrors.length > 0}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Sauvegarder
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiConfigManager