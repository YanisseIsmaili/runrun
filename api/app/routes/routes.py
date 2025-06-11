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
            route_dict = route.to_dict()
            
            # Ajouter les statistiques temps réel
            active_runs = Run.query.filter_by(
                route_id=route.id, 
                status='in_progress'
            ).count()
            
            runs_today = Run.query.filter(
                and_(
                    Route.id == route.id,
                    func.date(Run.start_time) == datetime.now().date()
                )
            ).count()
            
            route_dict.update({
                'active_runners': active_runs,
                'total_runs_today': runs_today
            })
            
            enriched_routes.append(route_dict)
        
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
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la récupération des itinéraires",
            "error": str(e)
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
        return jsonify({
            "status": "error",
            "message": "Itinéraire non trouvé",
            "error": str(e)
        }), 404

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
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la création de l'itinéraire",
            "error": str(e)
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
        updatable_fields = ['name', 'description', 'distance', 'estimated_duration', 
                           'difficulty', 'elevation_gain', 'waypoints']
        
        for field in updatable_fields:
            if field in data:
                if field == 'distance':
                    try:
                        value = float(data[field])
                        if value <= 0:
                            raise ValueError()
                        setattr(route, field, value)
                    except (ValueError, TypeError):
                        return jsonify({
                            "status": "error",
                            "message": "Distance invalide"
                        }), 400
                elif field == 'estimated_duration':
                    if data[field]:
                        try:
                            value = int(data[field])
                            if value <= 0:
                                raise ValueError()
                            setattr(route, field, value)
                        except (ValueError, TypeError):
                            return jsonify({
                                "status": "error",
                                "message": "Durée estimée invalide"
                            }), 400
                    else:
                        setattr(route, field, None)
                elif field == 'waypoints':
                    if data[field]:
                        setattr(route, field, json.dumps(data[field]))
                    else:
                        setattr(route, field, None)
                else:
                    setattr(route, field, data[field])
        
        route.updated_at = datetime.utcnow()
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
            "message": "Erreur lors de la mise à jour",
            "error": str(e)
        }), 500

@routes_bp.route('/<int:route_id>/toggle-status', methods=['PATCH'])
@jwt_required()
@admin_required
def toggle_route_status(route_id):
    """Change le statut d'un itinéraire (actif/inactif)"""
    try:
        route = Route.query.get_or_404(route_id)
        
        # Vérifier qu'il n'y a pas de courses en cours
        if route.status == 'active':
            active_runs = Run.query.filter_by(
                route_id=route_id, 
                status='in_progress'
            ).count()
            
            if active_runs > 0:
                return jsonify({
                    "status": "error",
                    "message": f"Impossible de désactiver : {active_runs} course(s) en cours"
                }), 400
        
        # Changer le statut
        route.status = 'inactive' if route.status == 'active' else 'active'
        route.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Itinéraire {'activé' if route.status == 'active' else 'désactivé'} avec succès",
            "data": {
                "status": route.status,
                "route_id": route_id
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors du changement de statut",
            "error": str(e)
        }), 500

@routes_bp.route('/<int:route_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_route(route_id):
    """Supprime un itinéraire"""
    try:
        route = Route.query.get_or_404(route_id)
        
        # Vérifier qu'il n'y a pas de courses en cours
        active_runs = Run.query.filter_by(
            route_id=route_id, 
            status='in_progress'
        ).count()
        
        if active_runs > 0:
            return jsonify({
                "status": "error",
                "message": f"Impossible de supprimer : {active_runs} course(s) en cours"
            }), 400
        
        # Vérifier s'il y a des courses terminées
        total_runs = Run.query.filter_by(route_id=route_id).count()
        
        if total_runs > 0:
            # Option : marquer comme supprimé au lieu de supprimer
            route.status = 'deleted'
            route.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": f"Itinéraire archivé (avait {total_runs} courses)"
            }), 200
        else:
            # Suppression définitive si aucune course
            db.session.delete(route)
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": "Itinéraire supprimé avec succès"
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la suppression",
            "error": str(e)
        }), 500

