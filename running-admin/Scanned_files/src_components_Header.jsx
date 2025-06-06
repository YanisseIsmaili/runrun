import { Fragment, useState, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { BellIcon, Bars3Icon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import cryptoService from '../services/cryptoService'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Header = ({ setSidebarOpen }) => {
  const navigate = useNavigate()
  const { currentUser, logout, extendSession, rememberMe } = useAuth()
  const [sessionInfo, setSessionInfo] = useState(null)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState('')
  
  useEffect(() => {
    // Charger les informations de session
    const loadSessionInfo = () => {
      const sessionPrefs = cryptoService.getSecureItem('running_app_session_prefs')
      const tokenData = cryptoService.getSecureItem('running_app_token')
      
      if (sessionPrefs && tokenData) {
        setSessionInfo({
          lastLogin: sessionPrefs.lastLogin,
          rememberMe: sessionPrefs.rememberMe,
          isSecure: true
        })
      }
    }

    loadSessionInfo()
  }, [])

  // Calculer le temps restant avant expiration
  useEffect(() => {
    const updateTimeUntilExpiry = () => {
      const sessionPrefs = cryptoService.getSecureItem('running_app_session_prefs')
      if (sessionPrefs && sessionPrefs.lastLogin) {
        const loginTime = new Date(sessionPrefs.lastLogin)
        const expirationTime = new Date(loginTime.getTime() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
        const now = new Date()
        const timeLeft = expirationTime - now

        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60))
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
          
          if (hours > 24) {
            const days = Math.floor(hours / 24)
            setTimeUntilExpiry(`${days}j ${hours % 24}h`)
          } else if (hours > 0) {
            setTimeUntilExpiry(`${hours}h ${minutes}m`)
          } else {
            setTimeUntilExpiry(`${minutes}m`)
          }
        } else {
          setTimeUntilExpiry('Expiré')
        }
      }
    }

    updateTimeUntilExpiry()
    const interval = setInterval(updateTimeUntilExpiry, 60000) // Mettre à jour chaque minute

    return () => clearInterval(interval)
  }, [rememberMe])
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleExtendSession = () => {
    const extended = extendSession()
    if (extended) {
      // Mettre à jour les informations de session
      const sessionPrefs = cryptoService.getSecureItem('running_app_session_prefs')
      if (sessionPrefs) {
        setSessionInfo({
          ...sessionInfo,
          lastLogin: new Date().toISOString()
        })
      }
    }
  }

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Inconnue'
    
    const loginDate = new Date(lastLogin)
    const now = new Date()
    const diffHours = Math.floor((now - loginDate) / (1000 * 60 * 60))
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((now - loginDate) / (1000 * 60))
      return `Il y a ${diffMinutes} min`
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    }
  }
  
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Ouvrir le menu</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">Running App Admin</h1>
          
          {/* Indicateur de sécurité de session */}
          {sessionInfo && (
            <div className="ml-4 flex items-center">
              <div className="flex items-center bg-green-50 px-2 py-1 rounded-full">
                <ShieldCheckIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-xs text-green-700 font-medium">Session sécurisée</span>
              </div>
              
              {timeUntilExpiry && (
                <div className="ml-2 flex items-center bg-blue-50 px-2 py-1 rounded-full">
                  <ClockIcon className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-xs text-blue-700 font-medium">Expire dans {timeUntilExpiry}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications */}
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="sr-only">Voir les notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="ml-3 relative">
            <div>
              <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Ouvrir le menu utilisateur</span>
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {currentUser?.first_name?.charAt(0) || 'A'}
                </div>
                <span className="hidden md:flex md:items-center">
                  <span className="ml-2 text-gray-700 text-sm font-medium truncate">
                    {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : 'Admin'}
                  </span>
                  <ChevronDownIcon className="ml-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                
                {/* Informations de session */}
                {sessionInfo && (
                  <>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        Informations de session
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Dernière connexion:</span>
                          <span className="text-xs text-gray-900 font-medium">
                            {formatLastLogin(sessionInfo.lastLogin)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Type de session:</span>
                          <span className="text-xs text-gray-900 font-medium">
                            {sessionInfo.rememberMe ? 'Étendue (7j)' : 'Standard (24h)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Sécurité:</span>
                          <div className="flex items-center">
                            <ShieldCheckIcon className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-xs text-green-600 font-medium">Chiffrée</span>
                          </div>
                        </div>
                        {timeUntilExpiry && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Expiration:</span>
                            <span className="text-xs text-gray-900 font-medium">{timeUntilExpiry}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/settings')}
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        'block w-full text-left px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      Paramètres
                    </button>
                  )}
                </Menu.Item>

                {/* Option pour prolonger la session */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleExtendSession}
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        'block w-full text-left px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
                        Prolonger la session
                      </div>
                    </button>
                  )}
                </Menu.Item>

                <div className="border-t border-gray-200"></div>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        'block w-full text-left px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      Déconnexion
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}

export default Header