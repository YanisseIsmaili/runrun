# api/app/routes/upload.py - Version DB avec compression
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from PIL import Image
import base64
import io
import uuid
from app import db
from app.models.user import User

upload_bp = Blueprint('upload', __name__)

# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
COMPRESSED_SIZE = (300, 300)  # Taille après compression

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def compress_and_encode_image(file):
    """Compresse l'image et la convertit en base64"""
    try:
        # Ouvrir l'image
        image = Image.open(file)
        
        # Convertir en RGB si nécessaire
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Redimensionner
        image.thumbnail(COMPRESSED_SIZE, Image.Resampling.LANCZOS)
        
        # Sauvegarder en mémoire
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)
        
        # Encoder en base64
        image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/jpeg;base64,{image_data}"
        
    except Exception as e:
        print(f"Erreur compression image: {e}")
        return None

@upload_bp.route('/profile-image', methods=['POST'])
@jwt_required()
def upload_profile_image():
    """Upload d'image de profil - stockage en DB"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé"
            }), 404
        
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
        
        # Compresser et encoder l'image
        compressed_image = compress_and_encode_image(file)
        
        if not compressed_image:
            return jsonify({
                "status": "error",
                "message": "Erreur lors du traitement de l'image"
            }), 500
        
        # Mettre à jour la DB avec l'image base64
        user.profile_picture = compressed_image
        user.updated_at = db.func.now()
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Image uploadée avec succès",
            "data": {
                "profile_picture": compressed_image,  # Image complète
                "size": len(compressed_image)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de l'upload",
            "error": str(e)
        }), 500

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
        
        # Nettoyer la DB
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