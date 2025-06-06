# Fichier: app/routes/auth.py
# Modifications à apporter au fichier d'authentification

from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Vérifier que les champs requis sont présents
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Données JSON manquantes',
                'errors': {'format': 'Format JSON invalide'}
            }), 400
        
        # Permettre la connexion avec l'email OU le nom d'utilisateur
        email_or_username = data.get('email') or data.get('username')
        password = data.get('password')
        
        if not email_or_username or not password:
            return jsonify({
                'status': 'error',
                'message': 'Email/username et mot de passe requis',
                'errors': {'fields': 'Identifiants incomplets'}
            }), 400
        
        # Rechercher l'utilisateur par username ou email
        if '@' in email_or_username:
            user = User.query.filter_by(email=email_or_username).first()
        else:
            user = User.query.filter_by(username=email_or_username).first()
        
        # Vérifier si l'utilisateur existe et si le mot de passe est correct
        if not user or not user.verify_password(password):
            return jsonify({
                'status': 'error',
                'message': 'Identifiants incorrects',
                'errors': {'auth': 'Identifiants invalides'}
            }), 401
        
        # Vérifier si l'utilisateur est un administrateur
        if not user.is_admin:
            return jsonify({
                'status': 'error',
                'message': 'Accès refusé',
                'errors': {'auth': 'Droits administrateur requis'}
            }), 403
        
        # Générer les jetons d'accès et de rafraîchissement
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Réponse standardisée
        return jsonify({
            'status': 'success',
            'message': 'Connexion réussie',
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la connexion: {str(e)}',
            'errors': {'server': str(e)}
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        # Récupérer l'identité de l'utilisateur à partir du jeton
        user_id = get_jwt_identity()
        
        # Vérifier si l'utilisateur existe toujours
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Utilisateur introuvable',
                'errors': {'auth': 'Compte utilisateur non trouvé'}
            }), 404
        
        # Générer un nouveau jeton d'accès
        access_token = create_access_token(identity=user_id)
        
        # Réponse standardisée
        return jsonify({
            'status': 'success',
            'message': 'Jeton d\'accès renouvelé',
            'data': {
                'access_token': access_token,
                'user': user.to_dict()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors du rafraîchissement du jeton: {str(e)}',
            'errors': {'server': str(e)}
        }), 500

@auth_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_token():
    try:
        # Récupérer l'identité de l'utilisateur à partir du jeton
        user_id = get_jwt_identity()
        
        # Vérifier si l'utilisateur existe toujours
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Utilisateur introuvable',
                'errors': {'auth': 'Compte utilisateur non trouvé'}
            }), 404
        
        # Vérifier si l'utilisateur est un administrateur
        if not user.is_admin:
            return jsonify({
                'status': 'error',
                'message': 'Accès refusé',
                'errors': {'auth': 'Droits administrateur requis'}
            }), 403
        
        # Réponse standardisée
        return jsonify({
            'status': 'success',
            'message': 'Jeton valide',
            'data': {
                'user': user.to_dict()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la validation du jeton: {str(e)}',
            'errors': {'server': str(e)}
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Dans un système plus complet, on pourrait ajouter le jeton à une liste noire
    return jsonify({
        'status': 'success',
        'message': 'Déconnexion réussie',
        'data': {}
    }), 200