# app/tasks/stats_updater.py
from app import create_app, db
from sqlalchemy import text
from datetime import datetime, timedelta
import json

def update_stats_cache():
    """Tâche pour mettre à jour le cache des stats"""
    app = create_app()
    
    with app.app_context():
        try:
            # Calcul des stats
            now = datetime.utcnow()
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            thirty_days_ago = now - timedelta(days=30)

            queries = {
                'total_users': "SELECT COUNT(*) FROM users",
                'active_users': f"SELECT COUNT(DISTINCT user_id) FROM runs WHERE start_time >= '{thirty_days_ago}'",
                'new_users_this_month': f"SELECT COUNT(*) FROM users WHERE created_at >= '{start_of_month}'",
                'total_runs': "SELECT COUNT(*) FROM runs",
                'runs_this_month': f"SELECT COUNT(*) FROM runs WHERE start_time >= '{start_of_month}'",
                'total_distance': "SELECT COALESCE(SUM(distance), 0) FROM runs",
                'distance_this_month': f"SELECT COALESCE(SUM(distance), 0) FROM runs WHERE start_time >= '{start_of_month}'",
                'total_routes': "SELECT COUNT(*) FROM routes",
                'active_routes': "SELECT COUNT(*) FROM routes WHERE status = 'active'",
                'avg_speed': "SELECT AVG(avg_speed) FROM runs WHERE avg_speed IS NOT NULL AND avg_speed > 0"
            }

            stats = {}
            for key, query in queries.items():
                result = db.session.execute(text(query)).scalar()
                if key == 'avg_speed':
                    stats['average_pace'] = round(60 / float(result), 2) if result and result > 0 else 0
                else:
                    if 'distance' in key:
                        stats[key] = round(float(result or 0) / 1000, 1)
                    else:
                        stats[key] = int(result or 0)

            # Mise en cache (expire dans 10 minutes)
            expires_at = now + timedelta(minutes=10)
            
            db.session.execute(text("""
                INSERT INTO stats_cache (cache_key, cache_data, expires_at) 
                VALUES ('admin_stats', :data, :expires)
                ON DUPLICATE KEY UPDATE 
                cache_data = :data, expires_at = :expires, updated_at = NOW()
            """), {
                'data': json.dumps(stats),
                'expires': expires_at
            })
            
            db.session.commit()
            print(f"✅ Stats mises à jour: {stats}")
            
        except Exception as e:
            print(f"❌ Erreur update stats: {e}")
            db.session.rollback()

if __name__ == '__main__':
    update_stats_cache()