// running-admin/src/components/Layout.jsx - Avec bouton Configurer API permanent
import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApiConfig } from '../utils/globalApiConfig'
import ApiSelectorButton from './ApiSelectorButton'
import ApiConfigManager from './ApiConfigManager'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  MapIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

const Layout = () => {
  const { user, logout } = useAuth()
  const { isConfigured, selectedApi } = useApiConfig()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiConfigManager, setShowApiConfigManager] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Utilisateurs', href: '/users', icon: UsersIcon },
    { name: 'Historique', href: '/history', icon: ClockIcon },
    { name: 'Statistiques', href: '/stats', icon: ChartBarIcon },
  ]

  const adminNavigation = [
    { name: 'Parcours', href: '/routes', icon: MapIcon },
    { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon },
  ]

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  // Composant de statut API
  const ApiStatus = () => {
    if (!isConfigured) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">API non configurée</span>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <WifiIcon className="h-4 w-4 text-green-600" />
          <div className="text-sm">
            <div className="font-medium text-green-800">{selectedApi?.name}</div>
            <div className="text-xs text-green-600">{selectedApi?.responseTime}ms</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">Running Admin</h1>
            </div>
            
            <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
              {/* Navigation principale */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-green-100 text-green-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              
              {/* Navigation admin */}
              {user?.is_admin && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive(item.href)
                          ? 'bg-green-100 text-green-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </nav>
            
            {/* Zone API en bas - Mobile */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 space-y-3">
              <ApiStatus />
              <button
                onClick={() => {
                  setShowApiConfigManager(true)
                  setSidebarOpen(false)
                }}
                className="w-full btn bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ServerIcon className="h-4 w-4 mr-2" />
                Configurer API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white shadow">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">Running Admin</h1>
              </div>
              
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {/* Navigation principale */}
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href)
                        ? 'bg-green-100 text-green-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
                
                {/* Navigation admin */}
                {user?.is_admin && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    {adminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive(item.href)
                            ? 'bg-green-100 text-green-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </nav>
            </div>
            
            {/* Zone API en bas - Desktop */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 space-y-3">
              <ApiStatus />
              <button
                onClick={() => setShowApiConfigManager(true)}
                className="w-full btn bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ServerIcon className="h-4 w-4 mr-2" />
                Configurer API
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          {/* Bouton menu mobile */}
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            {/* Titre de la page */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {location.pathname === '/' ? 'Dashboard' : 
                 location.pathname === '/users' ? 'Utilisateurs' :
                 location.pathname === '/history' ? 'Historique' :
                 location.pathname === '/stats' ? 'Statistiques' :
                 location.pathname === '/routes' ? 'Parcours' :
                 location.pathname === '/settings' ? 'Paramètres' : 'Page'}
              </h2>
            </div>
            
            {/* Actions header */}
            <div className="ml-4 flex items-center space-x-4">
              {/* Sélecteur API compact pour desktop */}
              <div className="hidden lg:block">
                <ApiSelectorButton 
                  onApiChange={(api) => {
                    console.log('API changée:', api)
                  }}
                  className="w-64"
                />
              </div>
              
              {/* Profil utilisateur */}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-right">
                  <p className="font-medium text-gray-900">{user?.username}</p>
                  <p className="text-gray-500">{user?.is_admin ? 'Administrateur' : 'Utilisateur'}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                  title="Déconnexion"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Avertissement si API non configurée */}
        {!isConfigured && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-700">
                  <strong>Attention :</strong> Aucun serveur API n'est configuré. 
                  Certaines fonctionnalités peuvent ne pas fonctionner correctement.
                </p>
              </div>
              <button
                onClick={() => setShowApiConfigManager(true)}
                className="btn bg-yellow-600 hover:bg-yellow-700 text-white btn-sm"
              >
                Configurer maintenant
              </button>
            </div>
          </div>
        )}

        {/* Contenu des pages */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Gestionnaire de configuration API */}
      <ApiConfigManager 
        isOpen={showApiConfigManager} 
        onClose={() => setShowApiConfigManager(false)} 
      />
    </div>
  )
}

export default Layout