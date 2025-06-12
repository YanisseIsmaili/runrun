import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const UserModal = ({ isOpen, onClose, onSubmit, user = null, loading = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    height: '',
    weight: '',
    is_admin: false,
    password: '',
    confirm_password: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        date_of_birth: user.date_of_birth || '',
        height: user.height || '',
        weight: user.weight || '',
        is_admin: user.is_admin || false,
        password: '',
        confirm_password: ''
      })
    } else {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        height: '',
        weight: '',
        is_admin: false,
        password: '',
        confirm_password: ''
      })
    }
    setErrors({})
  }, [user, isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (!user && !formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    }

    if (!user && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Les mots de passe ne correspondent pas'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    if (formData.height && (isNaN(formData.height) || formData.height <= 0)) {
      newErrors.height = 'Taille invalide'
    }

    if (formData.weight && (isNaN(formData.weight) || formData.weight <= 0)) {
      newErrors.weight = 'Poids invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData = { ...formData }
    
    // Ne pas envoyer les mots de passe vides lors de la modification
    if (user && !submitData.password) {
      delete submitData.password
      delete submitData.confirm_password
    }

    onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom d'utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom d'utilisateur *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${errors.username ? 'border-red-300' : ''}`}
                placeholder="johndoe"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'border-red-300' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="form-input"
                placeholder="John"
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de famille
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="form-input"
                placeholder="Doe"
              />
            </div>

            {/* Date de naissance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            {/* Taille */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille (cm)
              </label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className={`form-input ${errors.height ? 'border-red-300' : ''}`}
                placeholder="175"
                min="0"
                step="0.1"
              />
              {errors.height && (
                <p className="mt-1 text-sm text-red-600">{errors.height}</p>
              )}
            </div>

            {/* Poids */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poids (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className={`form-input ${errors.weight ? 'border-red-300' : ''}`}
                placeholder="70"
                min="0"
                step="0.1"
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
              )}
            </div>
          </div>

          {/* Mots de passe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user ? 'Nouveau mot de passe' : 'Mot de passe *'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'border-red-300' : ''}`}
                placeholder={user ? 'Laisser vide pour ne pas changer' : '••••••••'}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user ? 'Confirmer le nouveau mot de passe' : 'Confirmer le mot de passe *'}
              </label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={`form-input ${errors.confirm_password ? 'border-red-300' : ''}`}
                placeholder="••••••••"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
              )}
            </div>
          </div>

          {/* Rôle admin */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_admin"
              id="is_admin"
              checked={formData.is_admin}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
              Administrateur
            </label>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {user ? 'Modification...' : 'Création...'}
                </div>
              ) : (
                user ? 'Modifier' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal