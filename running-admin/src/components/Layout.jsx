// running-admin/src/components/Layout.jsx - Avec intégration des sélecteurs API
import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApiConfig } from '../utils/globalApiConfig'
import ApiSelectorButton from './ApiSelectorButton'
import ApiTargetSelector from './ApiTargetSelector'
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const Layout = () => {
  const { user, logout } = useAuth()
  const { isConfigured, selectedApi } = useApiConfig()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiConfig, setShowApiConfig] = useState(false)
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
        <div className="alert alert-warning p-2">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">API non configurée</span>
          </div>
        </div>
      )
    }

    return (
      <div className="status-indicator status-connected">
        <div className="flex items-center space-x-2">
          <WifiIcon className="h-4 w-4" />
          <div className="text-sm">
            <div className="font-medium">{selectedApi?.name}</div>
            <div className="text-xs opacity-75">{selectedApi?.responseTime}ms</div>
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            
            {/* Logo mobile */}
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">Running Admin</h1>
            </div>
            
            {/* Navigation mobile */}
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link ${
                      isActive(item.href) ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-4 flex-shrink-0 h-6 w-6" />
                    {item.name}
                  </Link>
                ))}
                
                {user?.is_admin && (
                  <div className="pt-4">
                    <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Administration
                    </h3>
                    {adminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`nav-link ${
                          isActive(item.href) ? 'nav-link-active' : 'nav-link-inactive'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="mr-4 flex-shrink-0 h-6 w-6" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Running Admin</h1>
            </div>
            
            {/* Navigation */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link ${
                      isActive(item.href) ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                  >
                    <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
                
                {user?.is_admin && (
                  <div className="pt-4">
                    <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Administration
                    </h3>
                    <div className="mt-2 space-y-1">
                      {adminNavigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`nav-link ${
                            isActive(item.href) ? 'nav-link-active' : 'nav-link-inactive'
                          }`}
                        >
                          <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </nav>
              
              {/* Statut API en bas de sidebar */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200">
                <ApiStatus />
                <button
                  onClick={() => setShowApiConfig(!showApiConfig)}
                  className="mt-2 w-full text-left text-xs text-gray-500 hover:text-gray-700"
                >
                  Configurer API
                </button>
              </div>
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
              {/* Sélecteur API compact */}
              <div className="hidden md:block">
                <ApiSelectorButton 
                  onApiChange={(api) => {
                    console.log('API changée:', api)
                  }}
                  className="w-64"
                />
              </div>
              
              {/* Bouton config API */}
              <button
                onClick={() => setShowApiConfig(!showApiConfig)}
                className="btn-icon text-gray-400 hover:text-gray-600 rounded-md"
                title="Configuration API"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
              
              {/* Profil utilisateur */}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-right">
                  <p className="font-medium text-gray-900">{user?.username}</p>
                  <p className="text-gray-500">{user?.is_admin ? 'Administrateur' : 'Utilisateur'}</p>
                </div>
                <button
                  onClick={logout}
                  className="btn-icon text-gray-400 hover:text-red-600 rounded-md"
                  title="Déconnexion"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration API étendue */}
        {showApiConfig && (
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="max-w-7xl mx-auto">
              <ApiTargetSelector 
                showExpanded={true}
                onApiChange={(api) => {
                  console.log('API configurée:', api)
                  setShowApiConfig(false)
                }}
              />
            </div>
          </div>
        )}

        {/* Avertissement si API non configurée */}
        {!isConfigured && (
          <div className="alert alert-warning px-4 py-3 border-b border-yellow-200">
            <div className="flex items-center max-w-7xl mx-auto">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              <p className="text-sm">
                <strong>Attention :</strong> Aucun serveur API n'est configuré. 
                Certaines fonctionnalités peuvent ne pas fonctionner correctement.
              </p>
              <button
                onClick={() => setShowApiConfig(true)}
                className="ml-4 btn btn-warning btn-sm"
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
    </div>
  )
}

export default Layout