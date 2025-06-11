import { useState } from 'react'
import { 
  ShieldCheckIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  LockClosedIcon,
  ClockIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import cryptoService from '../services/cryptoService'

const SecurityInfo = ({ show = false, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview')

  if (!show) return null

  const getStorageInfo = () => {
    try {
      const sessionPrefs = cryptoService.getSecureItem('running_app_session_prefs')
      const tokenData = cryptoService.getSecureItem('running_app_token')
      const userData = cryptoService.getSecureItem('running_app_user')

      return {
        hasSession: !!(sessionPrefs && tokenData && userData),
        sessionType: sessionPrefs?.rememberMe ? 'Étendue (7 jours)' : 'Standard (24 heures)',
        lastLogin: sessionPrefs?.lastLogin ? new Date(sessionPrefs.lastLogin).toLocaleString('fr-FR') : 'Inconnue',
        encrypted: true,
        storageSize: localStorage.length
      }
    } catch (error) {
      return {
        hasSession: false,
        encrypted: false,
        error: 'Erreur lors de la lecture des données'
      }
    }
  }

  const storageInfo = getStorageInfo()

  const clearAllData = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toutes les données stockées ? Vous serez déconnecté.')) {
      cryptoService.clearAllSecureData()
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Sécurité des données</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Onglets */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab('technical')}
                className={`${
                  activeTab === 'technical'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Détails techniques
              </button>
            </nav>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="text-sm font-medium text-green-800">Chiffrement AES-256</h4>
                </div>
                <p className="mt-2 text-sm text-green-700">
                  Vos données de connexion sont chiffrées avec l'algorithme AES-256 avant d'être stockées dans votre navigateur.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <h4 className="text-sm font-medium text-blue-800">Expiration automatique</h4>
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  Les données expirent automatiquement après la durée configurée et sont supprimées du stockage.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <div className="flex items-center">
                  <ComputerDesktopIcon className="h-5 w-5 text-purple-500 mr-2" />
                  <h4 className="text-sm font-medium text-purple-800">Stockage local sécurisé</h4>
                </div>
                <p className="mt-2 text-sm text-purple-700">
                  Les données restent uniquement sur votre appareil et ne sont jamais transmises à des tiers.
                </p>
              </div>

              {storageInfo.hasSession && (
                <div className="border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Session actuelle</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Type :</dt>
                      <dd className="text-gray-900">{storageInfo.sessionType}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Dernière connexion :</dt>
                      <dd className="text-gray-900">{storageInfo.lastLogin}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">État de chiffrement :</dt>
                      <dd className="text-green-600 flex items-center">
                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        Sécurisé
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">Algorithme de chiffrement</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <code className="text-sm text-gray-700">
                    AES-256 en mode CBC avec clé dérivée de SHA-256
                  </code>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">Génération de la clé</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-sm text-gray-700">
                    La clé de chiffrement est générée de manière unique pour chaque page en combinant :
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                    <li>Le nom de domaine de l'application</li>
                    <li>L'empreinte du navigateur (partielle)</li>
                    <li>Une chaîne secrète de l'application</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">Données stockées</h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Token d'authentification</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Chiffré</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Données utilisateur</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Chiffré</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Préférences de session</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Chiffré</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">Informations de stockage</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <dl className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Éléments dans localStorage :</dt>
                      <dd className="text-gray-900">{storageInfo.storageSize}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Nettoyage automatique :</dt>
                      <dd className="text-gray-900">Toutes les 10 minutes</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Expiration des données :</dt>
                      <dd className="text-gray-900">Selon le type de session</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-center">
                  <InformationCircleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">Note importante</span>
                </div>
                <p className="mt-1 text-sm text-yellow-700">
                  Les données chiffrées ne peuvent être déchiffrées que sur cette page et ce navigateur. 
                  Si vous changez de domaine ou de navigateur, vous devrez vous reconnecter.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={clearAllData}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Effacer toutes les données
            </button>
            
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityInfo