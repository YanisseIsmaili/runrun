# api/app/__init__.py - FICHIER COMPLET CORRIGÉ
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity  # AJOUT MANQUANT
from flask_cors import CORS
from sqlalchemy import text
from datetime import timedelta, datetime  # AJOUT datetime
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Base de données sur 192.168.0.47, API sur localhost
    DB_USERNAME = os.getenv('DB_USERNAME', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'root')
    DB_HOST = '192.168.0.47'  # IP fixe pour la DB
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'running_app_db')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    db.init_app(app)
    jwt.init_app(app)
    
    # CORS pour localhost (même machine)
    CORS(app, origins=["*"], supports_credentials=True)
    
    # Gestionnaires d'erreurs JWT - AMÉLIORÉS
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'status': 'error', 
            'message': 'Token expiré',
            'error_code': 'TOKEN_EXPIRED'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'status': 'error', 
            'message': 'Token invalide',
            'error_code': 'TOKEN_INVALID'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'status': 'error', 
            'message': 'Token requis',
            'error_code': 'TOKEN_MISSING'
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'status': 'error',
            'message': 'Token révoqué',
            'error_code': 'TOKEN_REVOKED'
        }), 401
    
    # Import blueprints APRÈS la configuration JWT
    try:
        from app.routes.auth import auth_bp
        from app.routes.users import users_bp
        from app.routes.runs import runs_bp
        from app.routes.routes import routes_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(users_bp, url_prefix='/api/users')
        app.register_blueprint(runs_bp, url_prefix='/api/runs')
        app.register_blueprint(routes_bp, url_prefix='/api/routes')
        
        print("✅ Blueprints enregistrés avec succès")
    except ImportError as e:
        print(f"⚠️ Erreur import blueprints: {e}")
    
    # Routes de santé - AVEC IMPORTS CORRECTS
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Route de santé pour vérifier l'API"""
        try:
            # Test de connexion à la base de données
            db.session.execute(text('SELECT 1'))
            return jsonify({
                'status': 'success',
                'message': 'API en ligne',
                'database': 'connected',
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': 'Problème de santé API',
                'database': 'disconnected',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500

    @app.route('/api/health/auth', methods=['GET'])
    @jwt_required()
    def auth_health_check():
        """Route de santé pour vérifier l'authentification"""
        try:
            current_user_id = get_jwt_identity()
            
            # Import conditionnel pour éviter les imports circulaires
            from app.models.user import User
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({
                    'status': 'error',
                    'message': 'Utilisateur non trouvé'
                }), 404
            
            return jsonify({
                'status': 'success',
                'message': 'Authentification OK',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'is_active': user.is_active
                },
                'timestamp': datetime.utcnow().isoformat()
            }), 200
            
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': 'Erreur de vérification auth',
                'error': str(e)
            }), 500

    # Route de test simple
    @app.route('/api/test', methods=['GET'])
    def test_route():
        """Route de test basique"""
        return jsonify({
            'status': 'success',
            'message': 'API fonctionne',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    # Gestionnaire d'erreur global
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'status': 'error',
            'message': 'Route non trouvée',
            'error_code': 'NOT_FOUND'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Erreur interne du serveur',
            'error_code': 'INTERNAL_ERROR'
        }), 500
    
    print(f"✅ Application Flask créée avec succès")
    print(f"🔗 Base de données: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    print(f"🔐 JWT configuré avec expiration: 24h")
    
    return app