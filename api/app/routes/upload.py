# api/app/routes/upload.py - Nouvel endpoint pour upload images
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
import os
import uuid
from app import db
from app.models.user import User

upload_bp = Blueprint('upload', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads/profiles'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resize_image(image_path, max_size=(400, 400)):
    """Redimensionne l'image pour optimiser le stockage"""
    try:
        with Image.open(image_path) as img:
            # Convertir en RGB si nécessaire
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Redimensionner en gardant les proportions
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Sauvegarder avec compression
            img.save(image_path, 'JPEG', quality=85, optimize=True)
            
        return True
    except Exception as e:
        print(f"Erreur redimensionnement: {e}")
        return False

@upload_bp.route('/profile-image', methods=['POST'])
@jwt_required()
def upload_profile_image():
    """Upload d'image de profil"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé"
            }), 404
        
        # Vérifier qu'un fichier est présent
        if 'image' not in request.files:
            return jsonify({
                "status": "error",
                "message": "Aucun fichier fourni"
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                "status": "error",
                "message": "Nom de fichier vide"
            }), 400
        
        # Vérifier la taille
        if len(file.read()) > MAX_FILE_SIZE:
            return jsonify({
                "status": "error",
                "message": "Fichier trop volumineux (max 5MB)"
            }), 400
        
        file.seek(0)  # Reset après lecture taille
        
        # Vérifier l'extension
        if not allowed_file(file.filename):
            return jsonify({
                "status": "error",
                "message": "Format non supporté. Utilisez: PNG, JPG, JPEG, GIF, WEBP"
            }), 400
        
        # Créer le dossier si nécessaire
        upload_path = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        os.makedirs(upload_path, exist_ok=True)
        
        # Générer nom unique
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"user_{current_user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = os.path.join(upload_path, unique_filename)
        
        # Supprimer l'ancienne image si elle existe
        if user.profile_picture:
            old_path = os.path.join(current_app.root_path, user.profile_picture.lstrip('/'))
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    pass
        
        # Sauvegarder le fichier
        file.save(file_path)
        
        # Redimensionner l'image
        if not resize_image(file_path):
            os.remove(file_path)
            return jsonify({
                "status": "error",
                "message": "Erreur lors du traitement de l'image"
            }), 500
        
        # Mettre à jour la DB avec le chemin relatif
        relative_path = f"/{UPLOAD_FOLDER}/{unique_filename}"
        user.profile_picture = relative_path
        user.updated_at = db.func.now()
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Image uploadée avec succès",
            "data": {
                "profile_picture": relative_path,
                "url": f"/api/uploads/profiles/{unique_filename}"
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de l'upload",
            "error": str(e)
        }), 500

@upload_bp.route('/profiles/<filename>')
def serve_profile_image(filename):
    """Servir les images de profil"""
    try:
        upload_path = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        return send_from_directory(upload_path, filename)
    except FileNotFoundError:
        return jsonify({
            "status": "error",
            "message": "Image non trouvée"
        }), 404

@upload_bp.route('/profile-image', methods=['DELETE'])
@jwt_required()
def delete_profile_image():
    """Supprimer l'image de profil"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.profile_picture:
            return jsonify({
                "status": "error",
                "message": "Aucune image à supprimer"
            }), 404
        
        # Supprimer le fichier
        file_path = os.path.join(current_app.root_path, user.profile_picture.lstrip('/'))
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Mettre à jour la DB
        user.profile_picture = None
        user.updated_at = db.func.now()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Image supprimée avec succès"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la suppression",
            "error": str(e)
        }), 500

# Enregistrement dans app/__init__.py
# app.register_blueprint(upload_bp, url_prefix='/api/uploads')