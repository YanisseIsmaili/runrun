import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ checking: true, success: false });
  const [dbStatus, setDbStatus] = useState({ checking: true, success: false });
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Vérification de la connexion API et DB au chargement
  useEffect(() => {
    const checkConnections = async () => {
      // Vérifier l'API
      setApiStatus({ checking: true, success: false });
      try {
        const apiResponse = await axios.get(`${import.meta.env.VITE_API_URL}/health`, { timeout: 5000 });
        setApiStatus({ checking: false, success: apiResponse.status === 200 });
      } catch (err) {
        console.error('Erreur de connexion API:', err);
        setApiStatus({ checking: false, success: false });
      }
      
      // Vérifier la connexion à la base de données
      setDbStatus({ checking: true, success: false });
      try {
        const dbResponse = await axios.get(`${import.meta.env.VITE_API_URL}/health/db`, { timeout: 5000 });
        setDbStatus({ checking: false, success: dbResponse.status === 200 });
      } catch (err) {
        console.error('Erreur de connexion DB:', err);
        setDbStatus({ checking: false, success: false });
      }
    };
    
    checkConnections();
  }, []);
  
  // Si l'utilisateur est déjà connecté, rediriger vers le tableau de bord
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // Fonction de connexion modifiée
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await login(email, password, rememberMe);
      
      if (result.success) {
        const userName = result.user?.first_name || 'Utilisateur';
        const sessionType = rememberMe ? 'session étendue (7 jours)' : 'session standard (24h)';
        setSuccess(`Connexion réussie ! Bienvenue, ${userName}. ${sessionType}`);
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Erreur complète lors de la connexion:', err);
      
      if (!err.response) {
        setError('Erreur réseau: impossible de se connecter au serveur');
      } else {
        setError(err.message || 'Une erreur est survenue lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour rendre l'indicateur d'état
  const renderStatusIndicator = (status, type) => {
    const label = type === 'api' ? 'API' : 'Base de données';
    
    return (
      <div className={`flex items-center transition-all duration-300 ease-in-out`}>
        {status.checking ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500 border-r-2 border-blue-500 mr-2"></div>
            <span className="text-blue-500 text-xs">Vérification {label}...</span>
          </div>
        ) : status.success ? (
          <div className="flex items-center">
            <div className="h-4 w-4 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-green-600 text-xs">{label} en ligne</span>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="h-4 w-4 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-red-600 text-xs">{label} hors ligne</span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {renderStatusIndicator(apiStatus, 'api')}
        {renderStatusIndicator(dbStatus, 'db')}
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary-100 p-2 flex items-center justify-center text-primary-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Administration Running App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous pour accéder au tableau de bord
          </p>
        </div>
        
        <div className={`transition-all duration-500 ease-in-out transform ${(!apiStatus.success || !dbStatus.success) ? 'scale-100 opacity-100 max-h-40' : 'scale-95 opacity-0 max-h-0 overflow-hidden'}`}>
          {(!apiStatus.success || !dbStatus.success) && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Problèmes de connexion détectés
                  </p>
                  <ul className="mt-1 text-xs text-yellow-700 list-disc list-inside">
                    {!apiStatus.success && <li>L'API est inaccessible</li>}
                    {!dbStatus.success && <li>La base de données est inaccessible</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Message de succès */}
        {success && (
          <div className="rounded-md bg-green-50 p-4 animate-fade-in">
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
        
        <form className={`mt-8 space-y-6 transition-opacity duration-500 ${(apiStatus.checking || dbStatus.checking) ? 'opacity-50' : 'opacity-100'}`} onSubmit={handleSubmit}>
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                    Email ou nom d'utilisateur
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="text"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                      placeholder="nom@exemple.com"
                      disabled={apiStatus.checking || dbStatus.checking || loading}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                      placeholder="••••••••"
                      disabled={apiStatus.checking || dbStatus.checking || loading}
                    />
                  </div>
                </div>

                {/* Case à cocher "Se souvenir de moi" */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      disabled={apiStatus.checking || dbStatus.checking || loading}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Se souvenir de moi (7 jours)
                    </label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                      Mot de passe oublié ?
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 animate-fade-in">
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
          
          {/* Information sur la sécurité des données */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-blue-700">
                  <strong>Sécurité :</strong> Vos données de connexion sont chiffrées et stockées de manière sécurisée dans votre navigateur.
                  {rememberMe && (
                    <span className="block mt-1">
                      <strong>Mode étendu :</strong> Votre session restera active pendant 7 jours.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={apiStatus.checking || dbStatus.checking || loading || (!apiStatus.success || !dbStatus.success)}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white 
                ${(!apiStatus.checking && !dbStatus.checking && apiStatus.success && dbStatus.success) 
                  ? 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500' 
                  : 'bg-gray-400 cursor-not-allowed'}
                transition-colors duration-300 ease-in-out
              `}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </div>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className={`h-5 w-5 ${(!apiStatus.checking && !dbStatus.checking && apiStatus.success && dbStatus.success) ? 'text-primary-500 group-hover:text-primary-400' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Se connecter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Running App - Administration</p>
        <p className="mt-1">Données sécurisées par chiffrement AES-256</p>
      </div>
    </div>
  );
};

export default Login;