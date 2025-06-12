# app/routes/routes.py - Fichier complet avec debug

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.route import Route
from app.models.run import Run
from app.models.user import User
from app.utils.decorators import admin_required
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
import json
import traceback
import logging


# Configuration du logging pour voir les erreurs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('', methods=['GET'])
@jwt_required()
def get_all_routes():
    """Récupère tous les itinéraires avec pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '', type=str)
        status = request.args.get('status', '', type=str)
        difficulty = request.args.get('difficulty', '', type=str)
        
        query = Route.query
        
        # Filtres de recherche
        if search:
            query = query.filter(
                db.or_(
                    Route.name.ilike(f'%{search}%'),
                    Route.description.ilike(f'%{search}%')
                )
            )
        
        if status:
            query = query.filter(Route.status == status)
            
        if difficulty:
            query = query.filter(Route.difficulty == difficulty)
        
        # Pagination
        routes = query.order_by(desc(Route.created_at)).paginate(
            page=page, 
            per_page=limit, 
            error_out=False
        )
        
        # Enrichir avec les statistiques
        enriched_routes = []
        for route in routes.items:
            try:
                route_dict = route.to_dict()
                
                # Ajouter les statistiques temps réel
                active_runs = Run.query.filter_by(
                    route_id=route.id, 
                    status='in_progress'
                ).count()
                
                runs_today = Run.query.filter(
                    and_(
                        Run.route_id == route.id,
                        func.date(Run.start_time) == datetime.now().date()
                    )
                ).count()
                
                route_dict.update({
                    'active_runners': active_runs,
                    'total_runs_today': runs_today
                })
                
                enriched_routes.append(route_dict)
                
            except Exception as route_error:
                logger.error(f"Erreur route {route.id}: {route_error}")
                logger.error(f"Traceback route: {traceback.format_exc()}")
                continue
        
        return jsonify({
            "status": "success",
            "data": {
                "routes": enriched_routes,
                "pagination": {
                    "page": page,
                    "pages": routes.pages,
                    "per_page": limit,
                    "total": routes.total
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur détaillée get_all_routes: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }), 500

@routes_bp.route('/<int:route_id>', methods=['GET'])
@jwt_required()
def get_route(route_id):
    """Récupère un itinéraire spécifique"""
    try:
        route = Route.query.get_or_404(route_id)
        route_dict = route.to_dict()
        
        # Ajouter les statistiques détaillées
        stats = db.session.query(
            func.count(Run.id).label('total_runs'),
            func.avg(Run.duration).label('avg_duration'),
            func.min(Run.duration).label('best_time'),
            func.max(Run.duration).label('worst_time')
        ).filter(Run.route_id == route_id).first()
        
        route_dict['stats'] = {
            'total_runs': stats.total_runs or 0,
            'avg_duration': float(stats.avg_duration or 0),
            'best_time': float(stats.best_time or 0),
            'worst_time': float(stats.worst_time or 0)
        }
        
        return jsonify({
            "status": "success",
            "data": route_dict
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur détaillée get_route: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }), 500

@routes_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_route():
    """Crée un nouvel itinéraire"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie"
            }), 400
        
        # Validation des champs requis
        required_fields = ['name', 'distance']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "status": "error",
                    "message": f"Le champ '{field}' est requis"
                }), 400
        
        # Validation des données
        try:
            distance = float(data['distance'])
            if distance <= 0:
                raise ValueError("La distance doit être positive")
        except (ValueError, TypeError):
            return jsonify({
                "status": "error",
                "message": "Distance invalide"
            }), 400
        
        estimated_duration = None
        if data.get('estimated_duration'):
            try:
                estimated_duration = int(data['estimated_duration'])
                if estimated_duration <= 0:
                    raise ValueError()
            except (ValueError, TypeError):
                return jsonify({
                    "status": "error",
                    "message": "Durée estimée invalide"
                }), 400
        
        # Validation des waypoints
        waypoints = data.get('waypoints', [])
        if waypoints and isinstance(waypoints, list):
            for i, waypoint in enumerate(waypoints):
                if not all(k in waypoint for k in ['lat', 'lng']):
                    return jsonify({
                        "status": "error",
                        "message": f"Waypoint {i+1} invalide (lat/lng requis)"
                    }), 400
        
        # Créer l'itinéraire
        route = Route(
            name=data['name'].strip(),
            description=data.get('description', '').strip(),
            distance=distance,
            estimated_duration=estimated_duration,
            difficulty=data.get('difficulty', 'Facile'),
            elevation_gain=data.get('elevation_gain'),
            waypoints=json.dumps(waypoints) if waypoints else None,
            created_by=get_jwt_identity(),
            status='active'
        )
        
        db.session.add(route)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Itinéraire créé avec succès",
            "data": route.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur détaillée create_route: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }), 500