@routes_bp.route('/active-runs', methods=['GET'])
@jwt_required()
def get_active_runs():
    """Récupère les courses en cours sur tous les itinéraires"""
    try:
        active_runs = db.session.query(
            Run, Route, User
        ).join(
            Route, Run.route_id == Route.id
        ).join(
            User, Run.user_id == User.id
        ).filter(
            Run.status == 'in_progress'
        ).all()
        
        runs_data = []
        for run, route, user in active_runs:
            run_dict = run.to_dict()
            run_dict['route'] = {
                'id': route.id,
                'name': route.name,
                'distance': route.distance
            }
            run_dict['user'] = {
                'id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip()
            }
            runs_data.append(run_dict)
        
        return jsonify({
            "status": "success",
            "data": runs_data
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la récupération des courses actives",
            "error": str(e)
        }), 500

@routes_bp.route('/<int:route_id>/stats', methods=['GET'])
@jwt_required()
def get_route_stats(route_id):
    """Récupère les statistiques détaillées d'un itinéraire"""
    try:
        route = Route.query.get_or_404(route_id)
        
        # Statistiques générales
        general_stats = db.session.query(
            func.count(Run.id).label('total_runs'),
            func.avg(Run.duration).label('avg_duration'),
            func.min(Run.duration).label('best_time'),
            func.max(Run.duration).label('worst_time'),
            func.avg(Run.avg_speed).label('avg_speed')
        ).filter(Run.route_id == route_id).first()
        
        # Statistiques par mois (derniers 6 mois)
        six_months_ago = datetime.now() - timedelta(days=180)
        monthly_stats = db.session.query(
            func.year(Run.start_time).label('year'),
            func.month(Run.start_time).label('month'),
            func.count(Run.id).label('runs_count'),
            func.avg(Run.duration).label('avg_duration')
        ).filter(
            and_(
                Run.route_id == route_id,
                Run.start_time >= six_months_ago
            )
        ).group_by(
            func.year(Run.start_time),
            func.month(Run.start_time)
        ).all()
        
        # Top 5 des coureurs
        top_runners = db.session.query(
            User.username,
            User.first_name,
            User.last_name,
            func.count(Run.id).label('runs_count'),
            func.min(Run.duration).label('best_time')
        ).join(Run, User.id == Run.user_id).filter(
            Run.route_id == route_id
        ).group_by(User.id).order_by(
            desc(func.count(Run.id))
        ).limit(5).all()
        
        return jsonify({
            "status": "success",
            "data": {
                "route": route.to_dict(),
                "general": {
                    "total_runs": general_stats.total_runs or 0,
                    "avg_duration": float(general_stats.avg_duration or 0),
                    "best_time": float(general_stats.best_time or 0),
                    "worst_time": float(general_stats.worst_time or 0),
                    "avg_speed": float(general_stats.avg_speed or 0)
                },
                "monthly": [
                    {
                        "year": stat.year,
                        "month": stat.month,
                        "runs_count": stat.runs_count,
                        "avg_duration": float(stat.avg_duration or 0)
                    } for stat in monthly_stats
                ],
                "top_runners": [
                    {
                        "username": runner.username,
                        "full_name": f"{runner.first_name} {runner.last_name}".strip(),
                        "runs_count": runner.runs_count,
                        "best_time": float(runner.best_time or 0)
                    } for runner in top_runners
                ]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la récupération des statistiques",
            "error": str(e)
        }), 500

@routes_bp.route('/export', methods=['GET'])
@jwt_required()
@admin_required
def export_routes():
    """Exporte la liste des itinéraires en CSV"""
    try:
        routes = Route.query.all()
        
        # Générer le CSV
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # En-têtes
        writer.writerow([
            'ID', 'Nom', 'Description', 'Distance (km)', 
            'Durée estimée (min)', 'Difficulté', 'Statut',
            'Dénivelé (m)', 'Créé le', 'Créé par'
        ])
        
        # Données
        for route in routes:
            creator = User.query.get(route.created_by)
            writer.writerow([
                route.id,
                route.name,
                route.description or '',
                route.distance,
                route.estimated_duration // 60 if route.estimated_duration else '',
                route.difficulty,
                route.status,
                route.elevation_gain or '',
                route.created_at.strftime('%Y-%m-%d %H:%M'),
                creator.username if creator else 'Inconnu'
            ])
        
        output.seek(0)
        
        from flask import make_response
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=routes_{datetime.now().strftime("%Y%m%d")}.csv'
        
        return response
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de l'export",
            "error": str(e)
        }), 500