# api/app/__init__.py
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import timedelta
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
    
    # Gestionnaires d'erreurs JWT
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'status': 'error', 'message': 'Token expiré'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'status': 'error', 'message': 'Token invalide'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'status': 'error', 'message': 'Token requis'}), 401
    
    # Import blueprints
    try:
        from app.routes.auth import auth_bp
        from app.routes.users import users_bp
        from app.routes.runs import runs_bp
        from app.routes.routes import routes_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(users_bp, url_prefix='/api/users')
        app.register_blueprint(runs_bp, url_prefix='/api/runs')
        app.register_blueprint(routes_bp, url_prefix='/api/routes')
    except ImportError as e:
        print(f"⚠️ Erreur import blueprints: {e}")
    
    # Routes de santé
    @app.route('/api/health', methods=['GET'])
    def health_check():
        try:
            db.session.execute('SELECT 1')
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'
        
        return jsonify({
            'status': 'success',
            'message': 'API opérationnelle',
            'data': {
                'version': '1.0.0',
                'database': db_status
            }
        }), 200
    
    @app.route('/api/health/db', methods=['GET'])
    def health_check_db():
        try:
            db.session.execute('SELECT 1')
            return jsonify({
                'status': 'success',
                'message': 'Base de données connectée',
                'database': 'connected'
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': 'Erreur base de données',
                'database': f'error: {str(e)}'
            }), 500
    
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'status': 'success',
            'message': 'API Running Administration'
        }), 200
    
    return app