@routes_bp.route('/<int:route_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_route(route_id):
    """Met à jour un itinéraire"""
    try:
        route = Route.query.get_or_404(route_id)
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie"
            }), 400
        
        # Mise à jour des champs
        if 'name' in data:
            route.name = data['name'].strip()
        if 'description' in data:
            route.description = data['description'].strip()
        if 'distance' in data:
            try:
                distance = float(data['distance'])
                if distance <= 0:
                    raise ValueError()
                route.distance = distance
            except (ValueError, TypeError):
                return jsonify({
                    "status": "error",
                    "message": "Distance invalide"
                }), 400
        
        if 'estimated_duration' in data:
            if data['estimated_duration']:
                try:
                    route.estimated_duration = int(data['estimated_duration'])
                except (ValueError, TypeError):
                    return jsonify({
                        "status": "error",
                        "message": "Durée estimée invalide"
                    }), 400
            else:
                route.estimated_duration = None
        
        if 'difficulty' in data:
            route.difficulty = data['difficulty']
        if 'elevation_gain' in data:
            route.elevation_gain = data['elevation_gain']
        if 'status' in data:
            route.status = data['status']
        if 'waypoints' in data:
            route.waypoints = json.dumps(data['waypoints']) if data['waypoints'] else None
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Itinéraire mis à jour avec succès",
            "data": route.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur détaillée update_route: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }), 500

@routes_bp.route('/<int:route_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_route(route_id):
    """Supprime un itinéraire"""
    try:
        route = Route.query.get_or_404(route_id)
        
        # Vérifier s'il y a des runs associés
        runs_count = Run.query.filter_by(route_id=route_id).count()
        if runs_count > 0:
            # Marquer comme inactif au lieu de supprimer
            route.status = 'inactive'
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": f"Itinéraire désactivé (contient {runs_count} courses)"
            }), 200
        else:
            # Suppression réelle
            db.session.delete(route)
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": "Itinéraire supprimé avec succès"
            }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur détaillée delete_route: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }), 500

@routes_bp.route('/active-runs', methods=['GET'])
@jwt_required()
def get_active_runs():
    """Récupère les courses actives"""
    try:
        # Récupérer les runs avec status 'active' ou 'in_progress'
        active_runs = Run.query.filter(
            Run.status.in_(['active', 'in_progress'])
        ).order_by(desc(Run.start_time)).all()
        
        runs_data = []
        for run in active_runs:
            try:
                run_dict = run.to_dict()
                
                # Ajouter infos utilisateur de façon sécurisée
                if run.user_id:
                    user = User.query.get(run.user_id)
                    if user:
                        run_dict['user'] = {
                            'id': user.id,
                            'username': user.username,
                            'first_name': user.first_name or '',
                            'last_name': user.last_name or ''
                        }
                
                # Ajouter infos route de façon sécurisée
                if run.route_id:
                    route = Route.query.get(run.route_id)
                    if route:
                        run_dict['route'] = {
                            'id': route.id,
                            'name': route.name or 'Route sans nom',
                            'distance': route.distance or 0,
                            'difficulty': route.difficulty or 'Facile'
                        }
                
                runs_data.append(run_dict)
                
            except Exception as run_error:
                logger.error(f"Erreur traitement run {run.id}: {run_error}")
                logger.error(f"Traceback run: {traceback.format_exc()}")
                continue
        
        return jsonify({
            "status": "success",
            "data": runs_data
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur détaillée get_active_runs: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }), 500

@routes_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_routes_stats():
    """Récupère les statistiques des itinéraires"""
    try:
        # Statistiques générales
        total_routes = Route.query.count()
        active_routes = Route.query.filter_by(status='active').count()
        
        # Routes les plus populaires
        popular_routes = db.session.query(
            Route,
            func.count(Run.id).label('run_count')
        ).outerjoin(Run).group_by(Route.id).order_by(
            desc('run_count')
        ).limit(5).all()
        
        popular_data = []
        for route, run_count in popular_routes:
            try:
                route_dict = route.to_dict()
                route_dict['run_count'] = run_count
                popular_data.append(route_dict)
            except Exception as route_error:
                logger.error(f"Erreur route populaire {route.id}: {route_error}")
                continue
        
        # Statistiques par difficulté
        difficulty_stats = db.session.query(
            Route.difficulty,
            func.count(Route.id).label('count')
        ).group_by(Route.difficulty).all()
        
        difficulty_data = {diff: count for diff, count in difficulty_stats}
        
        return jsonify({
            "status": "success",
            "data": {
                "total_routes": total_routes,
                "active_routes": active_routes,
                "popular_routes": popular_data,
                "difficulty_distribution": difficulty_data
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur détaillée get_routes_stats: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }), 500