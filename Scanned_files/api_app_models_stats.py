# Ce fichier pourrait contenir des modèles supplémentaires pour les statistiques
# ou simplement des fonctions d'agrégation qui interrogent les modèles existants

from app import db
from app.models.run import Run
from sqlalchemy import func
from datetime import datetime, timedelta

def get_user_stats(user_id):
    """Récupère les statistiques globales pour un utilisateur donné"""
    # Total des courses
    total_runs = Run.query.filter_by(user_id=user_id).count()
    
    # Distance totale
    total_distance = db.session.query(func.sum(Run.distance)).filter(Run.user_id == user_id).scalar() or 0
    
    # Durée totale
    total_duration = db.session.query(func.sum(Run.duration)).filter(Run.user_id == user_id).scalar() or 0
    
    # Vitesse moyenne globale
    avg_speed = db.session.query(func.avg(Run.avg_speed)).filter(Run.user_id == user_id).scalar() or 0
    
    # Meilleure vitesse
    max_speed = db.session.query(func.max(Run.max_speed)).filter(Run.user_id == user_id).scalar() or 0
    
    # Calories totales brûlées
    total_calories = db.session.query(func.sum(Run.calories)).filter(Run.user_id == user_id).scalar() or 0
    
    # Statistiques pour le mois en cours
    current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_runs = Run.query.filter(
        Run.user_id == user_id,
        Run.start_time >= current_month_start
    ).count()
    
    # Distance pour le mois en cours
    month_distance = db.session.query(func.sum(Run.distance)).filter(
        Run.user_id == user_id,
        Run.start_time >= current_month_start
    ).scalar() or 0
    
    return {
        'total_runs': total_runs,
        'total_distance': total_distance,
        'total_duration': total_duration,
        'avg_speed': avg_speed,
        'max_speed': max_speed,
        'total_calories': total_calories,
        'current_month': {
            'runs': month_runs,
            'distance': month_distance
        }
    }