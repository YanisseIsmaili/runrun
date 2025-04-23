from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    
    return jsonify(user.to_dict()), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    
    data = request.json
    
    # Mise à jour des champs modifiables
    for field in ['first_name', 'last_name', 'date_of_birth', 'height', 'weight']:
        if field in data:
            setattr(user, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        "message": "Profil mis à jour avec succès",
        "user": user.to_dict()
    }), 200

@users_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    
    data = request.json
    
    # Vérification de l'ancien mot de passe
    if not user.verify_password(data.get('current_password')):
        return jsonify({"error": "Mot de passe actuel incorrect"}), 401
    
    # Vérification que le nouveau mot de passe est différent
    if data.get('current_password') == data.get('new_password'):
        return jsonify({"error": "Le nouveau mot de passe doit être différent de l'ancien"}), 400
    
    # Mise à jour du mot de passe
    user.password = data.get('new_password')
    db.session.commit()
    
    return jsonify({"message": "Mot de passe modifié avec succès"}), 200