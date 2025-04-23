import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { BellIcon, MenuAlt1Icon } from '@heroicons/react/outline'
import { ChevronDownIcon } from '@heroicons/react/solid'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Header = ({ setSidebarOpen }) => {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Ouvrir le menu</span>
        <MenuAlt1Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">Running App Admin</h1>
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
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
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