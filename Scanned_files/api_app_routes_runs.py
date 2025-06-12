# api/app/routes/runs.py
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.run import Run
from app.models.user import User
from app.models.route import Route
from app.utils.decorators import admin_required
from sqlalchemy import func, and_, desc, or_
from datetime import datetime, timedelta
import csv
import io

runs_bp = Blueprint('runs', __name__)

@runs_bp.route('', methods=['GET'])
@jwt_required()
def get_all_runs():
    """Récupère toutes les courses avec filtres et pagination"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        user_id = request.args.get('user_id', type=int)
        route_id = request.args.get('route_id', type=int)
        status = request.args.get('status', type=str)
        date_from = request.args.get('date_from', type=str)
        date_to = request.args.get('date_to', type=str)
        
        query = Run.query
        
        # Si pas admin, ne peut voir que ses propres courses
        if not current_user.is_admin:
            query = query.filter(Run.user_id == current_user_id)
        elif user_id:
            query = query.filter(Run.user_id == user_id)
        
        # Filtres
        if route_id:
            query = query.filter(Run.route_id == route_id)
            
        if status:
            query = query.filter(Run.status == status)
            
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from)
                query = query.filter(Run.start_time >= date_from_obj)
            except ValueError:
                pass
                
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to)
                query = query.filter(Run.start_time <= date_to_obj)
            except ValueError:
                pass
        
        # Pagination
        runs = query.order_by(desc(Run.start_time)).paginate(
            page=page,
            per_page=limit,
            error_out=False
        )
        
        # Enrichir avec les données utilisateur et route
        enriched_runs = []
        for run in runs.items:
            run_dict = run.to_dict()
            
            # Ajouter les infos utilisateur
            if run.user:
                run_dict['user'] = {
                    'id': run.user.id,
                    'username': run.user.username,
                    'full_name': f"{run.user.first_name} {run.user.last_name}".strip()
                }
            
            # Ajouter les infos route
            if run.route:
                run_dict['route'] = {
                    'id': run.route.id,
                    'name': run.route.name,
                    'difficulty': run.route.difficulty
                }
            
            enriched_runs.append(run_dict)
        
        return jsonify({
            "status": "success",
            "data": {
                "runs": enriched_runs,
                "pagination": {
                    "page": page,
                    "pages": runs.pages,
                    "per_page": limit,
                    "total": runs.total
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la récupération des courses",
            "error": str(e)
        }), 500

@runs_bp.route('/<int:run_id>', methods=['GET'])
@jwt_required()
def get_run(run_id):
    """Récupère une course spécifique"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        run = Run.query.get_or_404(run_id)
        
        # Vérifier les permissions
        if not current_user.is_admin and run.user_id != current_user_id:
            return jsonify({
                "status": "error",
                "message": "Accès non autorisé"
            }), 403
        
        run_dict = run.to_dict()
        
        # Ajouter les données enrichies
        if run.user:
            run_dict['user'] = run.user.to_dict()
            
        if run.route:
            run_dict['route'] = run.route.to_dict()
        
        return jsonify({
            "status": "success",
            "data": run_dict
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Course non trouvée",
            "error": str(e)
        }), 404

@runs_bp.route('', methods=['POST'])
@jwt_required()
def create_run():
    """Crée une nouvelle course"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie"
            }), 400
        
        # Validation des champs requis
        if not data.get('distance') or float(data['distance']) <= 0:
            return jsonify({
                "status": "error",
                "message": "Distance invalide"
            }), 400
        
        # Créer la course
        run = Run(
            user_id=current_user_id,
            route_id=data.get('route_id'),
            distance=float(data['distance']),
            duration=data.get('duration'),
            avg_speed=data.get('avg_speed'),
            max_speed=data.get('max_speed'),
            avg_heart_rate=data.get('avg_heart_rate'),
            max_heart_rate=data.get('max_heart_rate'),
            calories_burned=data.get('calories_burned'),
            elevation_gain=data.get('elevation_gain'),
            status=data.get('status', 'finished'),
            weather_conditions=data.get('weather_conditions'),
            notes=data.get('notes'),
            start_time=datetime.fromisoformat(data['start_time']) if data.get('start_time') else datetime.utcnow(),
            end_time=datetime.fromisoformat(data['end_time']) if data.get('end_time') else None
        )
        
        db.session.add(run)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Course créée avec succès",
            "data": run.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la création de la course",
            "error": str(e)
        }), 500

@runs_bp.route('/<int:run_id>', methods=['PUT'])
@jwt_required()
def update_run(run_id):
    """Met à jour une course"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        run = Run.query.get_or_404(run_id)
        
        # Vérifier les permissions
        if not current_user.is_admin and run.user_id != current_user_id:
            return jsonify({
                "status": "error",
                "message": "Accès non autorisé"
            }), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Aucune donnée fournie"
            }), 400
        
        # Mise à jour des champs
        updatable_fields = [
            'distance', 'duration', 'avg_speed', 'max_speed',
            'avg_heart_rate', 'max_heart_rate', 'calories_burned',
            'elevation_gain', 'status', 'weather_conditions', 'notes'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'distance' and (not data[field] or float(data[field]) <= 0):
                    return jsonify({
                        "status": "error",
                        "message": "Distance invalide"
                    }), 400
                setattr(run, field, data[field])
        
        # Mise à jour des dates si fournies
        if data.get('start_time'):
            run.start_time = datetime.fromisoformat(data['start_time'])
            
        if data.get('end_time'):
            run.end_time = datetime.fromisoformat(data['end_time'])
        
        run.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Course mise à jour avec succès",
            "data": run.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la mise à jour",
            "error": str(e)
        }), 500

