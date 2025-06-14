// running-admin/src/pages/Login.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ApiSelectorButton from '../components/ApiSelectorButton'

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedApi, setSelectedApi] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState({
    api: 'checking'
  })

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Test de connexion à l'API sélectionnée
    const testApiConnection = async () => {
      if (!selectedApi) {
        setConnectionStatus({ api: 'error' })
        return
      }

      try {
        const response = await fetch(`${selectedApi.url}/api/health`, {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(5000)
        })

        if (response.ok) {
          setConnectionStatus({ api: 'connected' })
        } else {
          setConnectionStatus({ api: 'error' })
        }
      } catch (error) {
        setConnectionStatus({ api: 'error' })
      }
    }

    if (selectedApi) {
      testApiConnection()
    }
  }, [selectedApi])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!selectedApi) {
      setError('Veuillez sélectionner un serveur API')
      setLoading(false)
      return
    }

    if (connectionStatus.api !== 'connected') {
      setError('Le serveur API sélectionné n\'est pas accessible')
      setLoading(false)
      return
    }

    try {
      // Configurer l'API base URL avant la connexion
      if (window.api) {
        window.api.defaults.baseURL = selectedApi.url
      }

      await login(formData.emailOrUsername, formData.password, formData.rememberMe)
      navigate('/')
    } catch (error) {
      console.error('Erreur de connexion:', error)
      setError(error.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleApiChange = (api) => {
    setSelectedApi(api)
    // Configurer l'API base URL immédiatement
    if (window.api && api) {
      window.api.defaults.baseURL = api.url
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-500">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Administration Running App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous à votre compte administrateur
          </p>
        </div>

        {/* API Selector Button */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Serveur API
          </label>
          <ApiSelectorButton onApiChange={handleApiChange} />
        </div>

        {/* Statut des connexions */}
        <div className="rounded-md bg-blue-50 p-4">
          <div className="text-sm">
            <div className="flex justify-between items-center">
              <span>État de l'API:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                connectionStatus.api === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus.api === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {connectionStatus.api === 'connected' ? 'Connecté' :
                 connectionStatus.api === 'error' ? 'Erreur' : 'Vérification...'}
              </span>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">
                Email ou nom d'utilisateur
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                required
                value={formData.emailOrUsername}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Email ou nom d'utilisateur"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Mot de passe"
              />
            </div>

            {/* Checkbox "Se souvenir de moi" */}
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
                Se souvenir de moi (7 jours)
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || connectionStatus.api !== 'connected'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Problème de connexion ? Vérifiez que l'API fonctionne sur le serveur sélectionné
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login