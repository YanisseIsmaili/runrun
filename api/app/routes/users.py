# api/app/routes/users.py - Routes complètes pour la gestion des utilisateurs
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from app import db
from app.models.user import User
from app.models.run import Run
from app.utils.decorators import admin_required
from sqlalchemy import func, and_, desc, or_
from datetime import datetime, timedelta
from PIL import Image
import re
import csv
import io
import base64


# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
COMPRESSED_SIZE = (300, 300)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def compress_and_encode_image(file):
    """Compresse l'image et la convertit en base64"""
    try:
        image = Image.open(file)
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        image.thumbnail(COMPRESSED_SIZE, Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)
        image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/jpeg;base64,{image_data}"
    except Exception as e:
        print(f"Erreur compression image: {e}")
        return None



users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Récupère le profil de l'utilisateur connecté"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé",
                "errors": {"user": "Utilisateur inexistant"}
            }), 404
        
        return jsonify({
            "status": "success",
            "message": "Profil récupéré avec succès",
            "data": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la récupération du profil",
            "error": str(e)
        }), 500

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Met à jour le profil de l'utilisateur connecté"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé",
                "errors": {"user": "Utilisateur inexistant"}
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie",
                "errors": {"data": "Données requises"}
            }), 400
        
        # Mise à jour des champs modifiables
        updatable_fields = ['first_name', 'last_name', 'date_of_birth', 'height', 'weight']
        for field in updatable_fields:
            if field in data:
                if field in ['height', 'weight'] and data[field]:
                    try:
                        value = float(data[field])
                        if value <= 0:
                            raise ValueError()
                        setattr(user, field, value)
                    except (ValueError, TypeError):
                        return jsonify({
                            "status": "error",
                            "message": f"{field} invalide"
                        }), 400
                else:
                    setattr(user, field, data[field])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Profil mis à jour avec succès",
            "data": user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la mise à jour",
            "error": str(e)
        }), 500

