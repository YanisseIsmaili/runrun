# api/app/routes/runs.py - Fichier complet
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, asc, and_, or_, func
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
import math
import json

from ..models import Run, User, Route
from ..extensions import db

runs_bp = Blueprint('runs', __name__)

@runs_bp.route('/api/runs', methods=['GET'])
@jwt_required()
def get_runs():
    """
    Récupérer la liste des courses avec pagination et filtres
    """
    try:
        # Paramètres de pagination
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        limit = min(limit, 100)  # Limiter à 100 max
        
        # Paramètres de tri
        sort_by = request.args.get('sort_by', 'start_time')
        sort_direction = request.args.get('sort_direction', 'desc')
        
        # Paramètres de recherche et filtres
        search = request.args.get('search', '').strip()
        status = request.args.get('status')
        user_id = request.args.get('user_id', type=int)
        route_id = request.args.get('route_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        print(f"🏃 Récupération runs - page: {page}, limit: {limit}, search: '{search}', status: {status}")
        
        # Construction de la requête de base avec jointure user
        query = db.session.query(Run).join(User, Run.user_id == User.id)
        
        # Appliquer les filtres
        if search:
            # Recherche dans le nom d'utilisateur ou email
            query = query.filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%')
                )
            )
            print(f"🔍 Filtre recherche appliqué: {search}")
        
        if status:
            query = query.filter(Run.status == status)
            print(f"📊 Filtre statut appliqué: {status}")
            
        if user_id:
            query = query.filter(Run.user_id == user_id)
            print(f"👤 Filtre utilisateur appliqué: {user_id}")
            
        if route_id:
            query = query.filter(Run.route_id == route_id)
            print(f"🛣️ Filtre parcours appliqué: {route_id}")
            
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(Run.start_time >= start_dt)
                print(f"📅 Filtre date début appliqué: {start_date}")
            except ValueError:
                print(f"❌ Format date début invalide: {start_date}")
                
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(Run.start_time < end_dt)
                print(f"📅 Filtre date fin appliqué: {end_date}")
            except ValueError:
                print(f"❌ Format date fin invalide: {end_date}")
        
        # Appliquer le tri
        valid_sort_fields = {
            'start_time': Run.start_time,
            'end_time': Run.end_time,
            'duration': Run.duration,
            'distance': Run.distance,
            'avg_speed': Run.avg_speed,
            'created_at': Run.created_at,
            'user_id': Run.user_id,
            'status': Run.status
        }
        
        if sort_by in valid_sort_fields:
            sort_column = valid_sort_fields[sort_by]
            if sort_direction.lower() == 'asc':
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
            print(f"🔄 Tri appliqué: {sort_by} {sort_direction}")
        else:
            # Tri par défaut
            query = query.order_by(desc(Run.start_time))
            print("🔄 Tri par défaut: start_time desc")
        
        # Compter le total avant pagination
        total = query.count()
        print(f"📊 Total courses trouvées: {total}")
        
        # Appliquer la pagination
        offset = (page - 1) * limit
        runs = query.offset(offset).limit(limit).all()
        print(f"📄 Courses page {page}: {len(runs)} sur {total}")
        
        # Calculer les métadonnées de pagination
        total_pages = math.ceil(total / limit) if total > 0 else 1
        has_next = page < total_pages
        has_prev = page > 1
        
        # Formater les données pour la réponse
        runs_data = []
        for run in runs:
            # Récupérer l'utilisateur
            user = User.query.get(run.user_id)
            
            # Récupérer le parcours si présent
            route = None
            if run.route_id:
                route = Route.query.get(run.route_id)
            
            run_data = {
                'id': run.id,
                'user_id': run.user_id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                } if user else None,
                'route_id': run.route_id,
                'route': {
                    'id': route.id,
                    'name': route.name,
                    'distance': route.distance
                } if route else None,
                'start_time': run.start_time.isoformat() if run.start_time else None,
                'end_time': run.end_time.isoformat() if run.end_time else None,
                'duration': run.duration,
                'distance': run.distance,
                'avg_speed': run.avg_speed,
                'max_speed': run.max_speed,
                'avg_heart_rate': run.avg_heart_rate,
                'max_heart_rate': run.max_heart_rate,
                'elevation_gain': run.elevation_gain,
                'calories_burned': run.calories_burned,
                'status': run.status,
                'notes': run.notes,
                'weather_conditions': run.weather_conditions,
                'created_at': run.created_at.isoformat() if run.created_at else None,
                'updated_at': run.updated_at.isoformat() if run.updated_at else None
            }
            runs_data.append(run_data)
        
        # Réponse avec pagination
        response_data = {
            'status': 'success',
            'data': {
                'runs': runs_data,
                'pagination': {
                    'page': page,
                    'pages': total_pages,
                    'per_page': limit,
                    'total': total,
                    'has_next': has_next,
                    'has_prev': has_prev
                }
            },
            'message': f'{len(runs_data)} courses récupérées sur {total}'
        }
        
        print(f"✅ Réponse envoyée: {len(runs_data)} courses")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ Erreur get_runs: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de la récupération des courses',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/<int:run_id>', methods=['GET'])
