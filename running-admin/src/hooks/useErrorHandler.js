// running-admin/src/hooks/useErrorHandler.js - NOUVEAU FICHIER
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
      console.error('API Error:', err)
      
      let finalError = errorMessage
      
      // Utiliser le message d'erreur personnalisé de l'API si disponible
      if (err.userMessage) {
        finalError = err.userMessage
      } else if (err.response?.data?.message) {
        finalError = err.response.data.message
      } else if (err.message) {
        finalError = err.message
      }

      setError(finalError)

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
    callApi,
    loading,
    error,
    retry,
    clearError
  }
}