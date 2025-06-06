import { useState, useCallback } from 'react'

export const useErrorHandler = () => {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAsync = useCallback(async (asyncFunction, options = {}) => {
    const { 
      showLoading = true, 
      errorMessage = 'Une erreur est survenue',
      onSuccess,
      onError
    } = options

    try {
      if (showLoading) setLoading(true)
      setError(null)
      
      const result = await asyncFunction()
      
      if (onSuccess) onSuccess(result)
      return result
    } catch (err) {
      console.error('Erreur capturée:', err)
      
      let userFriendlyMessage = errorMessage
      
      if (err.response?.data?.message) {
        userFriendlyMessage = err.response.data.message
      } else if (err.userMessage) {
        userFriendlyMessage = err.userMessage
      } else if (err.message) {
        userFriendlyMessage = err.message
      }
      
      const errorInfo = {
        message: userFriendlyMessage,
        originalError: err,
        timestamp: new Date().toISOString(),
        type: err.response ? 'api' : err.request ? 'network' : 'client'
      }
      
      setError(errorInfo)
      
      if (onError) onError(errorInfo)
      
      return null
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const retry = useCallback((asyncFunction, options = {}) => {
    clearError()
    return handleAsync(asyncFunction, options)
  }, [handleAsync, clearError])

  return {
    error,
    loading,
    handleAsync,
    clearError,
    retry
  }
}

export const useApiCall = () => {
  const { handleAsync, ...rest } = useErrorHandler()

  const callApi = useCallback((apiFunction, options = {}) => {
    return handleAsync(apiFunction, {
      errorMessage: 'Erreur lors de la communication avec le serveur',
      ...options
    })
  }, [handleAsync])

  return {
    callApi,
    ...rest
  }
}