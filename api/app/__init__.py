# api/app/__init__.py - SOLUTION CORS DÉFINITIVE (REMPLACEMENT COMPLET)
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_migrate import Migrate
from sqlalchemy import text
from datetime import timedelta, datetime
import os
from dotenv import load_dotenv


load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Configuration Flask
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Configuration JWT
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    # Configuration base de données
    DB_USERNAME = os.getenv('DB_USERNAME', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'root')
    DB_HOST = '192.168.0.47'
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'running_app_db')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialiser les extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate = Migrate(app, db)
    
    # 🔧 CORS SIMPLE ET FONCTIONNEL - SANS CONFLIT
    CORS(app)  # Configuration par défaut accepte tout
    
    # Gestionnaires d'erreurs JWT
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
    
    # Import et enregistrement des blueprints
    try:
        from app.routes.auth import auth_bp
        from app.routes.users import users_bp
        from app.routes.runs import runs_bp
        from app.routes.routes import routes_bp
        from app.routes.admin import admin_bp
        from app.routes.dashboard import dashboard_bp
        from app.routes.upload import upload_bp
        
        # Import du modèle stats_cache
        from app.models.stats_cache import StatsCache
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(users_bp, url_prefix='/api/users')
        app.register_blueprint(runs_bp, url_prefix='/api/runs')
        app.register_blueprint(routes_bp, url_prefix='/api/routes')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
        app.register_blueprint(upload_bp, url_prefix='/api/uploads')
        
        print("✅ Blueprints enregistrés avec succès")
    except ImportError as e:
        print(f"⚠️ Erreur import blueprints: {e}")
    
    # 🔧 Routes manquantes pour l'ApiScanner
    @app.route('/api/stats/global', methods=['GET'])
    @jwt_required(optional=True)
    def get_global_stats():
        try:
            from app.models.user import User
            from app.models.run import Run
            from sqlalchemy import func
            
            # Calculer les statistiques de base
            total_users = db.session.query(func.count(User.id)).scalar() or 0
            active_users = db.session.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
            total_runs = db.session.query(func.count(Run.id)).scalar() or 0
            
            # Statistiques de distance
            total_distance = db.session.query(func.sum(Run.distance)).scalar() or 0
            
            # Statistiques temporelles
            this_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            runs_this_month = db.session.query(func.count(Run.id)).filter(Run.created_at >= this_month_start).scalar() or 0
            distance_this_month = db.session.query(func.sum(Run.distance)).filter(Run.created_at >= this_month_start).scalar() or 0
            new_users_this_month = db.session.query(func.count(User.id)).filter(User.created_at >= this_month_start).scalar() or 0
            
            return jsonify({
                'status': 'success',
                'stats': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'total_runs': total_runs,
                    'total_routes': 0,
                    'total_distance': float(total_distance),
                    'average_pace': 0.0,
                    'runs_this_month': runs_this_month,
                    'distance_this_month': float(distance_this_month or 0),
                    'new_users_this_month': new_users_this_month,
                    'active_routes': 0
                }
            }), 200
            
        except Exception as e:
            print(f"❌ Erreur stats globales: {e}")
            return jsonify({
                'status': 'error',
                'message': 'Erreur lors du calcul des statistiques',
                'error': str(e)
            }), 500

    @app.route('/api/stats/users', methods=['GET'])
    @jwt_required(optional=True)
    def get_users_stats():
        try:
            from app.models.user import User
            from sqlalchemy import func
            
            total_users = db.session.query(func.count(User.id)).scalar() or 0
            active_users = db.session.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
            
            return jsonify({
                'status': 'success',
                'data': {
                    'total': total_users,
                    'active': active_users,
                    'inactive': total_users - active_users
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': 'Erreur lors du calcul des statistiques utilisateurs',
                'error': str(e)
            }), 500

    @app.route('/api/runs/stats', methods=['GET'])
    @jwt_required(optional=True)
    def get_runs_stats():
        try:
            from app.models.run import Run
            from sqlalchemy import func
            
            total_runs = db.session.query(func.count(Run.id)).scalar() or 0
            total_distance = db.session.query(func.sum(Run.distance)).scalar() or 0
            
            return jsonify({
                'status': 'success',
                'data': {
                    'total_runs': total_runs,
                    'total_distance': float(total_distance or 0),
                    'average_distance': float((total_distance or 0) / max(total_runs, 1))
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': 'Erreur lors du calcul des statistiques de courses',
                'error': str(e)
            }), 500
    
    # Routes de santé
    @app.route('/api/health', methods=['GET'])
    def health_check():
        try:
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
        try:
            current_user_id = get_jwt_identity()
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

    # Gestionnaires d'erreur globaux
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
    print(f"🌐 CORS configuré par défaut (accepte tout)")
    print(f"📊 Routes stats ajoutées")
    
    return app