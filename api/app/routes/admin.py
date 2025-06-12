# app/routes/admin.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.run import Run
from app.models.route import Route
from sqlalchemy import func, text
from datetime import datetime, timedelta
import json
import os

admin_bp = Blueprint('admin', __name__)

def get_cached_stats():
    """Récupère les stats depuis le cache ou les calcule si expirées"""
    try:
        print("🔍 [CACHE] Vérification du cache stats...")
        
        # Vérifier le cache
        cache_result = db.session.execute(
            text("SELECT cache_data, expires_at FROM stats_cache WHERE cache_key = 'admin_stats' AND expires_at > NOW()")
        ).fetchone()
        
        if cache_result:
            print(f"✅ [CACHE] Cache valide trouvé, expire à {cache_result[1]}")
            return json.loads(cache_result[0])
        
        print("⚠️ [CACHE] Cache expiré ou inexistant - recalcul nécessaire")
        return calculate_and_cache_stats()
        
    except Exception as e:
        print(f"❌ [CACHE] Erreur cache stats: {e}")
        return calculate_stats_direct()

def calculate_and_cache_stats():
    """Calcule les stats et les met en cache"""
    try:
        print("🔄 [CALCUL] Début du calcul des statistiques...")
        start_time = datetime.utcnow()
        
        stats = calculate_stats_direct()
        
        # Durée cache depuis .env (défaut: 5.0 secondes)
        cache_duration_seconds = float(os.getenv('STATS_CACHE_DURATION_SECONDS', 5.0))
        expires_at = datetime.utcnow() + timedelta(seconds=cache_duration_seconds)
        
        print(f"💾 [CACHE] Mise en cache pour {cache_duration_seconds}s (expire: {expires_at})")
        
        # Upsert cache
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
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        print(f"✅ [CACHE] Stats calculées et mises en cache en {duration:.2f}s")
        print(f"📊 [STATS] Résultats: {stats}")
        
        return stats
        
    except Exception as e:
        print(f"❌ [CALCUL] Erreur calcul/cache: {e}")
        db.session.rollback()
        return calculate_stats_direct()

def calculate_stats_direct():
    """Calcul direct des statistiques (fallback)"""
    print("⚡ [CALCUL DIRECT] Début des requêtes SQL...")
    
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    thirty_days_ago = now - timedelta(days=30)

    print(f"📅 [DATES] Mois actuel: {start_of_month}, 30j ago: {thirty_days_ago}")

    # Requêtes optimisées avec une seule requête par métrique
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
        try:
            print(f"🔍 [SQL] Exécution: {key}")
            result = db.session.execute(text(query)).scalar()
            print(f"📊 [RESULT] {key}: {result}")
            
            if key == 'avg_speed':
                stats['average_pace'] = round(60 / float(result), 2) if result and result > 0 else 0
                print(f"🏃 [PACE] Conversion vitesse {result} km/h -> {stats['average_pace']} min/km")
            else:
                # Conversion distance en km
                if 'distance' in key:
                    converted = round(float(result or 0) / 1000, 1)
                    stats[key] = converted
                    print(f"📏 [DISTANCE] Conversion {result}m -> {converted}km")
                else:
                    stats[key] = int(result or 0)
                    
        except Exception as e:
            print(f"❌ [SQL ERROR] {key}: {e}")
            stats[key] = 0

    print(f"✅ [CALCUL DIRECT] Terminé: {len(stats)} métriques calculées")
    return stats

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Endpoint stats avec cache optimisé"""
    try:
        print("🚀 [ENDPOINT] /api/admin/stats appelé")
        
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        print(f"👤 [AUTH] User ID: {current_user_id}, Admin: {current_user.is_admin if current_user else 'N/A'}")
        
        if not current_user or not current_user.is_admin:
            print("🚫 [AUTH] Accès refusé - pas admin")
            return jsonify({
                'success': False,
                'message': 'Accès refusé - Privilèges administrateur requis'
            }), 403

        print("✅ [AUTH] Accès autorisé - récupération stats...")
        stats_data = get_cached_stats()
        
        print(f"📈 [RESPONSE] Envoi de {len(stats_data)} métriques")
        return jsonify({
            'success': True,
            'data': stats_data,
            'cached': True,
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        print(f"❌ [ENDPOINT ERROR] {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des statistiques'
        }), 500

@admin_bp.route('/stats/refresh', methods=['POST'])
@jwt_required()
def refresh_stats():
    """Force le recalcul des statistiques"""
    try:
        print("🔄 [REFRESH] Endpoint /refresh appelé")
        
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_admin:
            print("🚫 [REFRESH] Accès refusé")
            return jsonify({'success': False, 'message': 'Accès refusé'}), 403

        print("🗑️ [REFRESH] Suppression du cache existant...")
        result = db.session.execute(text("DELETE FROM stats_cache WHERE cache_key = 'admin_stats'"))
        print(f"🗑️ [CACHE] {result.rowcount} entrées supprimées")
        db.session.commit()
        
        print("🔄 [REFRESH] Recalcul forcé...")
        stats_data = calculate_and_cache_stats()
        
        print("✅ [REFRESH] Terminé avec succès")
        return jsonify({
            'success': True,
            'data': stats_data,
            'message': 'Statistiques recalculées',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ [REFRESH ERROR] {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors du recalcul'
        }), 500