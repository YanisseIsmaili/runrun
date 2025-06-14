// running-admin/src/pages/Login.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApiConfig } from '../utils/globalApiConfig'
import ApiSelectorButton from '../components/ApiSelectorButton'
import { 
  EyeIcon, 
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WifiIcon,
  NoSymbolIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [apiConnectionStatus, setApiConnectionStatus] = useState('checking')

  const { login } = useAuth()
  const { isConfigured, selectedApi } = useApiConfig()
  const navigate = useNavigate()

  // Test de connexion API
  useEffect(() => {
    const testApiConnection = async () => {
      if (!isConfigured) {
        setApiConnectionStatus('not_configured')
        return
      }

      setApiConnectionStatus('checking')
      
      try {
        const response = await fetch(`${selectedApi.url}/api/health`, {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(5000)
        })

        if (response.ok) {
          setApiConnectionStatus('connected')
        } else {
          setApiConnectionStatus('error')
        }
      } catch (error) {
        setApiConnectionStatus('error')
      }
    }

    if (selectedApi) {
      testApiConnection()
    }
  }, [isConfigured, selectedApi])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isConfigured) {
      setError('Veuillez sélectionner un serveur API')
      return
    }

    if (apiConnectionStatus !== 'connected') {
      setError('Le serveur API n\'est pas accessible')
      return
    }

    setError('')
    setLoading(true)

    try {
      await login(formData.emailOrUsername, formData.password, formData.rememberMe)
      navigate('/')
    } catch (error) {
      console.error('Erreur de connexion:', error)
      const errorMessage = error.response && error.response.data && error.response.data.message 
        ? error.response.data.message 
        : 'Erreur de connexion'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Composant de statut API
  const ApiConnectionStatus = () => {
    if (!isConfigured) {
      return (
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <NoSymbolIcon className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">Aucune API sélectionnée</span>
          </div>
        </div>
      )
    }

    switch (apiConnectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg animate-fade-in">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-100"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
            </div>
            <span className="text-sm text-blue-700">Vérification connexion...</span>
          </div>
        )
      
      case 'connected':
        return (
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Connecté à {selectedApi && selectedApi.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-mono bg-green-100 px-2 py-1 rounded-full">
                  {selectedApi && selectedApi.responseTime}ms
                </span>
              </div>
            </div>
          </div>
        )
      
      case 'error':
        return (
          <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg animate-fade-in">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Impossible de joindre le serveur</span>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-green-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400/20 rounded-full animate-pulse shadow-2xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-600/20 rounded-full animate-pulse shadow-2xl animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-300/10 rounded-full animate-pulse shadow-2xl animation-delay-2000"></div>
        
        {/* Particules flottantes */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400/40 rounded-full animate-bounce animation-delay-500"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-emerald-500/30 rounded-full animate-bounce animation-delay-1500"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-green-600/50 rounded-full animate-bounce animation-delay-2500"></div>
      </div>

      {/* Header avec logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center animate-slide-in-left">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/20 p-3 hover:scale-105 transition-transform duration-300">
            {/* Logo - Option 1: Import depuis assets */}
            {/*
            <img 
              src={logo} 
              alt="Running Admin Logo" 
              className="w-full h-full object-contain filter brightness-0 invert"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            */}
            
            {/* Logo - Option 2: Depuis public/ */}
            <img 
              src="/logo-running-admin.png" 
              alt="Running Admin Logo" 
              className="w-full h-full object-contain filter brightness-0 invert"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            
            {/* Fallback "R" */}
            <span className="text-white text-3xl font-bold hidden">R</span>
          </div>
          
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-700 to-green-800 bg-clip-text text-transparent mb-2 animate-fade-in">
            Running Admin
          </h1>
          <p className="text-green-600 font-medium text-lg flex items-center justify-center space-x-2 animate-fade-in">
            <span>⚡</span>
            <span>Tableau de bord intelligent</span>
            <span>🏃‍♂️</span>
          </p>
        </div>
      </div>

      {/* Formulaire principal */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-2xl border border-green-200/50 animate-slide-in-right">
          <div className="space-y-6">
            
            {/* Sélecteur API */}
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-green-700 mb-3 flex items-center space-x-2">
                <ServerIcon className="h-5 w-5 text-green-600" />
                <span>Serveur API</span>
              </label>
              <ApiSelectorButton 
                onApiChange={(api) => {
                  console.log('API sélectionnée:', api)
                  setError('')
                }}
                className="w-full"
              />
              <div className="mt-3">
                <ApiConnectionStatus />
              </div>
            </div>

            {/* Avertissement */}
            {!isConfigured && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border border-yellow-300 rounded-xl animate-fade-in">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                      Configuration requise
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Veuillez sélectionner un serveur API pour continuer.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Formulaire */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Erreur */}
              {error && (
                <div className="p-4 bg-gradient-to-r from-red-50 via-pink-50 to-red-50 border border-red-300 rounded-xl animate-fade-in">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-800 mb-1">
                        Erreur de connexion
                      </h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email/Username */}
              <div className="animate-slide-in-right">
                <label htmlFor="emailOrUsername" className="block text-sm font-semibold text-green-700 mb-2 flex items-center space-x-2">
                  <span>👤</span>
                  <span>Email ou nom d'utilisateur</span>
                </label>
                <input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/80 hover:border-green-300"
                  placeholder="votre@email.com ou username"
                />
              </div>

              {/* Mot de passe */}
              <div className="animate-slide-in-right">
                <label htmlFor="password" className="block text-sm font-semibold text-green-700 mb-2 flex items-center space-x-2">
                  <span>🔒</span>
                  <span>Mot de passe</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/80 hover:border-green-300"
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-green-50 rounded-r-xl transition-colors duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-green-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-center animate-slide-in-right">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-green-300 rounded transition-all duration-300"
                />
                <label htmlFor="rememberMe" className="ml-3 block text-sm text-green-700 font-medium flex items-center space-x-2">
                  <span>💾</span>
                  <span>Se souvenir de moi</span>
                </label>
              </div>

              {/* Bouton connexion */}
              <div className="animate-slide-in-right">
                <button
                  type="submit"
                  disabled={loading || !isConfigured || apiConnectionStatus !== 'connected'}
                  className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 group"
                >
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Connexion en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span>🚀</span>
                      <span>Se connecter</span>
                      <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Debug */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl text-xs text-gray-600 border border-gray-200 animate-fade-in">
                <div className="flex items-center space-x-2 mb-2">
                  <span>🛠️</span>
                  <strong>Mode Développement</strong>
                </div>
                <div className="space-y-1">
                  <p>API configurée : {isConfigured ? '✅ Oui' : '❌ Non'}</p>
                  {selectedApi && (
                    <>
                      <p>Serveur : {selectedApi.name} ({selectedApi.url})</p>
                      <p>Statut : {
                        apiConnectionStatus === 'connected' ? '🟢 Connecté' : 
                        apiConnectionStatus === 'checking' ? '🟡 Vérification' : 
                        '🔴 Erreur'
                      }</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login   