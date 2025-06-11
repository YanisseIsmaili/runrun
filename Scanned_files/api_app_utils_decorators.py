# api/app/utils/decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.user import User

def admin_required(f):
    """Décorateur pour vérifier que l'utilisateur est administrateur"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({
                    'status': 'error',
                    'message': 'Utilisateur non trouvé',
                    'error_code': 'USER_NOT_FOUND'
                }), 404
            
            if not user.is_admin:
                return jsonify({
                    'status': 'error',
                    'message': 'Accès administrateur requis',
                    'error_code': 'ADMIN_REQUIRED'
                }), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': 'Erreur de vérification des permissions',
                'error_code': 'PERMISSION_CHECK_ERROR'
            }), 500
    
    return decorated_function

def active_user_required(f):
    """Décorateur pour vérifier que l'utilisateur est actif"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({
                    'status': 'error',
                    'message': 'Utilisateur non trouvé',
                    'error_code': 'USER_NOT_FOUND'
                }), 404
            
            if not user.is_active:
                return jsonify({
                    'status': 'error',
                    'message': 'Compte utilisateur désactivé',
                    'error_code': 'USER_INACTIVE'
                }), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': 'Erreur de vérification du statut utilisateur',
                'error_code': 'USER_STATUS_CHECK_ERROR'
            }), 500
    
    return decorated_function