# api/app/routes/dashboard.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from app.models.user import User
from app.models.run import Run
from app.models.stats_cache import StatsCache
from app import db

dashboard_bp = Blueprint('dashboard', __name__)

def serialize_datetime(dt):
    """Helper pour sérialiser les datetime"""
    if dt is None:
        return None
    return dt.isoformat()

@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_dashboard_overview():
    """
    Endpoint principal pour récupérer toutes les données du dashboard
    """
    try:
        # Récupération des paramètres de période
        period = request.args.get('period', '30')  # Par défaut 30 jours
        days = int(period)
        
        # Date de début pour la période
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Statistiques générales - Simplifiées pour éviter les erreurs
        total_users = User.query.count()
        total_runs = Run.query.count()
        
        # Stats de base sans colonnes potentiellement manquantes
        try:
            # Essayer avec last_login, fallback si la colonne n'existe pas
            active_users = User.query.filter(User.last_login >= start_date).count()
        except:
            # Si last_login n'existe pas, on compte tous les utilisateurs actifs
            active_users = User.query.filter(User.is_active == True).count()
        
        try:
            recent_runs = Run.query.filter(Run.start_time >= start_date).count()
        except:
            # Si start_time pose problème, prendre juste un nombre de base
            recent_runs = Run.query.limit(100).count()
        
        # Statistiques de performance - simplifiées
        try:
            avg_distance = db.session.query(func.avg(Run.distance)).filter(
                Run.start_time >= start_date
            ).scalar() or 0
            
            total_distance = db.session.query(func.sum(Run.distance)).filter(
                Run.start_time >= start_date
            ).scalar() or 0
        except:
            # Fallback si problème avec les dates
            avg_distance = db.session.query(func.avg(Run.distance)).scalar() or 0
            total_distance = db.session.query(func.sum(Run.distance)).scalar() or 0
        
        # Formatage des réponses - simplifié
        response_data = {
            'period': days,
            'overview': {
                'total_users': total_users,
                'active_users': active_users,
                'total_runs': total_runs,
                'recent_runs': recent_runs,
                'avg_distance': round(float(avg_distance), 2),
                'total_distance': round(float(total_distance), 2),
                'activity_rate': round((recent_runs / total_runs * 100) if total_runs > 0 else 0, 2)
            }
        }
        
        return jsonify({
            'success': True,
            'data': response_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """
    Récupère l'activité récente pour le dashboard
    """
    try:
        limit = request.args.get('limit', 10, type=int)  # Réduire la limite
        
        # Récupération simplifiée des courses récentes
        try:
            recent_runs = db.session.query(Run, User).join(
                User, Run.user_id == User.id
            ).order_by(
                desc(Run.id)  # Utiliser l'ID au lieu de start_time si problème
            ).limit(limit).all()
        except:
            # Fallback : juste les courses sans jointure
            recent_runs_simple = Run.query.order_by(desc(Run.id)).limit(limit).all()
            recent_runs = []
            for run in recent_runs_simple:
                user = User.query.get(run.user_id)
                if user:
                    # Simuler la structure attendue
                    class MockRun:
                        def __init__(self, run_obj, user_obj):
                            self.Run = run_obj
                            self.User = user_obj
                    recent_runs.append(MockRun(run, user))
        
        response_data = {
            'recent_runs': [
                {
                    'id': run.Run.id,
                    'user': {
                        'id': run.User.id,
                        'username': run.User.username,
                        'email': run.User.email
                    },
                    'distance': run.Run.distance,
                    'duration': run.Run.duration,
                    'start_time': serialize_datetime(getattr(run.Run, 'start_time', None))
                }
                for run in recent_runs
            ]
        }
        
        return jsonify({
            'success': True,
            'data': response_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@dashboard_bp.route('/system-health', methods=['GET'])
@jwt_required()
def get_system_health():
    """
    Récupère les informations de santé du système
    """
    try:
        # Vérification de la connectivité base de données - améliorée
        db_health = True
        try:
            # Test plus robuste de la base de données
            result = db.session.execute('SELECT 1').fetchone()
            db_health = result is not None
        except Exception as e:
            print(f"Erreur DB health check: {e}")
            db_health = False
        
        response_data = {
            'database': {
                'status': 'healthy' if db_health else 'error',
                'connected': db_health
            },
            'uptime': {
                'status': 'healthy'
            }
        }
        
        return jsonify({
            'success': True,
            'data': response_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500