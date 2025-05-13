# Modification nécessaire du fichier app/config.py
import os
from datetime import timedelta

class Config:
    # Configuration Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_key_very_secret')
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    
    # Configuration SQLAlchemy - utiliser la chaîne de connexion MySQL
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql+pymysql://root:root@192.168.0.47:3306/running_app_db')
    
    # Log des requêtes SQL en mode debug
    SQLALCHEMY_ECHO = DEBUG
    
    # Désactiver le suivi des modifications
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuration JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt_super_secret')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    
    # Autres configurations
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    
    # Définition des routes statiques (si nécessaire)
    STATIC_FOLDER = 'static'
    TEMPLATE_FOLDER = 'templates'
    
    # Configuration de sécurité
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = True
    REMEMBER_COOKIE_HTTPONLY = True
    
    # Configuration des uploads de fichiers
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # Limite de 16 Mo pour les uploads
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Configuration du logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')