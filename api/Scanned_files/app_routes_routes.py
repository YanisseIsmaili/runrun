# api/app/routes/routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.route import Route
from app.models.run import Run
from app.models.user import User
from app.utils.decorators import admin_required
from sqlalchemy import and_, func
from datetime import datetime

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('', methods=['GET'])
@jwt_required()
def get_routes():
    """Récupère la liste des itinéraires avec pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status_filter = request.args.get('status', None)
        
        # Construction de la requête
        query = Route.query
        
        # Filtre par statut si spécifié
        if status_filter:
            query = query.filter(Route.status == status_filter)
        
        # Pagination
        routes_pagination = query.order_by(Route.created_at.desc()).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Conversion en dictionnaire
        routes_data = [route.to_dict_summary() for route in routes_pagination.items]
        
        return jsonify({
            "status": "success",
            "message": "Liste des itinéraires récupérée",
            "data": {
                "routes": routes_data,
                "total": routes_pagination.total,
                "pages": routes_pagination.pages,
                "current_page": page
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des itinéraires: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@routes_bp.route('/<int:route_id>', methods=['GET'])
@jwt_required()
def get_route(route_id):
    """Récupère les détails d'un itinéraire spécifique"""
    try:
        route = Route.query.get(route_id)
        
        if not route:
            return jsonify({
                "status": "error",
                "message": "Itinéraire non trouvé",
                "errors": {"route": "Itinéraire inexistant"}
            }), 404
        
        return jsonify({
            "status": "success",
            "message": "Détails de l'itinéraire récupérés",
            "data": route.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération de l'itinéraire: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@routes_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_route():
    """Crée un nouvel itinéraire"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Données JSON manquantes",
                "errors": {"data": "Données requises"}
            }), 400
        
        # Validation des champs requis
        required_fields = ['name', 'distance', 'difficulty']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "status": "error",
                    "message": f"Le champ '{field}' est requis",
                    "errors": {field: "Champ requis"}
                }), 400
        
        # Création du nouvel itinéraire
        new_route = Route(
            name=data['name'],
            description=data.get('description', ''),
            distance=float(data['distance']),
            estimated_duration=data.get('estimated_duration'),
            difficulty=data['difficulty'],
            status=data.get('status', 'active'),
            elevation_gain=data.get('elevation_gain'),
            created_by=current_user_id
        )
        
        # Ajout des points de passage si fournis
        if 'waypoints' in data:
            new_route.waypoints = data['waypoints']
        
        db.session.add(new_route)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Itinéraire créé avec succès",
            "data": new_route.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({
            "status": "error",
            "message": "Données invalides",
            "errors": {"validation": str(e)}
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la création de l'itinéraire: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@routes_bp.route('/<int:route_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_route(route_id):
    """Met à jour un itinéraire"""
    try:
        route = Route.query.get(route_id)
        
        if not route:
            return jsonify({
                "status": "error",
                "message": "Itinéraire non trouvé",
                "errors": {"route": "Itinéraire inexistant"}
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Données JSON manquantes",
                "errors": {"data": "Données requises"}
            }), 400
        
        # Mise à jour des champs modifiables
        updatable_fields = ['name', 'description', 'distance', 'estimated_duration', 
                           'difficulty', 'status', 'elevation_gain', 'waypoints']
        
        for field in updatable_fields:
            if field in data:
                if field == 'waypoints':
                    route.waypoints = data[field]
                else:
                    setattr(route, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Itinéraire mis à jour avec succès",
            "data": route.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la mise à jour de l'itinéraire: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@routes_bp.route('/<int:route_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_route(route_id):
    """Supprime un itinéraire"""
    try:
        route = Route.query.get(route_id)
        
        if not route:
            return jsonify({
                "status": "error",
                "message": "Itinéraire non trouvé",
                "errors": {"route": "Itinéraire inexistant"}
            }), 404
        
        # Vérifier s'il y a des courses actives sur cet itinéraire
        active_runs = Run.query.filter(
            and_(
                Run.route_id == route_id,
                Run.end_time.is_(None)
            )
        ).count()
        
        if active_runs > 0:
            return jsonify({
                "status": "error",
                "message": "Impossible de supprimer un itinéraire avec des courses actives",
                "errors": {"route": f"{active_runs} course(s) active(s) sur cet itinéraire"}
            }), 400
        
        db.session.delete(route)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Itinéraire supprimé avec succès",
            "data": {}
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la suppression de l'itinéraire: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@routes_bp.route('/<int:route_id>/toggle-status', methods=['PATCH'])
@jwt_required()
@admin_required
def toggle_route_status(route_id):
    """Change le statut d'un itinéraire (actif/inactif)"""
    try:
        route = Route.query.get(route_id)
        
        if not route:
            return jsonify({
                "status": "error",
                "message": "Itinéraire non trouvé",
                "errors": {"route": "Itinéraire inexistant"}
            }), 404
        
        # Basculer le statut
        route.status = 'inactive' if route.status == 'active' else 'active'
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Statut de l'itinéraire changé en '{route.status}'",
            "data": {"new_status": route.status}
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Erreur lors du changement de statut: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@routes_bp.route('/active-runs', methods=['GET'])
@jwt_required()
def get_active_runs():
    """Récupère la liste des courses actuellement actives"""
    try:
        # Récupérer les courses actives avec les informations des utilisateurs et itinéraires
        active_runs = db.session.query(Run, User, Route).join(
            User, Run.user_id == User.id
        ).join(
            Route, Run.route_id == Route.id
        ).filter(
            Run.end_time.is_(None)  # Courses non terminées
        ).order_by(Run.start_time.desc()).all()
        
        runs_data = []
        for run, user, route in active_runs:
            # Calculer la progression
            elapsed_time = (datetime.utcnow() - run.start_time).total_seconds() if run.start_time else 0
            
            # Estimation de la distance parcourue (très simplifiée)
            estimated_speed = 3.5  # m/s environ
            distance_covered = (elapsed_time * estimated_speed) / 1000  # en km
            distance_covered = min(distance_covered, route.distance)  # Ne pas dépasser la distance totale
            
            # Temps restant estimé
            if distance_covered > 0 and route.distance > distance_covered:
                remaining_distance = route.distance - distance_covered
                estimated_remaining = (remaining_distance / estimated_speed) / 60  # en minutes
            else:
                estimated_remaining = 0
            
            # Calcul de l'allure (très approximatif)
            if distance_covered > 0 and elapsed_time > 0:
                pace_seconds = (elapsed_time / (distance_covered * 1000)) * 1000  # sec/km
                pace_minutes = pace_seconds / 60
                avg_pace = f"{int(pace_minutes)}:{int((pace_minutes % 1) * 60):02d}"
            else:
                avg_pace = "0:00"
            
            runs_data.append({
                "id": run.id,
                "user": {
                    "id": user.id,
                    "name": f"{user.first_name} {user.last_name}".strip() or user.username
                },
                "route_id": route.id,
                "route_name": route.name,
                "start_time": run.start_time.isoformat() if run.start_time else None,
                "distance_covered": round(distance_covered, 1),
                "estimated_remaining": int(estimated_remaining),
                "status": "running",  # Toutes les courses sans end_time sont considérées comme "running"
                "avg_pace": avg_pace
            })
        
        return jsonify({
            "status": "success",
            "message": "Courses actives récupérées",
            "data": runs_data
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des courses actives: {str(e)}",
            "errors": {"server": str(e)}
        }), 500

@routes_bp.route('/<int:route_id>/stats', methods=['GET'])
@jwt_required()
def get_route_stats(route_id):
    """Récupère les statistiques d'un itinéraire"""
    try:
        route = Route.query.get(route_id)
        
        if not route:
            return jsonify({
                "status": "error",
                "message": "Itinéraire non trouvé",
                "errors": {"route": "Itinéraire inexistant"}
            }), 404
        
        # Statistiques générales
        stats = {
            "route_info": route.to_dict(),
            "usage_stats": {
                "total_runs": route.total_runs,
                "active_runners": route.active_runners,
                "runs_today": route.total_runs_today,
                "average_completion_time": route.average_completion_time
            }
        }
        
        return jsonify({
            "status": "success",
            "message": "Statistiques de l'itinéraire récupérées",
            "data": stats
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la récupération des statistiques: {str(e)}",
            "errors": {"server": str(e)}
        }), 500