# Fichier: app/routes/admin.py
from flask import Blueprint, jsonify, request
from app import db
from app.models.user import User
from app.models.run import Run
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.decorators import admin_required, super_admin_required
from sqlalchemy import func
import datetime

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    # Paramètres de pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Récupérer les utilisateurs avec pagination
    users_query = User.query
    users_pagination = users_query.paginate(page=page, per_page=per_page, error_out=False)
    
    users = [user.to_dict() for user in users_pagination.items]
    
    return jsonify({
        "status": "success",
        "message": "Liste des utilisateurs récupérée",
        "data": {
            "users": users,
            "total": users_pagination.total,
            "pages": users_pagination.pages,
            "current_page": page
        }
    }), 200

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_global_stats():
    try:
        total_users = User.query.count()
        total_runs = Run.query.count()
        total_distance = db.session.query(func.sum(Run.distance)).scalar() or 0
        
        # Nouveaux utilisateurs ce mois
        current_month_start = datetime.datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_this_month = User.query.filter(User.created_at >= current_month_start).count()
        
        # Courses ce mois
        runs_this_month = Run.query.filter(Run.created_at >= current_month_start).count()
        distance_this_month = db.session.query(func.sum(Run.distance)).filter(Run.created_at >= current_month_start).scalar() or 0
        
        # Calculer l'allure moyenne (en min/km)
        total_duration = db.session.query(func.sum(Run.duration)).scalar() or 0
        if total_distance > 0:
            avg_pace_seconds = (total_duration / total_distance) * 1000  # secondes par km
            avg_pace_minutes = avg_pace_seconds / 60  # minutes par km
            avg_pace_minutes_int = int(avg_pace_minutes)
            avg_pace_seconds_int = int((avg_pace_minutes - avg_pace_minutes_int) * 60)
            avg_pace = f"{avg_pace_minutes_int}:{avg_pace_seconds_int:02d}"
        else:
            avg_pace = "0:00"
        
        # Utilisateurs actifs (ayant au moins une course)
        active_users = db.session.query(func.count(func.distinct(Run.user_id))).scalar() or 0
        
        return jsonify({
            "status": "success",
            "message": "Statistiques globales",
            "data": {
                "total_users": total_users,
                "active_users": active_users,
                "total_runs": total_runs,
                "total_distance": total_distance,
                "average_pace": avg_pace,
                "new_users_this_month": new_users_this_month,
                "runs_this_month": runs_this_month,
                "distance_this_month": distance_this_month
            }
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des statistiques: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@admin_bp.route('/user-activity', methods=['GET'])
@jwt_required()
@admin_required
def get_user_activity():
    try:
        # Récupérer les courses les plus récentes avec les informations utilisateur
        recent_runs = (
            db.session.query(Run, User)
            .join(User, Run.user_id == User.id)
            .order_by(Run.created_at.desc())
            .limit(10)
            .all()
        )
        
        activity_data = []
        for run, user in recent_runs:
            activity_data.append({
                "id": run.id,
                "user": {
                    "id": user.id,
                    "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
                },
                "type": "run",
                "distance": run.distance,
                "duration": run.duration,
                "date": run.start_time.isoformat() if run.start_time else run.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "message": "Activité des utilisateurs récupérée",
            "data": activity_data
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération de l'activité: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user_details(user_id):
    try:
        user = User.query.get_or_404(user_id)
        user_stats = {
            "total_runs": Run.query.filter_by(user_id=user_id).count(),
            "total_distance": db.session.query(func.sum(Run.distance)).filter(Run.user_id == user_id).scalar() or 0,
            "last_active": db.session.query(func.max(Run.created_at)).filter(Run.user_id == user_id).scalar()
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
            "message": f"Erreur lors de la récupération des détails de l'utilisateur: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['PUT'])
@jwt_required()
@super_admin_required
def toggle_admin_status(user_id):
    try:
        user = User.query.get_or_404(user_id)
        
        # Empêcher de modifier son propre statut
        current_user_id = get_jwt_identity()
        if current_user_id == user_id:
            return jsonify({
                "status": "error",
                "message": "Impossible de modifier votre propre statut d'administrateur",
                "errors": {"auth": "Opération non autorisée"}
            }), 403
        
        user.is_admin = not user.is_admin
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Statut administrateur modifié pour {user.username}",
            "data": {
                "user": user.to_dict()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la modification du statut administrateur: {str(e)}",
            "errors": {"server": str(e)}
        }), 500