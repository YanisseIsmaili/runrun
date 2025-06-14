// running-admin/src/components/Sidebar.jsx - VERSION CORRIGÉE AVEC FALLBACK
import { Fragment } from 'react'
import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { 
  HomeIcon, 
  UsersIcon, 
  ClockIcon, 
  CogIcon,
  ChartBarIcon,
  MapIcon
} from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ApiSelector from './ApiSelector'

// Composant fallback pour les icônes manquantes
const FallbackIcon = ({ className }) => (
  <div className={`${className} flex items-center justify-center`}>
    <span className="text-xs">?</span>
  </div>
)

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: HomeIcon },
  { name: 'Utilisateurs', href: '/users', icon: UsersIcon },
  { name: 'Historique des courses', href: '/history', icon: ClockIcon },
  { name: 'Statistiques', href: '/stats', icon: ChartBarIcon },
  { name: 'Parcours', href: '/routes', icon: MapIcon }, // Changé MapPinIcon -> MapIcon
  { name: 'Paramètres', href: '/settings', icon: CogIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth()
  
  return (
    <>
      {/* Sidebar mobile (off-canvas) */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-green-700">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Fermer la sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-white text-lg font-semibold">Running Admin</h1>
              </div>
              
              <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? 'bg-green-800 text-white'
                          : 'text-green-100 hover:bg-green-600',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      )
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    {React.createElement(item.icon || FallbackIcon, {
                      className: "mr-3 flex-shrink-0 h-6 w-6 text-green-300",
                      'aria-hidden': "true"
                    })}
                    {item.name}
                  </NavLink>
                ))}
              </nav>
              
              {/* Sélecteur d'API en bas */}
              <ApiSelector />
            </div>
          </Transition.Child>
        </Dialog>
      </Transition.Root>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-green-700 overflow-y-auto scrollbar-thin">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-white text-lg font-semibold">Running Admin</h1>
          </div>
          
          {/* Informations utilisateur */}
          {user && (
            <div className="flex-shrink-0 px-4 py-4 border-t border-green-800 mt-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.first_name?.[0] || user.username?.[0] || '?'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user.first_name || user.username}
                  </p>
                  <div className="flex items-center space-x-1">
                    <p className="text-xs text-green-200">
                      {user.is_admin ? 'Administrateur' : 'Utilisateur'}
                    </p>
                    {user.is_admin && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <nav className="mt-5 flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? 'bg-green-800 text-white'
                      : 'text-green-100 hover:bg-green-600',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )
                }
              >
                {React.createElement(item.icon || FallbackIcon, {
                  className: "mr-3 flex-shrink-0 h-6 w-6 text-green-300",
                  'aria-hidden': "true"
                })}
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          {/* Sélecteur d'API en bas - Desktop */}
          <ApiSelector />
        </div>
      </div>
    </>
  )
}

export default Sidebar