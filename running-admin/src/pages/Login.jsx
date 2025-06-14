// running-admin/src/pages/Login.jsx - AVEC SÉLECTEUR API
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
  NoSymbolIcon
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

  // Tester la connexion API quand l'API change
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
      setError('Veuillez d\'abord sélectionner un serveur API')
      return
    }

    if (apiConnectionStatus !== 'connected') {
      setError('Le serveur API sélectionné n\'est pas accessible')
      return
    }

    setError('')
    setLoading(true)

    try {
      await login(formData.emailOrUsername, formData.password, formData.rememberMe)
      navigate('/')
    } catch (error) {
      console.error('Erreur de connexion:', error)
      setError(error.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Composant de statut de connexion API
  const ApiConnectionStatus = () => {
    if (!isConfigured) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <NoSymbolIcon className="h-4 w-4" />
          <span className="text-sm">Aucune API sélectionnée</span>
        </div>
      )
    }

    switch (apiConnectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2 text-blue-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Vérification de la connexion...</span>
          </div>
        )
      
      case 'connected':
        return (
          <div className="flex items-center space-x-2 text-green-500">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="text-sm">
              Connecté à {selectedApi?.name} ({selectedApi?.responseTime}ms)
            </span>
          </div>
        )
      
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-500">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">Impossible de joindre le serveur</span>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Running Admin
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connectez-vous à votre compte
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">
          
          {/* Sélecteur de serveur API */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serveur API
            </label>
            <ApiSelectorButton 
              onApiChange={(api) => {
                console.log('API sélectionnée pour login:', api)
                setError('')
              }}
              className="w-full"
            />
            <div className="mt-2">
              <ApiConnectionStatus />
            </div>
          </div>

          {/* Avertissement si pas d'API */}
          {!isConfigured && (
            <div className="alert alert-warning">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    Serveur API requis
                  </h3>
                  <p className="mt-1 text-sm">
                    Veuillez sélectionner un serveur API avant de vous connecter.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire de connexion */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">
                      Erreur de connexion
                    </h3>
                    <p className="mt-1 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="emailOrUsername" className="form-label">
                Email ou nom d'utilisateur
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                autoComplete="username"
                required
                value={formData.emailOrUsername}
                onChange={handleChange}
                className="form-input"
                placeholder="votre@email.com ou username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe
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
                  className="form-input pr-10"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center btn-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !isConfigured || apiConnectionStatus !== 'connected'}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Connexion...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>

          {/* Informations de debug en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <p><strong>Debug :</strong></p>
              <p>API configurée : {isConfigured ? 'Oui' : 'Non'}</p>
              {selectedApi && (
                <>
                  <p>Serveur : {selectedApi.name} ({selectedApi.url})</p>
                  <p>Statut : {apiConnectionStatus}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login