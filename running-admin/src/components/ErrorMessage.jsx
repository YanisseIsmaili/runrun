import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

const ErrorMessage = ({ message, onRetry, onDismiss, variant = 'error' }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-yellow-400'
      case 'info':
        return 'text-blue-400'
      case 'success':
        return 'text-green-400'
      default:
        return 'text-red-400'
    }
  }

  return (
    <div className={`rounded-md border p-4 ${getVariantClasses()}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className={`h-5 w-5 ${getIconColor()}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="flex space-x-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex rounded-md bg-white text-sm font-medium hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 px-2 py-1"
              >
                Réessayer
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex rounded-md text-sm"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage