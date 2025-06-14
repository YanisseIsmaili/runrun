// running-admin/src/components/StorageDiagnostic.jsx
import { useState, useEffect } from 'react'
import { 
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import cryptoService from '../services/cryptoService'

const StorageDiagnostic = () => {
  const [storageInfo, setStorageInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadStorageInfo()
  }, [])

  const loadStorageInfo = () => {
    setIsLoading(true)
    setTimeout(() => {
      const info = cryptoService.getStorageInfo()
      setStorageInfo(info)
      setIsLoading(false)
    }, 500)
  }

  const runDiagnostic = () => {
    setIsLoading(true)
    setTimeout(() => {
      const info = cryptoService.diagnose()
      setStorageInfo(info)
      setIsLoading(false)
    }, 1000)
  }

  const cleanStorage = () => {
    if (window.confirm('Nettoyer les données expirées et corrompues ?')) {
      setIsLoading(true)
      setTimeout(() => {
        const cleaned = cryptoService.cleanExpiredItems()
        alert(`${cleaned} éléments nettoyés`)
        loadStorageInfo()
      }, 500)
    }
  }

  const clearAllStorage = () => {
    if (window.confirm('⚠️ ATTENTION: Cela va supprimer TOUTES les données stockées et vous déconnecter. Continuer ?')) {
      const cleared = cryptoService.clearAllSecureData()
      alert(`${cleared} éléments supprimés. Rechargement de la page...`)
      window.location.reload()
    }
  }

  if (!storageInfo) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
          Diagnostic du stockage
        </h3>
        <button
          onClick={runDiagnostic}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Diagnostiquer</span>
        </button>
      </div>

      {/* Status général */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center">
            {storageInfo.isHealthy ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className="font-medium">
              {storageInfo.isHealthy ? 'Stockage sain' : 'Problèmes détectés'}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center">
            <span className="font-medium">Mode: </span>
            <span className={`ml-2 px-2 py-1 text-xs rounded ${
              storageInfo.fallbackMode 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {storageInfo.fallbackMode ? 'Fallback (Base64)' : 'Chiffré (AES)'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium mb-3">Statistiques</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Éléments total:</span>
            <div className="font-medium text-lg">{storageInfo.totalItems}</div>
          </div>
          <div>
            <span className="text-gray-500">Valides:</span>
            <div className="font-medium text-lg text-green-600">{storageInfo.validItems}</div>
          </div>
          <div>
            <span className="text-gray-500">Corrompus:</span>
            <div className="font-medium text-lg text-red-600">{storageInfo.corruptedItems}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={cleanStorage}
          disabled={isLoading || storageInfo.corruptedItems === 0}
          className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <WrenchScrewdriverIcon className="h-4 w-4" />
          <span>Nettoyer ({storageInfo.corruptedItems})</span>
        </button>

        <button
          onClick={clearAllStorage}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Tout effacer</span>
        </button>
      </div>

      {/* Message d'erreur si présent */}
      {storageInfo.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-sm text-red-700">
              <strong>Erreur:</strong> {storageInfo.error}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <strong>💡 Conseils:</strong>
        <ul className="mt-1 space-y-1">
          <li>• Si le mode est "Fallback", le chiffrement AES n'est pas disponible</li>
          <li>• "Nettoyer" supprime les données expirées et corrompues</li>
          <li>• "Tout effacer" vous déconnectera complètement</li>
        </ul>
      </div>
    </div>
  )
}

export default StorageDiagnostic