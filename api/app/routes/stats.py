from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.stats import get_user_stats
from app.models.run import Run
from app import db
from sqlalchemy import func
from datetime import datetime, timedelta

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('', methods=['GET'])
@jwt_required()
def get_stats():
    current_user_id = get_jwt_identity()
    
    # Récupération des statistiques globales
    stats = get_user_stats(current_user_id)
    
    return jsonify(stats), 200

@stats_bp.route('/weekly', methods=['GET'])
@jwt_required()
def get_weekly_stats():
    current_user_id = get_jwt_identity()
    
    # Calcul du début de la semaine (lundi)
    today = datetime.utcnow()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Préparation du tableau pour les 7 jours de la semaine
    days = []
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        next_day = day + timedelta(days=1)
        
        # Récupération des courses pour ce jour
        day_runs = Run.query.filter(
            Run.user_id == current_user_id,
            Run.start_time >= day,
            Run.start_time < next_day
        ).all()
        
        # Calcul des statistiques pour ce jour
        day_distance = sum(run.distance for run in day_runs) if day_runs else 0
        day_duration = sum(run.duration for run in day_runs) if day_runs else 0
        
        days.append({
            'date': day.strftime('%Y-%m-%d'),
            'day_name': day.strftime('%A'),
            'runs_count': len(day_runs),
            'distance': day_distance,
            'duration': day_duration
        })
    
    return jsonify({
        'weekly_stats': days
    }), 200

@stats_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly_stats():
    current_user_id = get_jwt_identity()
    
    # Récupération du mois demandé (par défaut, le mois en cours)
    year = request.args.get('year', datetime.utcnow().year, type=int)
    month = request.args.get('month', datetime.utcnow().month, type=int)
    
    # Calcul du premier et dernier jour du mois
    first_day = datetime(year, month, 1)
    if month == 12:
        last_day = datetime(year + 1, 1, 1)
    else:
        last_day = datetime(year, month + 1, 1)
    
    # Récupération des courses pour ce mois
    month_runs = Run.query.filter(
        Run.user_id == current_user_id,
        Run.start_time >= first_day,
        Run.start_time < last_day
    ).all()
    
    # Calcul des statistiques pour ce mois
    total_distance = sum(run.distance for run in month_runs) if month_runs else 0
    total_duration = sum(run.duration for run in month_runs) if month_runs else 0
    avg_speed = sum(run.avg_speed for run in month_runs) / len(month_runs) if month_runs else 0
    
    return jsonify({
        'month': {
            'year': year,
            'month': month,
            'runs_count': len(month_runs),
            'total_distance': total_distance,
            'total_duration': total_duration,
            'avg_speed': avg_speed
        }
    }), 200