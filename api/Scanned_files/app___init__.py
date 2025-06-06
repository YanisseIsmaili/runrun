# api/app/__init__.py - Version mise à jour
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from sqlalchemy import text
import os
from dotenv import load_dotenv
import logging
import time

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

# Initialisation des extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Configuration
    app.config.from_object('app.config.Config')
    
    # Log de la configuration de la base de données (masquer le mot de passe)
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if db_uri:
        # Masquer le mot de passe dans les logs pour des raisons de sécurité
        safe_db_uri = db_uri.replace('://', '://***:***@') if '@' in db_uri else db_uri
        logger.info(f"Connexion à la base de données: {safe_db_uri}")
    
    # Initialisation des extensions avec l'app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configuration CORS étendue pour le frontend
    cors_origins = [
        'http://localhost:3000',  # Vite dev server
        'http://127.0.0.1:3000',
        'http://localhost:5173',  # Vite alternative port
        'http://127.0.0.1:5173'
    ]
    
    # Ajouter les origines depuis les variables d'environnement
    env_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if env_origins:
        env_origins_list = [origin.strip() for origin in env_origins.split(",")]
        cors_origins.extend(env_origins_list)
    
    logger.info(f"Origines CORS autorisées: {cors_origins}")
    
    # Activer CORS avec configuration étendue
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Ajouter des headers CORS spécifiques après chaque requête
    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get('Origin')
        
        # Permettre les requêtes CORS avec credentials
        if origin and origin in cors_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            
        # Ajouter des headers de sécurité supplémentaires
        response.headers.add('X-Content-Type-Options', 'nosniff')
        response.headers.add('X-Frame-Options', 'DENY')
        response.headers.add('X-XSS-Protection', '1; mode=block')
        
        return response
    
    # Route OPTIONS pour préflight CORS
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def options_api(path):
        return '', 200
    
    # Middleware pour le logging des requêtes et le temps de réponse
    @app.before_request
    def before_request():
        request.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        # Seulement si la requête a un temps de début
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(f"{request.method} {request.path} - {response.status_code} - {duration:.4f}s")
        return response
    
    # Gestion globale des erreurs
    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error(f"Erreur non gérée: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Une erreur interne s'est produite",
            "errors": {"server": str(e)}
        }), 500
    
    # Vérifier la connexion à la base de données
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            logger.info("✅ Connexion à la base de données réussie")
        except Exception as e:
            logger.error(f"❌ Erreur de connexion à la base de données: {str(e)}")
    
    # Enregistrement des blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.runs import runs_bp
    from app.routes.stats import stats_bp
    from app.routes.admin import admin_bp
    from app.routes.routes import routes_bp  # Nouveau blueprint ajouté
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(runs_bp, url_prefix='/api/runs')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(routes_bp, url_prefix='/api/routes')  # Nouveau blueprint
    
    # Route pour vérifier l'état de l'API et de la base de données
    @app.route('/api/health')
    def health_check():
        status = {
            "api": {
                "status": "healthy",
                "message": "Running App API is running"
            },
            "database": {
                "status": "unknown",
                "message": "Database connection not tested"
            }
        }
        
        # Vérifier la connexion à la base de données
        try:
            db.session.execute(text("SELECT 1"))
            status["database"] = {
                "status": "healthy",
                "message": "Database connection is working"
            }
        except Exception as e:
            status["database"] = {
                "status": "error",
                "message": f"Database connection error: {str(e)}"
            }
            
        # Le statut global est sain seulement si l'API et la base de données sont saines
        overall_status = "healthy" if status["database"]["status"] == "healthy" else "unhealthy"
        
        return jsonify({
            "status": overall_status,
            "timestamp": time.time(),
            "components": status
        })
    
    # Route spécifique pour vérifier l'état de la base de données
    @app.route('/api/health/db')
    def db_health_check():
        status = {
            "status": "unknown",
            "message": "Database connection not tested"
        }
        
        # Vérifier la connexion à la base de données
        try:
            db.session.execute(text("SELECT 1"))
            status = {
                "status": "healthy",
                "message": "Database connection is working"
            }
        except Exception as e:
            status = {
                "status": "error",
                "message": f"Database connection error: {str(e)}"
            }
            
        return jsonify(status)
    
    logger.info("Application Flask initialisée avec succès")
    return app