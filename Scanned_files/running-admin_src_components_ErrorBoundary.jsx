// running-admin/src/components/ErrorBoundary.jsx
import { Component } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
            </div>
            
            <h1 className="mt-6 text-3xl font-bold text-gray-900">
              Oups ! Une erreur est survenue
            </h1>
            
            <p className="mt-4 text-gray-600 max-w-md mx-auto">
              Une erreur inattendue s'est produite dans l'application. 
              Veuillez recharger la page ou contacter l'administrateur si le problème persiste.
            </p>
            
            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Recharger la page
              </button>
              
              <button
                onClick={this.handleReset}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Réessayer
              </button>
            </div>

            {/* Affichage des détails d'erreur en mode développement */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left max-w-2xl mx-auto">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Détails de l'erreur (développement)
                </summary>
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Erreur:</h3>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap mb-4">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                  
                  <h3 className="text-sm font-medium text-red-800 mb-2">Stack trace:</h3>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary