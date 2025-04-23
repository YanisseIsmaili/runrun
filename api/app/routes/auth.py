from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    # Récupérer les données de la requête
    try:
        data = request.get_json()
        print("Données JSON reçues:", data)
    except Exception as e:
        print("Erreur lors du parsing JSON:", str(e))
        return jsonify({
            'status': 'error',
            'message': 'Données JSON invalides',
            'errors': {'format': 'Format JSON invalide'}
        }), 400
    
    # Vérifier que les champs requis sont présents
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({
            'status': 'error',
            'message': 'Les champs username, email et password sont requis',
            'errors': {'fields': 'Champs requis manquants'}
        }), 400
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = User.query.filter(
        (User.username == data.get('username')) | 
        (User.email == data.get('email'))
    ).first()
    
    if existing_user:
        return jsonify({
            'status': 'error',
            'message': 'Un utilisateur avec ce nom d\'utilisateur ou cet email existe déjà',
            'errors': {'user': 'Utilisateur déjà existant'}
        }), 400
    
    # Créer un nouvel utilisateur
    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        password=data.get('password')  # Le hashage est géré par le setter dans le modèle
    )
    
    # Ajouter les champs optionnels s'ils sont présents
    if data.get('first_name'):
        new_user.first_name = data.get('first_name')
    if data.get('last_name'):
        new_user.last_name = data.get('last_name')
    if data.get('date_of_birth'):
        try:
            new_user.date_of_birth = datetime.datetime.strptime(data.get('date_of_birth'), '%Y-%m-%d').date()
        except ValueError:
            pass  # Ignorer si le format de date est incorrect
    if data.get('height'):
        new_user.height = data.get('height')
    if data.get('weight'):
        new_user.weight = data.get('weight')
    
    # Enregistrer l'utilisateur dans la base de données
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Générer les jetons d'accès et de rafraîchissement
        access_token = create_access_token(identity=new_user.id)
        refresh_token = create_refresh_token(identity=new_user.id)
        
        # Format de réponse standardisé
        return jsonify({
            'status': 'success',
            'message': 'Utilisateur enregistré avec succès',
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': new_user.to_dict()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de l\'enregistrement: {str(e)}',
            'errors': {'database': str(e)}
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    # Récupérer les données de la requête
    try:
        data = request.get_json()
        print("Données de login reçues:", data)
    except Exception as e:
        print("Erreur lors du parsing JSON:", str(e))
        return jsonify({
            'status': 'error',
            'message': 'Données JSON invalides',
            'errors': {'format': 'Format JSON invalide'}
        }), 400
    
    # Vérifier que les champs requis sont présents
    email_or_username = data.get('email') or data.get('username')
    password = data.get('password')
    
    if not email_or_username or not password:
        return jsonify({
            'status': 'error',
            'message': 'Email/username et mot de passe requis',
            'errors': {'fields': 'Identifiants incomplets'}
        }), 400
    
    # Rechercher l'utilisateur par username ou email
    if data.get('username'):
        user = User.query.filter_by(username=data.get('username')).first()
    else:
        user = User.query.filter_by(email=data.get('email')).first()
    
    # Vérifier si l'utilisateur existe et si le mot de passe est correct
    if not user or not user.verify_password(password):
        return jsonify({
            'status': 'error',
            'message': 'Identifiants incorrects',
            'errors': {'auth': 'Identifiants invalides'}
        }), 401
    
    # Générer les jetons d'accès et de rafraîchissement
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    # Format de réponse standardisé
    return jsonify({
        'status': 'success',
        'message': 'Connexion réussie',
        'data': {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    # Récupérer l'identité de l'utilisateur à partir du jeton
    user_id = get_jwt_identity()
    
    # Générer un nouveau jeton d'accès
    access_token = create_access_token(identity=user_id)
    
    # Format de réponse standardisé
    return jsonify({
        'status': 'success',
        'message': 'Jeton d\'accès renouvelé',
        'data': {
            'access_token': access_token
        }
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Format de réponse standardisé
    return jsonify({
        'status': 'success',
        'message': 'Déconnexion réussie',
        'data': {}
    }), 200