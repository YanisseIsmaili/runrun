# api/app/routes/auth.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta, datetime
from app import db
from app.models.user import User
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authentification de l'utilisateur"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie",
                "errors": {"data": "Données requises"}
            }), 400
        
        # Récupérer email ou username et password
        email_or_username = data.get('email') or data.get('username')
        password = data.get('password')
        
        print(f"🔍 Tentative de connexion pour: {email_or_username}")
        
        if not email_or_username or not password:
            return jsonify({
                "status": "error",
                "message": "Email/nom d'utilisateur et mot de passe requis",
                "errors": {"credentials": "Identifiants manquants"}
            }), 400
        
        # Déterminer si c'est un email ou un username
        is_email = '@' in email_or_username
        
        # Chercher l'utilisateur
        if is_email:
            user = User.query.filter_by(email=email_or_username.lower()).first()
            print(f"🔍 Recherche par email: {email_or_username.lower()}")
        else:
            user = User.query.filter_by(username=email_or_username).first()
            print(f"🔍 Recherche par username: {email_or_username}")
        
        if not user:
            print(f"❌ Utilisateur non trouvé: {email_or_username}")
            return jsonify({
                "status": "error",
                "message": "Identifiants invalides",
                "errors": {"credentials": "Email/username ou mot de passe incorrect"}
            }), 401
        
        print(f"✅ Utilisateur trouvé: {user.username} (ID: {user.id})")
        
        # Vérifier le mot de passe avec la méthode du modèle
        if not user.verify_password(password):
            print(f"❌ Mot de passe incorrect pour: {user.username}")
            return jsonify({
                "status": "error",
                "message": "Identifiants invalides",
                "errors": {"credentials": "Email/username ou mot de passe incorrect"}
            }), 401
        
        print(f"✅ Mot de passe correct pour: {user.username}")
        
        # Vérifier si le compte est actif
        if not user.is_active:
            print(f"❌ Compte désactivé: {user.username}")
            return jsonify({
                "status": "error",
                "message": "Compte désactivé",
                "errors": {"account": "Votre compte a été désactivé"}
            }), 403
        
        # Mettre à jour la dernière connexion
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Créer le token JWT avec identity en string
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=24)
        )
        
        print(f"✅ Connexion réussie: {user.username}")
        
        return jsonify({
            "status": "success",
            "message": "Connexion réussie",
            "data": {
                "access_token": access_token,
                "user": user.to_dict()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur login: {e}")
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la connexion",
            "error": str(e)
        }), 500

@auth_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_token():
    """Valide le token JWT et retourne les infos utilisateur"""
    try:
        print("🔍 Validation du token...")
        current_user_id = int(get_jwt_identity())
        print(f"👤 User ID extrait du token: {current_user_id}")
        
        user = User.query.get(current_user_id)
        print(f"📊 Utilisateur trouvé en DB: {user.username if user else 'None'}")
        
        if not user:
            print("❌ Utilisateur non trouvé en base")
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé",
                "error_code": "USER_NOT_FOUND"
            }), 401
        
        if not user.is_active:
            print("❌ Utilisateur inactif")
            return jsonify({
                "status": "error",
                "message": "Compte désactivé",
                "error_code": "USER_INACTIVE"
            }), 401
        
        print(f"✅ Validation réussie pour: {user.username}")
        return jsonify({
            "status": "success",
            "message": "Token valide",
            "data": {
                "user": user.to_dict()
            }
        }), 200
        
    except Exception as e:
        print(f"💥 Erreur validation: {e}")
        return jsonify({
            "status": "error",
            "message": "Token invalide",
            "error_code": "TOKEN_INVALID",
            "error_detail": str(e)
        }), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie"
            }), 400
        
        # Validation des champs requis
        required_fields = ['username', 'email', 'password']
        errors = {}
        
        for field in required_fields:
            if not data.get(field) or not data[field].strip():
                errors[field] = f"Le champ '{field}' est requis"
        
        # Validation de l'email
        if data.get('email'):
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, data['email']):
                errors['email'] = "Format d'email invalide"
        
        # Validation du mot de passe
        if data.get('password'):
            if len(data['password']) < 6:
                errors['password'] = "Le mot de passe doit contenir au moins 6 caractères"
        
        # Validation de l'unicité
        if data.get('username'):
            if User.query.filter_by(username=data['username'].strip()).first():
                errors['username'] = "Ce nom d'utilisateur existe déjà"
        
        if data.get('email'):
            if User.query.filter_by(email=data['email'].strip().lower()).first():
                errors['email'] = "Cet email existe déjà"
        
        if errors:
            return jsonify({
                "status": "error",
                "message": "Erreurs de validation",
                "errors": errors
            }), 400
        
        # Créer l'utilisateur
        user = User(
            username=data['username'].strip(),
            email=data['email'].strip().lower(),
            first_name=data.get('first_name', '').strip(),
            last_name=data.get('last_name', '').strip(),
            is_active=True,
            is_admin=False
        )
        
        # UTILISER set_password() au lieu du setter password
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Créer le token d'accès avec identity en string
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=24)
        )
        
        print(f"✅ Inscription réussie: {user.username}")
        
        return jsonify({
            "status": "success",
            "message": "Inscription réussie",
            "data": {
                "user": user.to_dict(),
                "access_token": access_token
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur inscription: {e}")
        return jsonify({
            "status": "error",
            "message": "Erreur lors de l'inscription",
            "error": str(e)
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Changement de mot de passe"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé"
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie"
            }), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Validation
        if not current_password or not new_password or not confirm_password:
            return jsonify({
                "status": "error",
                "message": "Tous les champs sont requis"
            }), 400
        
        if not user.verify_password(current_password):
            return jsonify({
                "status": "error",
                "message": "Mot de passe actuel incorrect"
            }), 400
        
        if new_password != confirm_password:
            return jsonify({
                "status": "error",
                "message": "Les nouveaux mots de passe ne correspondent pas"
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                "status": "error",
                "message": "Le nouveau mot de passe doit contenir au moins 6 caractères"
            }), 400
        
        # Changer le mot de passe
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Mot de passe modifié avec succès"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors du changement de mot de passe",
            "error": str(e)
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh():
    """Rafraîchit le token JWT"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non valide"
            }), 401
        
        # Créer un nouveau token avec identity en string
        new_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            "status": "success",
            "message": "Token rafraîchi",
            "data": {
                "access_token": new_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors du rafraîchissement",
            "error": str(e)
        }), 500

@auth_bp.route('/promote-admin', methods=['POST'])
@jwt_required()
def promote_admin():
    """Route temporaire pour promouvoir un utilisateur admin"""
    try:
        data = request.get_json()
        secret_key = data.get('secret_key')
        
        # Clé secrète pour la sécurité
        if secret_key != "PROMOTE_ADMIN_SECRET_2025":
            return jsonify({
                "status": "error",
                "message": "Clé secrète invalide"
            }), 401
        
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé"
            }), 404
        
        # Promotion en admin
        user.is_admin = True
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Utilisateur {user.username} promu administrateur",
            "data": user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la promotion",
            "error": str(e)
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Déconnexion de l'utilisateur"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if user:
            print(f"🚪 Déconnexion de: {user.username}")
            # Optionnel: mettre à jour last_logout ou invalidate token côté serveur
            # user.last_logout = datetime.utcnow()
            # db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Déconnexion réussie"
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur logout: {e}")
        return jsonify({
            "status": "success", 
            "message": "Déconnexion réussie"  # Toujours réussir le logout
        }), 200