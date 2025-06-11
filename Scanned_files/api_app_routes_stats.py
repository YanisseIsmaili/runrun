from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.stats import get_user_stats
from app.models.run import Run
from app import db
from sqlalchemy import func
from datetime import datetime, timedelta

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/weekly', methods=['GET'])
def get_weekly_stats():
    try:
        today = datetime.utcnow()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        
        days = []
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            next_day = day + timedelta(days=1)
            
            day_runs = Run.query.filter(
                Run.start_time >= day,
                Run.start_time < next_day
            ).all()
            
            day_distance = sum(float(run.distance) for run in day_runs if run.distance) if day_runs else 0
            day_duration = sum(run.duration for run in day_runs if run.duration) if day_runs else 0
            
            days.append({
                'date': day.strftime('%Y-%m-%d'),
                'day_name': day.strftime('%A'),
                'runs_count': len(day_runs),
                'distance': day_distance,
                'duration': day_duration
            })
        
        return jsonify({
            'status': 'success',
            'weekly_stats': days
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur: {str(e)}'
        }), 500

@stats_bp.route('/monthly', methods=['GET'])
def get_monthly_stats():
    try:
        year = request.args.get('year', datetime.utcnow().year, type=int)
        month = request.args.get('month', datetime.utcnow().month, type=int)
        
        first_day = datetime(year, month, 1)
        if month == 12:
            last_day = datetime(year + 1, 1, 1)
        else:
            last_day = datetime(year, month + 1, 1)
        
        month_runs = Run.query.filter(
            Run.start_time >= first_day,
            Run.start_time < last_day
        ).all()
        
        total_distance = sum(float(run.distance) for run in month_runs if run.distance) if month_runs else 0
        total_duration = sum(run.duration for run in month_runs if run.duration) if month_runs else 0
        avg_speed = sum(float(run.avg_speed) for run in month_runs if run.avg_speed) / len(month_runs) if month_runs else 0
        
        return jsonify({
            'status': 'success',
            'month': {
                'year': year,
                'month': month,
                'runs_count': len(month_runs),
                'total_distance': total_distance,
                'total_duration': total_duration,
                'avg_speed': avg_speed
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur: {str(e)}'
        }), 500

@stats_bp.route('', methods=['GET'])
@jwt_required()
def get_stats():
    current_user_id = get_jwt_identity()
    stats = get_user_stats(current_user_id)
    return jsonify(stats), 200