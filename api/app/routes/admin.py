# Dans app/routes/admin.py
from flask import Blueprint, jsonify, request
from app import db
from app.models.user import User
from app.models.run import Run
from flask_jwt_extended import jwt_required
from app.utils.decorators import admin_required, super_admin_required
from sqlalchemy import func
import datetime

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    users = User.query.all()
    return jsonify({
        "status": "success",
        "message": "Liste des utilisateurs récupérée",
        "data": {
            "users": [user.to_dict() for user in users]
        }
    }), 200

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_global_stats():
    total_users = User.query.count()
    total_runs = Run.query.count()
    total_distance = db.session.query(func.sum(Run.distance)).scalar() or 0
    
    # Nouveaux utilisateurs ce mois
    current_month_start = datetime.datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_this_month = User.query.filter(User.created_at >= current_month_start).count()
    
    # Courses ce mois
    runs_this_month = Run.query.filter(Run.created_at >= current_month_start).count()
    
    return jsonify({
        "status": "success",
        "message": "Statistiques globales",
        "data": {
            "total_users": total_users,
            "total_runs": total_runs,
            "total_distance": total_distance,
            "new_users_this_month": new_users_this_month,
            "runs_this_month": runs_this_month
        }
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user_details(user_id):
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

@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['PUT'])
@jwt_required()
@super_admin_required
def toggle_admin_status(user_id):
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