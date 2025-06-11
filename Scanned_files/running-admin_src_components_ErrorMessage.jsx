// running-admin/src/components/ErrorMessage.jsx
import { ExclamationTriangleIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const ErrorMessage = ({ 
  message, 
  onRetry, 
  onDismiss, 
  variant = 'error',
  className = '' 
}) => {
  const variants = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-400',
      text: 'text-red-800',
      button: 'text-red-600 hover:text-red-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-400',
      text: 'text-yellow-800',
      button: 'text-yellow-600 hover:text-yellow-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-400',
      text: 'text-blue-800',
      button: 'text-blue-600 hover:text-blue-500'
    }
  }

  const styles = variants[variant] || variants.error

  return (
    <div className={`rounded-md ${styles.bg} ${styles.border} border p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${styles.text}`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="flex space-x-2">
            {onRetry && (
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                onClick={onRetry}
                title="Réessayer"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                onClick={onDismiss}
                title="Fermer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage