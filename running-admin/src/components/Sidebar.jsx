import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { 
  HomeIcon, 
  UsersIcon, 
  ClockIcon, 
  CogIcon,
  ChartBarIcon,
  MapPinIcon
} from '@heroicons/react/24/solid'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: HomeIcon },
  { name: 'Utilisateurs', href: '/users', icon: UsersIcon },
  { name: 'Historique des courses', href: '/history', icon: ClockIcon },
  { name: 'Statistiques', href: '/stats', icon: ChartBarIcon },
  { name: 'Itinéraires', href: '/routes', icon: MapPinIcon },
  { name: 'Paramètres', href: '/settings', icon: CogIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { currentUser } = useAuth()
  const location = useLocation()
  
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
            <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-primary-700">
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
                    <span className="sr-only">Fermer le menu</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="text-white text-xl font-bold">Running Admin</span>
              </div>
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => classNames(
                        isActive
                          ? 'bg-primary-800 text-white'
                          : 'text-white hover:bg-primary-600',
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                      )}
                    >
                      <item.icon className="mr-4 h-6 w-6 text-primary-200" aria-hidden="true" />
                      {item.name}
                    </NavLink>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-primary-800 p-4">
                <div className="flex-shrink-0 group block">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                      {currentUser?.first_name?.charAt(0) || 'A'}
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-white">
                        {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : 'Admin'}
                      </p>
                      <p className="text-sm font-medium text-primary-200 group-hover:text-primary-100">
                        {currentUser?.email || 'admin@runningapp.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar pour desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-primary-700">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-5">
              <span className="text-white text-xl font-bold">Running Admin</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => classNames(
                    isActive
                      ? 'bg-primary-800 text-white'
                      : 'text-white hover:bg-primary-600',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 text-primary-200" aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-primary-800 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {currentUser?.first_name?.charAt(0) || 'A'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : 'Admin'}
                  </p>
                  <p className="text-xs font-medium text-primary-200 group-hover:text-primary-100">
                    {currentUser?.email || 'admin@runningapp.com'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar