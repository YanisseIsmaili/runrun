#!/usr/bin/env python3
# scripts/diag_route.py - Script de diagnostic complet

import sys
import os
import traceback
from datetime import datetime

# Ajouter le répertoire parent au chemin
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_imports():
    """Test des imports"""
    print("=" * 60)
    print("🔍 TEST DES IMPORTS")
    print("=" * 60)
    
    try:
        from app import create_app, db
        print("✅ Import app: OK")
        
        from app.models import Route, Run, User
        print("✅ Import models: OK")
        
        from flask_jwt_extended import create_access_token
        print("✅ Import JWT: OK")
        
        return True
    except Exception as e:
        print(f"❌ Erreur import: {e}")
        print(traceback.format_exc())
        return False

def test_database_connection():
    """Test de connexion à la base de données"""
    print("\n" + "=" * 60)
    print("🔍 TEST CONNEXION BASE DE DONNÉES")
    print("=" * 60)
    
    try:
        from app import create_app, db
        from app.models import Route, Run, User
        
        app = create_app()
        
        with app.app_context():
            # Test connexion
            db.session.execute(db.text('SELECT 1'))
            print("✅ Connexion DB: OK")
            
            # Vérifier les tables
            tables = db.session.execute(db.text("SHOW TABLES")).fetchall()
            table_names = [table[0] for table in tables]
            print(f"📋 Tables: {table_names}")
            
            # Vérifier la table routes
            if 'routes' in table_names:
                print("✅ Table routes existe")
                
                # Structure de la table
                columns = db.session.execute(db.text("DESCRIBE routes")).fetchall()
                print("📝 Colonnes routes:")
                for col in columns:
                    print(f"   {col[0]} - {col[1]} {'(NULL)' if col[2] == 'YES' else '(NOT NULL)'}")
                
                # Compter les routes
                count = Route.query.count()
                print(f"📊 Nombre de routes: {count}")
                
                if count > 0:
                    # Test de sérialisation
                    print("\n🔍 Test de sérialisation des routes:")
                    routes = Route.query.limit(3).all()
                    
                    for route in routes:
                        try:
                            route_dict = route.to_dict()
                            print(f"   ✅ Route {route.id}: {route_dict['name']} - OK")
                        except Exception as e:
                            print(f"   ❌ Route {route.id}: ERREUR - {e}")
                            print(f"      Stack: {traceback.format_exc()}")
            else:
                print("❌ Table routes manquante")
            
            # Vérifier la table runs
            if 'runs' in table_names:
                print("✅ Table runs existe")
                runs_count = Run.query.count()
                active_runs_count = Run.query.filter_by(status='active').count()
                print(f"📊 Runs total: {runs_count}, actifs: {active_runs_count}")
            else:
                print("❌ Table runs manquante")
            
            # Vérifier la table users
            if 'users' in table_names:
                print("✅ Table users existe")
                users_count = User.query.count()
                admin_count = User.query.filter_by(is_admin=True).count()
                print(f"📊 Users total: {users_count}, admins: {admin_count}")
            else:
                print("❌ Table users manquante")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur DB: {e}")
        print(traceback.format_exc())
        return False

def test_api_routes():
    """Test des routes API"""
    print("\n" + "=" * 60)
    print("🔍 TEST ROUTES API")
    print("=" * 60)
    
    try:
        from app import create_app
        from app.models import User
        from flask_jwt_extended import create_access_token
        import requests
        
        app = create_app()
        
        with app.app_context():
            # Créer un token de test
            admin_user = User.query.filter_by(is_admin=True).first()
            if not admin_user:
                print("❌ Aucun admin trouvé pour les tests")
                return False
            
            token = create_access_token(identity=admin_user.id)
            headers = {'Authorization': f'Bearer {token}'}
            
            print(f"✅ Token créé pour admin: {admin_user.username}")
            
            # Tester avec le client Flask intégré
            client = app.test_client()
            
            # Test health check
            response = client.get('/api/health')
            print(f"🏥 Health check: {response.status_code}")
            if response.status_code == 200:
                data = response.get_json()
                print(f"   Status: {data.get('status')}")
                print(f"   Database: {data.get('database')}")
            
            # Test routes endpoint
            response = client.get('/api/routes', headers=headers)
            print(f"🛣️ GET /api/routes: {response.status_code}")
            if response.status_code == 200:
                data = response.get_json()
                if data.get('status') == 'success':
                    routes_data = data.get('data', {})
                    routes_count = len(routes_data.get('routes', []))
                    print(f"   ✅ Routes récupérées: {routes_count}")
                    print(f"   📄 Pagination: {routes_data.get('pagination')}")
                else:
                    print(f"   ❌ Erreur API: {data.get('message')}")
            else:
                data = response.get_json() if response.content_type == 'application/json' else response.get_data(as_text=True)
                print(f"   ❌ Erreur {response.status_code}: {data}")
            
            # Test active runs endpoint
            response = client.get('/api/routes/active-runs', headers=headers)
            print(f"🏃 GET /api/routes/active-runs: {response.status_code}")
            if response.status_code == 200:
                data = response.get_json()
                if data.get('status') == 'success':
                    runs_count = len(data.get('data', []))
                    print(f"   ✅ Runs actifs: {runs_count}")
                else:
                    print(f"   ❌ Erreur API: {data.get('message')}")
            else:
                data = response.get_json() if response.content_type == 'application/json' else response.get_data(as_text=True)
                print(f"   ❌ Erreur {response.status_code}: {data}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur test API: {e}")
        print(traceback.format_exc())
        return False

def test_route_creation():
    """Test de création d'une route"""
    print("\n" + "=" * 60)
    print("🔍 TEST CRÉATION ROUTE")
    print("=" * 60)
    
    try:
        from app import create_app, db
        from app.models import Route, User
        
        app = create_app()
        
        with app.app_context():
            # Trouver un admin
            admin_user = User.query.filter_by(is_admin=True).first()
            if not admin_user:
                print("❌ Aucun admin pour créer la route de test")
                return False
            
            # Créer une route de test
            test_route_data = {
                'name': 'Route Test Diagnostic',
                'description': 'Route créée pour le diagnostic',
                'distance': 3.5,
                'estimated_duration': 1200,
                'difficulty': 'Facile',
                'elevation_gain': 20.0,
                'status': 'active',
                'created_by': admin_user.id
            }
            
            test_route = Route(**test_route_data)
            
            # Test des waypoints
            test_waypoints = [
                {'lat': 48.8566, 'lng': 2.3522, 'name': 'Start'},
                {'lat': 48.8576, 'lng': 2.3532, 'name': 'Middle'},
                {'lat': 48.8586, 'lng': 2.3542, 'name': 'End'}
            ]
            
            test_route.set_waypoints(test_waypoints)
            
            # Validation
            errors = test_route.validate_data()
            if errors:
                print(f"❌ Erreurs validation: {errors}")
                return False
            
            print("✅ Validation route: OK")
            
            # Test sérialisation
            route_dict = test_route.to_dict()
            print("✅ Sérialisation: OK")
            print(f"   Nom: {route_dict['name']}")
            print(f"   Distance: {route_dict['distance']}km")
            print(f"   Waypoints: {len(route_dict['waypoints'])}")
            
            # Sauvegarder en DB
            db.session.add(test_route)
            db.session.commit()
            
            print(f"✅ Route sauvegardée avec ID: {test_route.id}")
            
            # Nettoyer
            db.session.delete(test_route)
            db.session.commit()
            print("✅ Route de test supprimée")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur création route: {e}")
        print(traceback.format_exc())
        return False

def fix_common_issues():
    """Correction des problèmes courants"""
    print("\n" + "=" * 60)
    print("🔧 CORRECTION PROBLÈMES COURANTS")
    print("=" * 60)
    
    try:
        from app import create_app, db
        from app.models import Route
        
        app = create_app()
        
        with app.app_context():
            print("🔍 Vérification waypoints corrompus...")
            
            # Chercher les routes avec des waypoints problématiques
            routes = Route.query.all()
            fixed_count = 0
            
            for route in routes:
                try:
                    # Tenter de parser les waypoints
                    waypoints = route.get_waypoints()
                    
                    # Vérifier la structure
                    if waypoints:
                        for i, wp in enumerate(waypoints):
                            if not isinstance(wp, dict) or 'lat' not in wp or 'lng' not in wp:
                                print(f"   ⚠️ Waypoint {i} corrompu dans route {route.id}")
                                # Corriger en supprimant les waypoints corrompus
                                route.waypoints = None
                                fixed_count += 1
                                break
                    
                except Exception as e:
                    print(f"   ❌ Route {route.id} waypoints corrompus: {e}")
                    route.waypoints = None
                    fixed_count += 1
            
            if fixed_count > 0:
                db.session.commit()
                print(f"✅ {fixed_count} routes corrigées")
            else:
                print("✅ Aucune correction nécessaire")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur correction: {e}")
        print(traceback.format_exc())
        return False

def generate_report():
    """Génère un rapport complet"""
    print("\n" + "=" * 60)
    print("📋 RAPPORT FINAL")
    print("=" * 60)
    
    try:
        from app import create_app, db
        from app.models import Route, Run, User
        
        app = create_app()
        
        with app.app_context():
            # Statistiques générales
            routes_count = Route.query.count()
            active_routes = Route.query.filter_by(status='active').count()
            runs_count = Run.query.count()
            active_runs = Run.query.filter_by(status='active').count()
            users_count = User.query.count()
            admin_count = User.query.filter_by(is_admin=True).count()
            
            print(f"📊 STATISTIQUES:")
            print(f"   Routes total: {routes_count}")
            print(f"   Routes actives: {active_routes}")
            print(f"   Runs total: {runs_count}")
            print(f"   Runs actifs: {active_runs}")
            print(f"   Utilisateurs: {users_count}")
            print(f"   Administrateurs: {admin_count}")
            
            # Problèmes potentiels
            print(f"\n🔍 PROBLÈMES POTENTIELS:")
            
            if admin_count == 0:
                print("   ❌ Aucun administrateur - créez un admin")
            else:
                print("   ✅ Administrateurs présents")
            
            if routes_count == 0:
                print("   ⚠️ Aucune route - ajoutez des routes de test")
            else:
                print("   ✅ Routes présentes")
            
            # Test de quelques routes
            if routes_count > 0:
                problematic_routes = 0
                test_routes = Route.query.limit(5).all()
                
                for route in test_routes:
                    try:
                        route.to_dict()
                    except:
                        problematic_routes += 1
                
                if problematic_routes > 0:
                    print(f"   ⚠️ {problematic_routes} routes avec problèmes de sérialisation")
                else:
                    print("   ✅ Sérialisation des routes OK")
            
            # Recommandations
            print(f"\n💡 RECOMMANDATIONS:")
            print("   1. Redémarrez le serveur Flask avec debug:")
            print("      export FLASK_ENV=development")
            print("      export FLASK_DEBUG=1")
            print("      python app.py")
            print("   2. Vérifiez les logs du serveur dans la console")
            print("   3. Testez l'authentification JWT dans le frontend")
            print("   4. Vérifiez que le token est bien envoyé dans les headers")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur rapport: {e}")
        return False

def main():
    """Fonction principale"""
    print("🚀 DIAGNOSTIC COMPLET API ROUTES")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    success = True
    
    # Tests séquentiels
    success &= test_imports()
    success &= test_database_connection()
    success &= test_api_routes()
    success &= test_route_creation()
    success &= fix_common_issues()
    success &= generate_report()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ DIAGNOSTIC TERMINÉ AVEC SUCCÈS")
    else:
        print("❌ DIAGNOSTIC TERMINÉ AVEC DES ERREURS")
    print("=" * 60)
    
    return success

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Diagnostic interrompu par l'utilisateur")
    except Exception as e:
        print(f"\n\n💥 Erreur fatale: {e}")
        print(traceback.format_exc())