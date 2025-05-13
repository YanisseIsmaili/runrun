# Fichier: app/routes/users.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.run import Run
from sqlalchemy import func

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            "status": "error",
            "message": "Utilisateur non trouvé",
            "errors": {"user": "Utilisateur inexistant"}
        }), 404
    
    # Format de réponse standardisé
    return jsonify({
        "status": "success",
        "message": "Profil récupéré avec succès",
        "data": user.to_dict()
    }), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            "status": "error",
            "message": "Utilisateur non trouvé",
            "errors": {"user": "Utilisateur inexistant"}
        }), 404
    
    data = request.json
    
    # Mise à jour des champs modifiables
    if not data:
        return jsonify({
            "status": "error",
            "message": "Aucune donnée fournie",
            "errors": {"data": "Données requises"}
        }), 400
    
    try:
        # Mise à jour des champs modifiables
        for field in ['first_name', 'last_name', 'date_of_birth', 'height', 'weight']:
            if field in data:
                setattr(user, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Profil mis à jour avec succès",
            "data": user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la mise à jour du profil: {str(e)}",
            "errors": {"database": str(e)}
        }), 500

@users_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            "status": "error",
            "message": "Utilisateur non trouvé",
            "errors": {"user": "Utilisateur inexistant"}
        }), 404
    
    data = request.json
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({
            "status": "error",
            "message": "Données incomplètes",
            "errors": {"password": "Mot de passe actuel et nouveau mot de passe requis"}
        }), 400
    
    # Vérification de l'ancien mot de passe
    if not user.verify_password(data.get('current_password')):
        return jsonify({
            "status": "error",
            "message": "Mot de passe actuel incorrect",
            "errors": {"current_password": "Mot de passe incorrect"}
        }), 401
    
    # Vérification que le nouveau mot de passe est différent
    if data.get('current_password') == data.get('new_password'):
        return jsonify({
            "status": "error",
            "message": "Le nouveau mot de passe doit être différent de l'ancien",
            "errors": {"new_password": "Nouveau mot de passe identique à l'ancien"}
        }), 400
    
    try:
        # Mise à jour du mot de passe
        user.password = data.get('new_password')
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Mot de passe modifié avec succès",
            "data": {}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la modification du mot de passe: {str(e)}",
            "errors": {"database": str(e)}
        }), 500

# Route pour obtenir tous les utilisateurs (pour les admins)
@users_bp.route('', methods=['GET'])
@jwt_required()
def get_all_users():
    # Vérification que l'utilisateur est un admin (normalement via un décorateur)
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin:
        return jsonify({
            "status": "error",
            "message": "Accès refusé",
            "errors": {"auth": "Droits administrateur requis"}
        }), 403
    
    # Gestion de la pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Récupération des utilisateurs paginés
    users_query = User.query
    users_pagination = users_query.paginate(page=page, per_page=per_page)
    
    # Formater la réponse
    users_data = [user.to_dict() for user in users_pagination.items]
    
    return jsonify({
        "status": "success",
        "message": "Liste des utilisateurs récupérée",
        "data": {
            "users": users_data,
            "total": users_pagination.total,
            "pages": users_pagination.pages,
            "current_page": page
        }
    }), 200

# Route pour obtenir les détails d'un utilisateur spécifique (pour les admins)
@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_details(user_id):
    # Vérification que l'utilisateur est un admin
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin:
        return jsonify({
            "status": "error",
            "message": "Accès refusé",
            "errors": {"auth": "Droits administrateur requis"}
        }), 403
    
    # Récupération de l'utilisateur demandé
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            "status": "error",
            "message": "Utilisateur non trouvé",
            "errors": {"user": "Utilisateur inexistant"}
        }), 404
    
    # Récupération des statistiques de l'utilisateur
    user_stats = {
        "total_runs": Run.query.filter_by(user_id=user_id).count(),
        "total_distance": db.session.query(func.sum(Run.distance)).filter(Run.user_id == user_id).scalar() or 0,
        "last_activity": db.session.query(func.max(Run.created_at)).filter(Run.user_id == user_id).scalar()
    }
    
    return jsonify({
        "status": "success",
        "message": f"Détails de l'utilisateur {user.username}",
        "data": {
            "user": user.to_dict(),
            "stats": user_stats
        }
    }), 200