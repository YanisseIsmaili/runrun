import { Fragment, useState, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  BellIcon, 
  Bars3Icon, 
  ShieldCheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Header = ({ setSidebarOpen }) => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [sessionInfo, setSessionInfo] = useState(null)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState('')
  const [notifications, setNotifications] = useState([])
  
  useEffect(() => {
    // Charger les informations de session
    const loadSessionInfo = () => {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setSessionInfo({
            lastLogin: parsedUser.last_login || new Date().toISOString(),
            isSecure: true,
            tokenPresent: true
          })
        } catch (error) {
          console.error('Erreur parsing user data:', error)
        }
      }
    }

    loadSessionInfo()
  }, [user])

  // Calculer le temps restant avant expiration (24h par défaut)
  useEffect(() => {
    const updateTimeUntilExpiry = () => {
      const token = localStorage.getItem('auth_token')
      if (token && sessionInfo?.lastLogin) {
        const loginTime = new Date(sessionInfo.lastLogin)
        const expirationTime = new Date(loginTime.getTime() + (24 * 60 * 60 * 1000)) // 24h
        const now = new Date()
        const timeLeft = expirationTime - now
        
        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60))
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
          setTimeUntilExpiry(`${hours}h ${minutes}m`)
        } else {
          setTimeUntilExpiry('Expiré')
        }
      }
    }

    if (sessionInfo) {
      updateTimeUntilExpiry()
      const interval = setInterval(updateTimeUntilExpiry, 60000) // Mise à jour chaque minute
      return () => clearInterval(interval)
    }
  }, [sessionInfo])

  // Vérifier les notifications (permissions, erreurs, etc.)
  useEffect(() => {
    const checkNotifications = () => {
      const newNotifications = []
      
      // Notification si pas admin
      if (user && !user.is_admin) {
        newNotifications.push({
          id: 'not_admin',
          type: 'warning',
          message: 'Compte non-administrateur',
          action: () => {
            if (window.confirm('Voulez-vous essayer de vous promouvoir administrateur?')) {
              window.promoteToAdmin && window.promoteToAdmin()
            }
          }
        })
      }
      
      // Notification si session bientôt expirée
      if (timeUntilExpiry && timeUntilExpiry !== 'Expiré') {
        const [hours] = timeUntilExpiry.split('h')
        if (parseInt(hours) < 1) {
          newNotifications.push({
            id: 'session_expiring',
            type: 'warning',
            message: 'Session expire bientôt',
            action: () => navigate('/login')
          })
        }
      }
      
      setNotifications(newNotifications)
    }
    
    if (user) {
      checkNotifications()
    }
  }, [user, timeUntilExpiry, navigate])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Forcer la déconnexion même en cas d'erreur
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      navigate('/login')
    }
  }

  const getStatusIcon = () => {
    if (!user) return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    
    if (user.is_admin) {
      return <ShieldCheckIcon className="h-5 w-5 text-green-500" />
    } else {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    if (!user) return 'Déconnecté'
    return user.is_admin ? 'Administrateur' : 'Utilisateur'
  }

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:border-none">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Ouvrir la sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      
      {/* Flex container pour le contenu */}
      <div className="flex-1 px-4 flex justify-between sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
        <div className="flex-1 flex items-center">
          {/* Titre de la page */}
          <h1 className="text-lg font-medium text-gray-900">
            Administration Running App
          </h1>
        </div>
        
        <div className="ml-4 flex items-center space-x-4">
          {/* Statut de session */}
          {sessionInfo && (
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>Session: {timeUntilExpiry}</span>
            </div>
          )}
          
          {/* Notifications */}
          {notifications.length > 0 && (
            <Menu as="div" className="relative">
              <Menu.Button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Voir les notifications</span>
                <div className="relative">
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {notifications.length > 0 && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b">
                    Notifications ({notifications.length})
                  </div>
                  {notifications.map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block px-4 py-3 text-sm text-gray-700 cursor-pointer'
                          )}
                          onClick={notification.action}
                        >
                          <div className="flex items-start space-x-2">
                            {notification.type === 'warning' ? (
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                            )}
                            <span>{notification.message}</span>
                          </div>
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 lg:p-2 lg:rounded-md lg:hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.first_name?.[0] || user?.username?.[0] || '?'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Informations utilisateur */}
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <span>{user?.first_name || user?.username || 'Utilisateur'}</span>
                      {getStatusIcon()}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center space-x-1">
                      <span>{getStatusText()}</span>
                      {user?.is_admin && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Admin
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <ChevronDownIcon className="hidden lg:block flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
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
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                {/* Informations utilisateur */}
                <div className="px-4 py-2 text-sm text-gray-500 border-b">
                  <div className="font-medium text-gray-900">{user?.username}</div>
                  <div className="text-xs">{user?.email}</div>
                  <div className="text-xs flex items-center space-x-1 mt-1">
                    {getStatusIcon()}
                    <span>{getStatusText()}</span>
                  </div>
                </div>
                
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
                
                {/* Actions de debug (dev seulement) */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => window.testAuth && window.testAuth()}
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block w-full text-left px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          🔧 Tester Auth
                        </button>
                      )}
                    </Menu.Item>
                    
                    {!user?.is_admin && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => window.promoteToAdmin && window.promoteToAdmin()}
                            className={classNames(
                              active ? 'bg-gray-100' : '',
                              'block w-full text-left px-4 py-2 text-sm text-yellow-700'
                            )}
                          >
                            ⚡ Promouvoir Admin
                          </button>
                        )}
                      </Menu.Item>
                    )}
                  </>
                )}
                
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