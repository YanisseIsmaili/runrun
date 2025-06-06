import React from 'react'
import { 
  XMarkIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline'

// Icônes SVG personnalisées pour compatibilité
const ErrorIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const NetworkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
)

const ApiErrorIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ErrorMessage = ({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '',
  showRetry = true,
  showDismiss = true,
  variant = 'default'
}) => {
  if (!error) return null

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return NetworkIcon
      case 'api':
        return ApiErrorIcon
      default:
        return ErrorIcon
    }
  }

  const IconComponent = getErrorIcon()

  if (variant === 'toast') {
    return (
      <div className={`fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50 ${className}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <IconComponent className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">Erreur</p>
              <p className="mt-1 text-sm text-gray-500">{error.message}</p>
              {showRetry && onRetry && (
                <div className="mt-2">
                  <button
                    onClick={onRetry}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Réessayer
                  </button>
                </div>
              )}
            </div>
            {showDismiss && onDismiss && (
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={onDismiss}
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`rounded-md bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <IconComponent className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-800">{error.message}</p>
            {(showRetry && onRetry) || (showDismiss && onDismiss) ? (
              <div className="mt-2 flex gap-2">
                {showRetry && onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-sm font-medium text-red-600 hover:text-red-500 flex items-center"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Réessayer
                  </button>
                )}
                {showDismiss && onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Ignorer
                  </button>
                )}
              </div>
            ) : null}
          </div>
          {showDismiss && onDismiss && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={onDismiss}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variant par défaut - pleine page
  return (
    <div className={`min-h-64 flex flex-col justify-center items-center p-6 ${className}`}>
      <div className="text-center">
        <IconComponent className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {error.type === 'network' ? 'Problème de connexion' : 'Erreur'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md">
          {error.message}
        </p>
        
        {/* Informations supplémentaires en mode développement */}
        {process.env.NODE_ENV === 'development' && error.originalError && (
          <details className="mt-4 text-left bg-gray-100 p-4 rounded-md">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              Détails techniques
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto">
              {JSON.stringify(error.originalError, null, 2)}
            </pre>
          </details>
        )}
        
        {(showRetry && onRetry) || (showDismiss && onDismiss) ? (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Réessayer
              </button>
            )}
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Ignorer
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ErrorMessage