@jwt_required()
def get_run(run_id):
    """
    Récupérer une course spécifique par ID
    """
    try:
        print(f"🏃 Récupération course ID: {run_id}")
        
        run = Run.query.get_or_404(run_id)
        
        # Récupérer l'utilisateur
        user = User.query.get(run.user_id)
        
        # Récupérer le parcours si présent
        route = None
        if run.route_id:
            route = Route.query.get(run.route_id)
        
        run_data = {
            'id': run.id,
            'user_id': run.user_id,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            } if user else None,
            'route_id': run.route_id,
            'route': {
                'id': route.id,
                'name': route.name,
                'distance': route.distance,
                'description': route.description
            } if route else None,
            'start_time': run.start_time.isoformat() if run.start_time else None,
            'end_time': run.end_time.isoformat() if run.end_time else None,
            'duration': run.duration,
            'distance': run.distance,
            'avg_speed': run.avg_speed,
            'max_speed': run.max_speed,
            'avg_heart_rate': run.avg_heart_rate,
            'max_heart_rate': run.max_heart_rate,
            'elevation_gain': run.elevation_gain,
            'calories_burned': run.calories_burned,
            'status': run.status,
            'notes': run.notes,
            'weather_conditions': run.weather_conditions,
            'gps_data': run.gps_data,
            'current_position': run.current_position,
            'created_at': run.created_at.isoformat() if run.created_at else None,
            'updated_at': run.updated_at.isoformat() if run.updated_at else None
        }
        
        print(f"✅ Course {run_id} récupérée")
        return jsonify({
            'status': 'success',
            'data': run_data
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur get_run {run_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Course non trouvée',
            'error': str(e)
        }), 404

@runs_bp.route('/api/runs', methods=['POST'])
@jwt_required()
def create_run():
    """
    Créer une nouvelle course
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"🏃 Création nouvelle course par utilisateur {current_user_id}")
        print(f"📋 Données reçues: {data}")
        
        # Validation des données obligatoires
        required_fields = ['distance', 'start_time']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Champ obligatoire manquant: {field}'
                }), 400
        
        # Créer la nouvelle course
        new_run = Run(
            user_id=data.get('user_id', current_user_id),
            route_id=data.get('route_id'),
            start_time=datetime.fromisoformat(data['start_time'].replace('Z', '+00:00')) if data['start_time'] else datetime.now(),
            end_time=datetime.fromisoformat(data['end_time'].replace('Z', '+00:00')) if data.get('end_time') else None,
            duration=data.get('duration'),
            distance=data['distance'],
            avg_speed=data.get('avg_speed'),
            max_speed=data.get('max_speed'),
            avg_heart_rate=data.get('avg_heart_rate'),
            max_heart_rate=data.get('max_heart_rate'),
            elevation_gain=data.get('elevation_gain'),
            calories_burned=data.get('calories_burned'),
            status=data.get('status', 'finished'),
            notes=data.get('notes'),
            weather_conditions=data.get('weather_conditions'),
            gps_data=data.get('gps_data'),
            current_position=data.get('current_position')
        )
        
        db.session.add(new_run)
        db.session.commit()
        
        print(f"✅ Course créée avec ID: {new_run.id}")
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': new_run.id,
                'message': 'Course créée avec succès'
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Erreur create_run: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de la création de la course',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/<int:run_id>', methods=['PUT'])
@jwt_required()
def update_run(run_id):
    """
    Mettre à jour une course
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"🏃 Mise à jour course {run_id} par utilisateur {current_user_id}")
        
        run = Run.query.get_or_404(run_id)
        
        # Vérifier les permissions (utilisateur propriétaire ou admin)
        user = User.query.get(current_user_id)
        if run.user_id != current_user_id and not (user and user.is_admin):
            return jsonify({
                'status': 'error',
                'message': 'Permission insuffisante pour modifier cette course'
            }), 403
        
        # Mettre à jour les champs modifiables
        updatable_fields = [
            'route_id', 'end_time', 'duration', 'distance', 'avg_speed', 'max_speed',
            'avg_heart_rate', 'max_heart_rate', 'elevation_gain', 'calories_burned',
            'status', 'notes', 'weather_conditions', 'gps_data', 'current_position'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field in ['end_time'] and data[field]:
                    setattr(run, field, datetime.fromisoformat(data[field].replace('Z', '+00:00')))
                else:
                    setattr(run, field, data[field])
        
        run.updated_at = datetime.now()
        db.session.commit()
        
        print(f"✅ Course {run_id} mise à jour")
        
        return jsonify({
            'status': 'success',
            'message': 'Course mise à jour avec succès'
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur update_run {run_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de la mise à jour de la course',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/<int:run_id>', methods=['DELETE'])
@jwt_required()
def delete_run(run_id):
    """
    Supprimer une course
    """
    try:
        current_user_id = get_jwt_identity()
        
        print(f"🏃 Suppression course {run_id} par utilisateur {current_user_id}")
        
        run = Run.query.get_or_404(run_id)
        
        # Vérifier les permissions
        user = User.query.get(current_user_id)
        if run.user_id != current_user_id and not (user and user.is_admin):
            return jsonify({
                'status': 'error',
                'message': 'Permission insuffisante pour supprimer cette course'
            }), 403
        
        db.session.delete(run)
        db.session.commit()
        
        print(f"✅ Course {run_id} supprimée")
        
        return jsonify({
            'status': 'success',
            'message': 'Course supprimée avec succès'
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur delete_run {run_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de la suppression de la course',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_runs():
    """
    Supprimer plusieurs courses
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        run_ids = data.get('run_ids', [])
        
        if not run_ids:
            return jsonify({
                'status': 'error',
                'message': 'Aucune course spécifiée'
            }), 400
        
        print(f"🏃 Suppression groupée de {len(run_ids)} courses par utilisateur {current_user_id}")
        
        # Vérifier les permissions pour chaque course
        user = User.query.get(current_user_id)
        runs_to_delete = []
        
        for run_id in run_ids:
            run = Run.query.get(run_id)
            if run:
                if run.user_id == current_user_id or (user and user.is_admin):
                    runs_to_delete.append(run)
                else:
                    print(f"⚠️ Permission refusée pour course {run_id}")
        
        # Supprimer les courses autorisées
        deleted_count = 0
        for run in runs_to_delete:
            db.session.delete(run)
            deleted_count += 1
        
        db.session.commit()
        
        print(f"✅ {deleted_count} courses supprimées sur {len(run_ids)} demandées")
        
        return jsonify({
            'status': 'success',
            'message': f'{deleted_count} courses supprimées avec succès',
            'deleted_count': deleted_count,
            'requested_count': len(run_ids)
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur bulk_delete_runs: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de la suppression groupée',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/stats', methods=['GET'])
@jwt_required()
def get_runs_stats():
    """
    Récupérer les statistiques des courses
    """
    try:
        # Paramètres de filtrage par période
        period = request.args.get('period', 'all')  # all, week, month, year
        user_id = request.args.get('user_id', type=int)
        
        print(f"📊 Récupération statistiques courses - période: {period}, user: {user_id}")
        
        # Construction de la requête de base
        query = Run.query
        
        if user_id:
            query = query.filter(Run.user_id == user_id)
        
        # Filtrer par période
        if period != 'all':
            now = datetime.now()
            if period == 'week':
                start_date = now - timedelta(days=7)
            elif period == 'month':
                start_date = now - timedelta(days=30)
            elif period == 'year':
                start_date = now - timedelta(days=365)
            else:
                start_date = None
            
            if start_date:
                query = query.filter(Run.start_time >= start_date)
        
        # Calculer les statistiques
        runs = query.filter(Run.status == 'finished').all()
        
        total_runs = len(runs)
        total_distance = sum(run.distance for run in runs if run.distance) / 1000  # en km
        total_duration = sum(run.duration for run in runs if run.duration)  # en secondes
        
        avg_distance = total_distance / total_runs if total_runs > 0 else 0
        avg_duration = total_duration / total_runs if total_runs > 0 else 0
        avg_speed = sum(run.avg_speed for run in runs if run.avg_speed) / total_runs if total_runs > 0 else 0
        
        # Courses par mois (12 derniers mois)
        monthly_stats = []
        for i in range(12):
            month_start = datetime.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=32)
            month_end = month_end.replace(day=1) - timedelta(days=1)
            
            month_runs = query.filter(
                Run.start_time >= month_start,
                Run.start_time <= month_end,
                Run.status == 'finished'
            ).all()
            
            monthly_stats.insert(0, {
                'month': month_start.strftime('%Y-%m'),
                'runs': len(month_runs),
                'distance': sum(run.distance for run in month_runs if run.distance) / 1000,
                'duration': sum(run.duration for run in month_runs if run.duration)
            })
        
        stats_data = {
            'period': period,
            'total_runs': total_runs,
            'total_distance_km': round(total_distance, 2),
            'total_duration_hours': round(total_duration / 3600, 2) if total_duration else 0,
            'avg_distance_km': round(avg_distance, 2),
            'avg_duration_minutes': round(avg_duration / 60, 2) if avg_duration else 0,
            'avg_speed_kmh': round(avg_speed, 2),
            'monthly_stats': monthly_stats
        }
        
        print(f"✅ Statistiques calculées: {total_runs} courses")
        
        return jsonify({
            'status': 'success',
            'data': stats_data
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur get_runs_stats: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors du calcul des statistiques',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/active', methods=['GET'])
@jwt_required()
def get_active_runs():
    """
    Récupérer les courses actives/en cours
    """
    try:
        print("🏃 Récupération courses actives")
        
        active_runs = Run.query.filter(
            Run.status.in_(['active', 'paused'])
        ).order_by(desc(Run.start_time)).all()
        
        runs_data = []
        for run in active_runs:
            user = User.query.get(run.user_id)
            
            run_data = {
                'id': run.id,
                'user_id': run.user_id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                } if user else None,
                'start_time': run.start_time.isoformat() if run.start_time else None,
                'distance': run.distance,
                'duration': run.duration,
                'avg_speed': run.avg_speed,
                'status': run.status,
                'current_position': run.current_position
            }
            runs_data.append(run_data)
        
        print(f"✅ {len(runs_data)} courses actives trouvées")
        
        return jsonify({
            'status': 'success',
            'data': runs_data,
            'message': f'{len(runs_data)} courses actives trouvées'
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur get_active_runs: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de la récupération des courses actives',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/recent', methods=['GET'])
@jwt_required()
def get_recent_runs():
    """
    Récupérer les courses récentes
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Limiter à 50 max
        
        print(f"🏃 Récupération {limit} courses récentes")
        
        recent_runs = Run.query.filter(
            Run.status == 'finished'
        ).order_by(desc(Run.end_time)).limit(limit).all()
        
        runs_data = []
        for run in recent_runs:
            user = User.query.get(run.user_id)
            
            run_data = {
                'id': run.id,
                'user_id': run.user_id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                } if user else None,
                'start_time': run.start_time.isoformat() if run.start_time else None,
                'end_time': run.end_time.isoformat() if run.end_time else None,
                'distance': run.distance,
                'duration': run.duration,
                'avg_speed': run.avg_speed,
                'status': run.status
            }
            runs_data.append(run_data)
        
        print(f"✅ {len(runs_data)} courses récentes trouvées")
        
        return jsonify({
            'status': 'success',
            'data': runs_data,
            'message': f'{len(runs_data)} courses récentes trouvées'
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur get_recent_runs: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de la récupération des courses récentes',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/export', methods=['GET'])
@jwt_required()
def export_runs():
    """
    Exporter les données de courses
    """
    try:
        format_type = request.args.get('format', 'csv')
        
        print(f"📤 Export courses format: {format_type}")
        
        # TODO: Implémenter l'export réel
        # Pour l'instant, retourner un message
        return jsonify({
            'status': 'success',
            'message': f'Export {format_type} en cours de développement'
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur export_runs: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de l\'export',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/<int:run_id>/start', methods=['POST'])
@jwt_required()
def start_run(run_id):
    """
    Démarrer une course (changer le statut à 'active')
    """
    try:
        current_user_id = get_jwt_identity()
        
        run = Run.query.get_or_404(run_id)
        
        # Vérifier les permissions
        if run.user_id != current_user_id:
            user = User.query.get(current_user_id)
            if not (user and user.is_admin):
                return jsonify({
                    'status': 'error',
                    'message': 'Permission insuffisante'
                }), 403
        
        run.status = 'active'
        if not run.start_time:
            run.start_time = datetime.now()
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Course démarrée'
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur start_run: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors du démarrage',
            'error': str(e)
        }), 500

@runs_bp.route('/api/runs/<int:run_id>/stop', methods=['POST'])
@jwt_required()
def stop_run(run_id):
    """
    Arrêter une course (changer le statut à 'finished')
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        run = Run.query.get_or_404(run_id)
        
        # Vérifier les permissions
        if run.user_id != current_user_id:
            user = User.query.get(current_user_id)
            if not (user and user.is_admin):
                return jsonify({
                    'status': 'error',
                    'message': 'Permission insuffisante'
                }), 403
        
        run.status = 'finished'
        run.end_time = datetime.now()
        
        # Mettre à jour les données finales si fournies
        if 'distance' in data:
            run.distance = data['distance']
        if 'duration' in data:
            run.duration = data['duration']
        if 'avg_speed' in data:
            run.avg_speed = data['avg_speed']
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Course terminée'
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur stop_run: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de l\'arrêt',
            'error': str(e)
        }), 500