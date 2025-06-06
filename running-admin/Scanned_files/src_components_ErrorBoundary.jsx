import React from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

// Icône SVG personnalisée
const ErrorIcon = () => (
  <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <ErrorIcon />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Oups ! Une erreur s'est produite
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  L'application a rencontré un problème inattendu.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-md">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      Détails de l'erreur :
                    </h3>
                    <pre className="text-xs text-red-700 overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Réessayer
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Recharger la page
                  </button>
                </div>
                
                <div className="mt-4">
                  <a
                    href="/login"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Retourner à la page de connexion
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary