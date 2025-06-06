# api/app/routes/users.py - Routes complètes pour la gestion des utilisateurs
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.run import Run
from app.utils.decorators import admin_required
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import re

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Récupère le profil de l'utilisateur connecté"""
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

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Met à jour le profil de l'utilisateur connecté"""
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
    
    try:
        # Mise à jour des champs modifiables
        updatable_fields = ['first_name', 'last_name', 'date_of_birth', 'height', 'weight']
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
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
            "message": f"Erreur lors de la mise à jour du profil: {str(e)}",
            "errors": {"database": str(e)}
        }), 500

@users_bp.route('', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Récupère tous les utilisateurs avec pagination et filtres"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        sort_field = request.args.get('sort_field', 'created_at', type=str)
        sort_direction = request.args.get('sort_direction', 'desc', type=str)
        
        # Construction de la requête
        query = User.query
        
        # Filtre de recherche
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.like(search_pattern),
                    User.email.like(search_pattern),
                    User.first_name.like(search_pattern),
                    User.last_name.like(search_pattern)
                )
            )
        
        # Tri
        if hasattr(User, sort_field):
            order_column = getattr(User, sort_field)
            if sort_direction.lower() == 'desc':
                order_column = order_column.desc()
            query = query.order_by(order_column)
        
        # Pagination
        users_pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Enrichir les données utilisateur avec les statistiques
        users_data = []
        for user in users_pagination.items:
            user_dict = user.to_dict()
            
            # Ajouter les statistiques de courses
            total_runs = Run.query.filter_by(user_id=user.id).count()
            total_distance = db.session.query(func.sum(Run.distance)).filter(Run.user_id == user.id).scalar() or 0
            
            # Dernière activité
            last_run = Run.query.filter_by(user_id=user.id).order_by(Run.created_at.desc()).first()
            last_activity = last_run.created_at if last_run else user.created_at
            
            # Calcul de l'allure moyenne
            if total_runs > 0:
                avg_duration = db.session.query(func.avg(Run.duration)).filter(Run.user_id == user.id).scalar() or 0
                avg_distance = total_distance / total_runs if total_runs > 0 else 0
                if avg_duration > 0 and avg_distance > 0:
                    pace_seconds = (avg_duration / (avg_distance / 1000))
                    pace_minutes = pace_seconds / 60
                    avg_pace = f"{int(pace_minutes)}:{int((pace_minutes % 1) * 60):02d}"
                else:
                    avg_pace = "0:00"
            else:
                avg_pace = "0:00"
            
            user_dict.update({
                'total_runs': total_runs,
                'total_distance': float(total_distance / 1000) if total_distance else 0,  # en km
                'avg_pace': avg_pace,
                'last_activity': last_activity.isoformat()
            })
            
            users_data.append(user_dict)
        
        return jsonify({
            "status": "success",
            "message": "Liste des utilisateurs récupérée",
            "data": {
                "users": users_data,
                "total": users_pagination.total,
                "pages": users_pagination.pages,
                "current_page": page,
                "per_page": per_page
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des utilisateurs: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user_details(user_id):
    """Récupère les détails d'un utilisateur spécifique"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé",
                "errors": {"user": "Utilisateur inexistant"}
            }), 404
        
        # Statistiques détaillées de l'utilisateur
        total_runs = Run.query.filter_by(user_id=user_id).count()
        total_distance = db.session.query(func.sum(Run.distance)).filter(Run.user_id == user_id).scalar() or 0
        total_duration = db.session.query(func.sum(Run.duration)).filter(Run.user_id == user_id).scalar() or 0
        
        # Courses récentes (10 dernières)
        recent_runs = Run.query.filter_by(user_id=user_id).order_by(Run.created_at.desc()).limit(10).all()
        recent_runs_data = [run.to_dict() for run in recent_runs]
        
        # Activité du mois en cours
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_runs = Run.query.filter(
            and_(
                Run.user_id == user_id,
                Run.created_at >= current_month_start
            )
        ).count()
        
        month_distance = db.session.query(func.sum(Run.distance)).filter(
            and_(
                Run.user_id == user_id,
                Run.created_at >= current_month_start
            )
        ).scalar() or 0
        
        user_stats = {
            "total_runs": total_runs,
            "total_distance": float(total_distance / 1000) if total_distance else 0,  # en km
            "total_duration": total_duration,
            "current_month": {
                "runs": month_runs,
                "distance": float(month_distance / 1000) if month_distance else 0
            },
            "recent_runs": recent_runs_data
        }
        
        return jsonify({
            "status": "success",
            "message": f"Détails de l'utilisateur {user.username}",
            "data": {
                "user": user.to_dict(),
                "stats": user_stats
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des détails: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@users_bp.route('/<int:user_id>/runs', methods=['GET'])
@jwt_required()
@admin_required
def get_user_runs(user_id):
    """Récupère les courses d'un utilisateur spécifique"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé",
                "errors": {"user": "Utilisateur inexistant"}
            }), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        runs_pagination = Run.query.filter_by(user_id=user_id).order_by(
            Run.start_time.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        runs_data = [run.to_dict() for run in runs_pagination.items]
        
        return jsonify({
            "status": "success",
            "message": f"Courses de {user.username} récupérées",
            "data": {
                "runs": runs_data,
                "total": runs_pagination.total,
                "pages": runs_pagination.pages,
                "current_page": page
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des courses: {str(e)}",
            "errors": {"server": str(e)}
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
                "message": "Données JSON manquantes",
                "errors": {"data": "Données requises"}
            }), 400
        
        # Validation des champs requis
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "status": "error",
                    "message": f"Le champ '{field}' est requis",
                    "errors": {field: "Champ requis"}
                }), 400
        
        # Validation du format email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({
                "status": "error",
                "message": "Format d'email invalide",
                "errors": {"email": "Format invalide"}
            }), 400
        
        # Vérifier l'unicité du username et email
        existing_user = User.query.filter(
            db.or_(User.username == data['username'], User.email == data['email'])
        ).first()
        
        if existing_user:
            return jsonify({
                "status": "error",
                "message": "Nom d'utilisateur ou email déjà utilisé",
                "errors": {"unique": "Données déjà existantes"}
            }), 400
        
        # Création du nouvel utilisateur
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            date_of_birth=data.get('date_of_birth'),
            height=data.get('height'),
            weight=data.get('weight'),
            is_admin=data.get('is_admin', False)
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Utilisateur créé avec succès",
            "data": new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la création de l'utilisateur: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Met à jour un utilisateur"""
    try:
        user = User.query.get(user_id)
        
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
                "message": "Données JSON manquantes",
                "errors": {"data": "Données requises"}
            }), 400
        
        # Champs modifiables
        updatable_fields = ['first_name', 'last_name', 'email', 'date_of_birth', 
                           'height', 'weight', 'is_admin']
        
        # Vérifier l'unicité de l'email si modifié
        if 'email' in data and data['email'] != user.email:
            existing_email = User.query.filter_by(email=data['email']).first()
            if existing_email:
                return jsonify({
                    "status": "error",
                    "message": "Email déjà utilisé",
                    "errors": {"email": "Email déjà existant"}
                }), 400
        
        # Mise à jour des champs
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
        # Mise à jour du mot de passe si fourni
        if 'password' in data and data['password']:
            user.password = data['password']
        
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
            "message": f"Erreur lors de la mise à jour: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Supprime un utilisateur"""
    try:
        current_user_id = get_jwt_identity()
        
        # Empêcher l'auto-suppression
        if current_user_id == user_id:
            return jsonify({
                "status": "error",
                "message": "Impossible de supprimer votre propre compte",
                "errors": {"user": "Auto-suppression interdite"}
            }), 400
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé",
                "errors": {"user": "Utilisateur inexistant"}
            }), 404
        
        # Vérifier s'il y a des courses actives
        active_runs = Run.query.filter(
            and_(
                Run.user_id == user_id,
                Run.end_time.is_(None)
            )
        ).count()
        
        if active_runs > 0:
            return jsonify({
                "status": "error",
                "message": "Impossible de supprimer un utilisateur avec des courses actives",
                "errors": {"user": f"{active_runs} course(s) active(s)"}
            }), 400
        
        username = user.username
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Utilisateur {username} supprimé avec succès",
            "data": {}
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la suppression: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@users_bp.route('/<int:user_id>/stats', methods=['GET'])
@jwt_required()
def get_user_stats(user_id):
    """Récupère les statistiques détaillées d'un utilisateur"""
    try:
        # Vérifier les permissions
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Seul l'utilisateur lui-même ou un admin peut voir ces stats
        if current_user_id != user_id and not current_user.is_admin:
            return jsonify({
                "status": "error",
                "message": "Accès refusé",
                "errors": {"auth": "Permissions insuffisantes"}
            }), 403
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "Utilisateur non trouvé",
                "errors": {"user": "Utilisateur inexistant"}
            }), 404
        
        # Statistiques générales
        total_runs = Run.query.filter_by(user_id=user_id).count()
        total_distance = db.session.query(func.sum(Run.distance)).filter(Run.user_id == user_id).scalar() or 0
        total_duration = db.session.query(func.sum(Run.duration)).filter(Run.user_id == user_id).scalar() or 0
        
        # Statistiques hebdomadaires (7 derniers jours)
        week_ago = datetime.utcnow() - timedelta(days=7)
        weekly_stats = []
        
        for i in range(7):
            day = week_ago + timedelta(days=i)
            next_day = day + timedelta(days=1)
            
            day_runs = Run.query.filter(
                and_(
                    Run.user_id == user_id,
                    Run.start_time >= day,
                    Run.start_time < next_day
                )
            ).all()
            
            day_distance = sum(run.distance for run in day_runs if run.distance) or 0
            day_duration = sum(run.duration for run in day_runs if run.duration) or 0
            
            weekly_stats.append({
                'date': day.strftime('%Y-%m-%d'),
                'day_name': day.strftime('%A'),
                'runs': len(day_runs),
                'distance': float(day_distance / 1000) if day_distance else 0,
                'duration': day_duration
            })
        
        # Statistiques mensuelles (6 derniers mois)
        monthly_stats = []
        for i in range(6):
            month_start = datetime.utcnow().replace(day=1) - timedelta(days=i*30)
            month_start = month_start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if month_start.month == 12:
                next_month = month_start.replace(year=month_start.year + 1, month=1)
            else:
                next_month = month_start.replace(month=month_start.month + 1)
            
            month_runs = Run.query.filter(
                and_(
                    Run.user_id == user_id,
                    Run.start_time >= month_start,
                    Run.start_time < next_month
                )
            ).all()
            
            month_distance = sum(run.distance for run in month_runs if run.distance) or 0
            month_duration = sum(run.duration for run in month_runs if run.duration) or 0
            
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'month_name': month_start.strftime('%B %Y'),
                'runs': len(month_runs),
                'distance': float(month_distance / 1000) if month_distance else 0,
                'duration': month_duration
            })
        
        monthly_stats.reverse()  # Plus ancien en premier
        
        stats = {
            "user_info": user.to_dict(),
            "overall": {
                "total_runs": total_runs,
                "total_distance": float(total_distance / 1000) if total_distance else 0,
                "total_duration": total_duration,
                "average_distance": float(total_distance / total_runs / 1000) if total_runs > 0 else 0,
                "average_duration": total_duration // total_runs if total_runs > 0 else 0
            },
            "weekly": weekly_stats,
            "monthly": monthly_stats
        }
        
        return jsonify({
            "status": "success",
            "message": "Statistiques utilisateur récupérées",
            "data": stats
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des statistiques: {str(e)}",
            "errors": {"server": str(e)}
        }), 500