@runs_bp.route('/<int:run_id>', methods=['DELETE'])
@jwt_required()
def delete_run(run_id):
    """Supprime une course"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        run = Run.query.get_or_404(run_id)
        
        # Vérifier les permissions
        if not current_user.is_admin and run.user_id != current_user_id:
            return jsonify({
                "status": "error",
                "message": "Accès non autorisé"
            }), 403
        
        db.session.delete(run)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Course supprimée avec succès"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la suppression",
            "error": str(e)
        }), 500

@runs_bp.route('/bulk-delete', methods=['POST'])
@jwt_required()
@admin_required
def bulk_delete_runs():
    """Supprime plusieurs courses en lot"""
    try:
        data = request.get_json()
        run_ids = data.get('run_ids', [])
        
        if not run_ids:
            return jsonify({
                "status": "error",
                "message": "Aucune course sélectionnée"
            }), 400
        
        runs = Run.query.filter(Run.id.in_(run_ids)).all()
        
        if not runs:
            return jsonify({
                "status": "error",
                "message": "Aucune course trouvée"
            }), 404
        
        deleted_count = 0
        errors = []
        
        for run in runs:
            try:
                db.session.delete(run)
                deleted_count += 1
            except Exception as e:
                errors.append(f"Course {run.id}: {str(e)}")
        
        db.session.commit()
        
        message = f"{deleted_count} course(s) supprimée(s)"
        if errors:
            message += f", {len(errors)} erreur(s)"
        
        return jsonify({
            "status": "success",
            "message": message,
            "details": {
                "deleted": deleted_count,
                "errors": errors
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la suppression en lot",
            "error": str(e)
        }), 500

@runs_bp.route('/export', methods=['GET'])
@jwt_required()
def export_runs():
    """Exporte les courses en CSV"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Paramètres d'export
        user_id = request.args.get('user_id', type=int)
        date_from = request.args.get('date_from', type=str)
        date_to = request.args.get('date_to', type=str)
        
        query = Run.query
        
        # Si pas admin, ne peut exporter que ses propres courses
        if not current_user.is_admin:
            query = query.filter(Run.user_id == current_user_id)
        elif user_id:
            query = query.filter(Run.user_id == user_id)
        
        # Filtres de date
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from)
                query = query.filter(Run.start_time >= date_from_obj)
            except ValueError:
                pass
                
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to)
                query = query.filter(Run.start_time <= date_to_obj)
            except ValueError:
                pass
        
        runs = query.order_by(desc(Run.start_time)).all()
        
        # Générer le CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # En-têtes
        writer.writerow([
            'ID', 'Utilisateur', 'Itinéraire', 'Date', 'Distance (km)',
            'Durée (min)', 'Vitesse moy. (km/h)', 'Vitesse max (km/h)',
            'FC moy. (bpm)', 'FC max (bpm)', 'Calories', 'Dénivelé (m)',
            'Statut', 'Notes'
        ])
        
        # Données
        for run in runs:
            user_name = run.user.username if run.user else 'Inconnu'
            route_name = run.route.name if run.route else 'Libre'
            duration_min = round(run.duration / 60, 1) if run.duration else ''
            
            writer.writerow([
                run.id,
                user_name,
                route_name,
                run.start_time.strftime('%Y-%m-%d %H:%M'),
                run.distance,
                duration_min,
                run.avg_speed or '',
                run.max_speed or '',
                run.avg_heart_rate or '',
                run.max_heart_rate or '',
                run.calories_burned or '',
                run.elevation_gain or '',
                run.status,
                run.notes or ''
            ])
        
        output.seek(0)
        
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv; charset=utf-8'
        response.headers['Content-Disposition'] = f'attachment; filename=courses_{datetime.now().strftime("%Y%m%d_%H%M")}.csv'
        
        return response
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de l'export",
            "error": str(e)
        }), 500

@runs_bp.route('/stats/summary', methods=['GET'])
@jwt_required()
def get_runs_summary():
    """Récupère un résumé des statistiques des courses"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Si admin, stats globales, sinon stats personnelles
        if current_user.is_admin:
            query = Run.query
        else:
            query = Run.query.filter(Run.user_id == current_user_id)
        
        # Statistiques générales
        total_runs = query.count()
        total_distance = query.with_entities(func.sum(Run.distance)).scalar() or 0
        avg_distance = query.with_entities(func.avg(Run.distance)).scalar() or 0
        
        # Courses ce mois
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        runs_this_month = query.filter(Run.start_time >= current_month).count()
        
        # Courses en cours
        active_runs = query.filter(Run.status == 'in_progress').count()
        
        return jsonify({
            "status": "success",
            "data": {
                "summary": {
                    "total_runs": total_runs,
                    "total_distance": round(float(total_distance), 2),
                    "avg_distance": round(float(avg_distance), 2),
                    "runs_this_month": runs_this_month,
                    "active_runs": active_runs
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Erreur lors de la récupération du résumé",
            "error": str(e)
        }), 500