@users_bp.route('', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Récupère tous les utilisateurs avec pagination et filtres"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '', type=str)
        status = request.args.get('status', '', type=str)
        role = request.args.get('role', '', type=str)
        sort_by = request.args.get('sort_by', 'created_at', type=str)
        sort_order = request.args.get('sort_order', 'desc', type=str)
        
        # Valider les paramètres de tri
        valid_sort_fields = ['username', 'email', 'created_at', 'last_login', 'first_name', 'last_name']
        if sort_by not in valid_sort_fields:
            sort_by = 'created_at'
        
        query = User.query
        
        # Filtres de recherche
        if search:
            search_filter = or_(
                User.username.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%'),
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Filtre par statut
        if status:
            if status == 'active':
                query = query.filter(User.is_active == True)
            elif status == 'inactive':
                query = query.filter(User.is_active == False)
        
        # Filtre par rôle
        if role:
            if role == 'admin':
                query = query.filter(User.is_admin == True)
            elif role == 'user':
                query = query.filter(User.is_admin == False)
        
        # Tri
        if sort_order == 'desc':
            query = query.order_by(desc(getattr(User, sort_by)))
        else:
            query = query.order_by(getattr(User, sort_by))
        
        # Pagination
        users = query.paginate(
            page=page, 
            per_page=limit, 
            error_out=False
        )
        
        # Enrichir les données utilisateur avec les statistiques
        enriched_users = []
        for user in users.items:
            user_dict = user.to_dict()
            
            # Ajouter les statistiques de course
            run_stats = db.session.query(
                func.count(Run.id).label('total_runs'),
                func.sum(Run.distance).label('total_distance'),
                func.avg(Run.duration).label('avg_duration')
            ).filter(Run.user_id == user.id).first()
            
            user_dict['stats'] = {
                'total_runs': run_stats.total_runs or 0,
                'total_distance': float(run_stats.total_distance or 0),
                'avg_duration': float(run_stats.avg_duration or 0)
            }
            
            enriched_users.append(user_dict)
        
        return jsonify({
            "status": "success",
            "data": {
                "users": enriched_users,
                "pagination": {
                    "page": page,
                    "pages": users.pages,
                    "per_page": limit,
                    "total": users.total
                },
                "filters": {
                    "search": search,
                    "status": status,
                    "role": role,
                    "sort_by": sort_by,
                    "sort_order": sort_order
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la récupération des utilisateurs",
            "error": str(e)
        }), 500

@users_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_user():
    """Crée un nouvel utilisateur"""
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
        
        # Validation de la confirmation du mot de passe
        if data.get('password') != data.get('confirm_password'):
            errors['confirm_password'] = "Les mots de passe ne correspondent pas"
        
        # Validation des champs numériques
        if data.get('height'):
            try:
                height = float(data['height'])
                if height <= 0 or height > 300:
                    errors['height'] = "Taille invalide (0-300 cm)"
            except (ValueError, TypeError):
                errors['height'] = "Taille invalide"
        
        if data.get('weight'):
            try:
                weight = float(data['weight'])
                if weight <= 0 or weight > 500:
                    errors['weight'] = "Poids invalide (0-500 kg)"
            except (ValueError, TypeError):
                errors['weight'] = "Poids invalide"
        
        # Vérifier l'unicité
        if User.query.filter_by(username=data.get('username', '').strip()).first():
            errors['username'] = "Ce nom d'utilisateur existe déjà"
        
        if User.query.filter_by(email=data.get('email', '').strip().lower()).first():
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
            password_hash=generate_password_hash(data['password']),
            first_name=data.get('first_name', '').strip(),
            last_name=data.get('last_name', '').strip(),
            date_of_birth=data.get('date_of_birth'),
            height=float(data['height']) if data.get('height') else None,
            weight=float(data['weight']) if data.get('weight') else None,
            is_admin=bool(data.get('is_admin', False)),
            is_active=True
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Utilisateur créé avec succès",
            "data": user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la création de l'utilisateur",
            "error": str(e)
        }), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    """Récupère un utilisateur spécifique avec ses statistiques"""
    try:
        user = User.query.get_or_404(user_id)
        user_dict = user.to_dict()
        
        # Statistiques détaillées
        run_stats = db.session.query(
            func.count(Run.id).label('total_runs'),
            func.sum(Run.distance).label('total_distance'),
            func.avg(Run.duration).label('avg_duration'),
            func.min(Run.duration).label('best_time'),
            func.max(Run.duration).label('worst_time'),
            func.avg(Run.avg_speed).label('avg_speed')
        ).filter(Run.user_id == user_id).first()
        
        # Courses récentes
        recent_runs = Run.query.filter_by(user_id=user_id).order_by(
            desc(Run.start_time)
        ).limit(5).all()
        
        # Statistiques par mois (derniers 6 mois)
        six_months_ago = datetime.now() - timedelta(days=180)
        monthly_stats = db.session.query(
            func.year(Run.start_time).label('year'),
            func.month(Run.start_time).label('month'),
            func.count(Run.id).label('runs_count'),
            func.sum(Run.distance).label('distance'),
            func.avg(Run.duration).label('avg_duration')
        ).filter(
            and_(
                Run.user_id == user_id,
                Run.start_time >= six_months_ago
            )
        ).group_by(
            func.year(Run.start_time),
            func.month(Run.start_time)
        ).all()
        
        user_dict['detailed_stats'] = {
            'general': {
                'total_runs': run_stats.total_runs or 0,
                'total_distance': float(run_stats.total_distance or 0),
                'avg_duration': float(run_stats.avg_duration or 0),
                'best_time': float(run_stats.best_time or 0),
                'worst_time': float(run_stats.worst_time or 0),
                'avg_speed': float(run_stats.avg_speed or 0)
            },
            'recent_runs': [run.to_dict() for run in recent_runs],
            'monthly': [
                {
                    'year': stat.year,
                    'month': stat.month,
                    'runs_count': stat.runs_count,
                    'distance': float(stat.distance or 0),
                    'avg_duration': float(stat.avg_duration or 0)
                } for stat in monthly_stats
            ]
        }
        
        return jsonify({
            "status": "success",
            "data": user_dict
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Utilisateur non trouvé",
            "error": str(e)
        }), 404

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Met à jour un utilisateur"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie"
            }), 400
        
        errors = {}
        
        # Validation de l'email si modifié
        if 'email' in data and data['email'] != user.email:
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, data['email']):
                errors['email'] = "Format d'email invalide"
            elif User.query.filter(User.email == data['email'], User.id != user_id).first():
                errors['email'] = "Cet email existe déjà"
        
        # Validation du nom d'utilisateur si modifié
        if 'username' in data and data['username'] != user.username:
            if User.query.filter(User.username == data['username'], User.id != user_id).first():
                errors['username'] = "Ce nom d'utilisateur existe déjà"
        
        # Validation du mot de passe si fourni
        if data.get('password'):
            if len(data['password']) < 6:
                errors['password'] = "Le mot de passe doit contenir au moins 6 caractères"
            elif data['password'] != data.get('confirm_password'):
                errors['confirm_password'] = "Les mots de passe ne correspondent pas"
        
        # Validation des champs numériques
        if 'height' in data and data['height']:
            try:
                height = float(data['height'])
                if height <= 0 or height > 300:
                    errors['height'] = "Taille invalide (0-300 cm)"
            except (ValueError, TypeError):
                errors['height'] = "Taille invalide"
        
        if 'weight' in data and data['weight']:
            try:
                weight = float(data['weight'])
                if weight <= 0 or weight > 500:
                    errors['weight'] = "Poids invalide (0-500 kg)"
            except (ValueError, TypeError):
                errors['weight'] = "Poids invalide"
        
        if errors:
            return jsonify({
                "status": "error",
                "message": "Erreurs de validation",
                "errors": errors
            }), 400
        
        # Mise à jour des champs
        updatable_fields = ['username', 'email', 'first_name', 'last_name', 
                           'date_of_birth', 'height', 'weight', 'is_admin', 'is_active']
        
        for field in updatable_fields:
            if field in data:
                if field == 'email':
                    setattr(user, field, data[field].strip().lower())
                elif field == 'username':
                    setattr(user, field, data[field].strip())
                elif field in ['height', 'weight']:
                    if data[field]:
                        setattr(user, field, float(data[field]))
                    else:
                        setattr(user, field, None)
                else:
                    setattr(user, field, data[field])
        
        # Mise à jour du mot de passe si fourni
        if data.get('password'):
            user.password_hash = generate_password_hash(data['password'])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Utilisateur mis à jour avec succès",
            "data": user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la mise à jour",
            "error": str(e)
        }), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Supprime un utilisateur"""
    try:
        current_user_id = get_jwt_identity()
        
        # Empêcher l'auto-suppression
        if user_id == current_user_id:
            return jsonify({
                "status": "error",
                "message": "Vous ne pouvez pas vous supprimer vous-même"
            }), 400
        
        user = User.query.get_or_404(user_id)
        
        # Vérifier qu'on ne supprime pas le dernier admin
        if user.is_admin:
            admin_count = User.query.filter_by(is_admin=True).count()
            if admin_count <= 1:
                return jsonify({
                    "status": "error",
                    "message": "Impossible de supprimer le dernier administrateur"
                }), 400
        
        # Vérifier s'il y a des courses en cours
        active_runs = Run.query.filter_by(
            user_id=user_id, 
            status='in_progress'
        ).count()
        
        if active_runs > 0:
            return jsonify({
                "status": "error",
                "message": f"Impossible de supprimer : l'utilisateur a {active_runs} course(s) en cours"
            }), 400
        
        # Compter les courses terminées
        total_runs = Run.query.filter_by(user_id=user_id).count()
        
        if total_runs > 0:
            # Option : désactiver au lieu de supprimer pour préserver l'historique
            user.is_active = False
            user.email = f"deleted_{user_id}_{user.email}"
            user.username = f"deleted_{user_id}_{user.username}"
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": f"Utilisateur désactivé (avait {total_runs} courses)"
            }), 200
        else:
            # Suppression définitive si aucune course
            db.session.delete(user)
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": "Utilisateur supprimé avec succès"
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la suppression",
            "error": str(e)
        }), 500

@users_bp.route('/export', methods=['GET'])
@jwt_required()
@admin_required
def export_users():
    """Exporte la liste des utilisateurs en CSV"""
    try:
        users = User.query.all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # En-têtes
        writer.writerow([
            'ID', 'Nom d\'utilisateur', 'Email', 'Prénom', 'Nom', 
            'Admin', 'Actif', 'Créé le'
        ])
        
        # Données
        for user in users:
            writer.writerow([
                user.id,
                user.username,
                user.email,
                user.first_name or '',
                user.last_name or '',
                'Oui' if user.is_admin else 'Non',
                'Oui' if user.is_active else 'Non',
                user.created_at.strftime('%Y-%m-%d %H:%M')
            ])
        
        output.seek(0)
        
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv; charset=utf-8'
        response.headers['Content-Disposition'] = f'attachment; filename=users_{datetime.now().strftime("%Y%m%d_%H%M")}.csv'
        
        return response
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de l'export",
            "error": str(e)
        }), 500


@users_bp.route('/<int:user_id>/upload-profile-image', methods=['POST'])
@jwt_required()
@admin_required
def upload_user_profile_image(user_id):
    """Upload d'image de profil pour un utilisateur spécifique (admin seulement)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"status": "error", "message": "Utilisateur non trouvé"}), 404
        
        if 'image' not in request.files:
            return jsonify({"status": "error", "message": "Aucun fichier fourni"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"status": "error", "message": "Nom de fichier vide"}), 400
        
        file_content = file.read()
        if len(file_content) > MAX_FILE_SIZE:
            return jsonify({"status": "error", "message": "Fichier trop volumineux (max 5MB)"}), 400
        
        file.seek(0)
        if not allowed_file(file.filename):
            return jsonify({"status": "error", "message": "Format non supporté. Utilisez: PNG, JPG, JPEG, GIF, WEBP"}), 400
        
        compressed_image = compress_and_encode_image(file)
        if not compressed_image:
            return jsonify({"status": "error", "message": "Erreur lors du traitement de l'image"}), 500
        
        user.profile_picture = compressed_image
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Image uploadée avec succès",
            "data": {"profile_picture": compressed_image, "size": len(compressed_image), "user_id": user_id}
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Erreur lors de l'upload", "error": str(e)}), 500

@users_bp.route('/<int:user_id>/upload-profile-image', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user_profile_image(user_id):
    """Supprimer l'image de profil d'un utilisateur spécifique (admin seulement)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"status": "error", "message": "Utilisateur non trouvé"}), 404
        
        if not user.profile_picture:
            return jsonify({"status": "error", "message": "Aucune image à supprimer"}), 404
        
        user.profile_picture = None
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"status": "success", "message": "Image supprimée avec succès", "data": {"user_id": user_id}}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Erreur lors de la suppression", "error": str(e)}), 500