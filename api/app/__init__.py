from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from dotenv import load_dotenv




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
    
    # Initialisation des extensions avec l'app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # CORS configuration with better error handling
    try:
        origins = os.getenv("CORS_ALLOWED_ORIGINS", "*")
        origins_list = origins.split(",") if origins != "*" else "*"
        CORS(app, resources={r"/api/*": {"origins": origins_list}})
        print(f"CORS configured with origins: {origins}")
    except Exception as e:
        print(f"Warning: Error configuring CORS: {e}")
        # Fallback to allow all origins
        CORS(app)
        print("Fallback: CORS configured to allow all origins")
    
    # Enregistrement des blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.runs import runs_bp
    from app.routes.stats import stats_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(runs_bp, url_prefix='/api/runs')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Création des tables si elles n'existent pas - avec gestion d'erreur
    try:
        with app.app_context():
            db.create_all()
            print("Tables de base de données créées avec succès")
    except Exception as e:
        print(f"Erreur lors de la création des tables: {e}")
        print("L'application va démarrer sans créer les tables. Assurez-vous que le serveur MySQL est en cours d'exécution.")
    
    @app.route('/api/health')
    def health_check():
        return {"status": "healthy", "message": "Running App API is running"}
    
    return app