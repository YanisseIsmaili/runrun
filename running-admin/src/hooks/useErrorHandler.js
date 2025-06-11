// running-admin/src/hooks/useErrorHandler.js
import { useState, useCallback } from 'react'

export const useApiCall = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const callApi = useCallback(async (apiFunction, options = {}) => {
    const {
      onSuccess,
      onError,
      errorMessage = 'Une erreur est survenue',
      showLoading = true
    } = options

    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)

      const result = await apiFunction()
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err) {
      console.error('Erreur API:', err)
      
      let finalErrorMessage = errorMessage
      
      // Extraire le message d'erreur de l'API
      if (err.response?.data?.message) {
        finalErrorMessage = err.response.data.message
      } else if (err.userMessage) {
        finalErrorMessage = err.userMessage
      } else if (err.message) {
        finalErrorMessage = err.message
      }
      
      setError(finalErrorMessage)
      
      if (onError) {
        onError(err)
      }
      
      throw err
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  const retry = useCallback(() => {
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    callApi,
    retry,
    clearError
  }
}

export default useApiCall