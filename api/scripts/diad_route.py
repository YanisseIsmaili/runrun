#!/usr/bin/env python3
# diagnostic_routes.py

import pymysql
import requests
import json
import traceback
from datetime import datetime

def test_database():
    """Test de connexion et structure de la base de données"""
    print("=" * 50)
    print("🔍 TEST BASE DE DONNÉES")
    print("=" * 50)
    
    try:
        connection = pymysql.connect(
            host='192.168.0.47',
            user='root',
            password='root',
            database='running_app_db',
            port=3306
        )
        
        print("✅ Connexion DB réussie")
        
        with connection.cursor() as cursor:
            # Vérifier les tables
            cursor.execute("SHOW TABLES")
            tables = [table[0] for table in cursor.fetchall()]
            print(f"📋 Tables trouvées: {tables}")
            
            if 'routes' in tables:
                # Structure de la table routes
                cursor.execute("DESCRIBE routes")
                columns = cursor.fetchall()
                print("\n📝 Structure table 'routes':")
                for col in columns:
                    print(f"   {col[0]} - {col[1]} {'(NULL)' if col[2] == 'YES' else '(NOT NULL)'}")
                
                # Données dans routes
                cursor.execute("SELECT COUNT(*) FROM routes")
                count = cursor.fetchone()[0]
                print(f"\n📊 Nombre de routes: {count}")
                
                if count > 0:
                    cursor.execute("SELECT id, name, distance, status FROM routes LIMIT 3")
                    sample_routes = cursor.fetchall()
                    print("\n🔍 Échantillon routes:")
                    for route in sample_routes:
                        print(f"   ID {route[0]}: {route[1]} ({route[2]}km) - {route[3]}")
                        
                    # Vérifier les waypoints problématiques
                    cursor.execute("SELECT id, waypoints FROM routes WHERE waypoints IS NOT NULL LIMIT 3")
                    waypoint_routes = cursor.fetchall()
                    print("\n🗺️ Vérification waypoints:")
                    for route in waypoint_routes:
                        try:
                            if route[1]:
                                waypoints = json.loads(route[1])
                                print(f"   Route {route[0]}: {len(waypoints)} waypoints ✅")
                        except json.JSONDecodeError as e:
                            print(f"   Route {route[0]}: JSON invalide ❌ - {e}")
            
            if 'runs' in tables:
                cursor.execute("SELECT COUNT(*) FROM runs")
                runs_count = cursor.fetchone()[0]
                print(f"\n🏃 Nombre de runs: {runs_count}")
                
                if runs_count > 0:
                    cursor.execute("SELECT COUNT(*) FROM runs WHERE status = 'active'")
                    active_runs = cursor.fetchone()[0]
                    print(f"🏃‍♂️ Runs actifs: {active_runs}")
        
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur DB: {e}")
        return False

def test_api_endpoints():
    """Test des endpoints API"""
    print("\n" + "=" * 50)
    print("🌐 TEST ENDPOINTS API")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        print(f"🏥 Health check: {response.status_code}")
        if response.status_code == 200:
            health_data = response.json()
            print(f"   Status: {health_data.get('status')}")
            print(f"   Database: {health_data.get('database')}")
        else:
            print(f"   Erreur: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check échoué: {e}")
        return False
    
    # Pour tester les routes protégées, il faudrait un token
    # Ici on teste juste la connectivité
    
    try:
        # Test endpoint routes (sans auth pour voir l'erreur)
        response = requests.get(f"{base_url}/api/routes", timeout=5)
        print(f"🛣️ Routes endpoint: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Protection JWT active (401 attendu sans token)")
        elif response.status_code == 500:
            print("   ❌ Erreur serveur 500")
            try:
                error_data = response.json()
                print(f"   Erreur: {error_data.get('message', 'Inconnue')}")
            except:
                print(f"   Réponse: {response.text}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Test routes échoué: {e}")
    
    try:
        # Test endpoint active-runs
        response = requests.get(f"{base_url}/api/routes/active-runs", timeout=5)
        print(f"🏃 Active runs endpoint: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Protection JWT active (401 attendu sans token)")
        elif response.status_code == 500:
            print("   ❌ Erreur serveur 500")
            try:
                error_data = response.json()
                print(f"   Erreur: {error_data.get('message', 'Inconnue')}")
            except:
                print(f"   Réponse: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Test active-runs échoué: {e}")

def check_server_logs():
    """Suggestions pour vérifier les logs serveur"""
    print("\n" + "=" * 50)
    print("📋 VÉRIFICATIONS SERVEUR")
    print("=" * 50)
    
    print("🔍 Pour diagnostiquer plus, vérifiez:")
    print("   1. Logs du serveur Flask dans votre terminal")
    print("   2. Redémarrez le serveur avec debug activé:")
    print("      export FLASK_ENV=development")
    print("      export FLASK_DEBUG=1")
    print("      python app.py")
    print("   3. Vérifiez que toutes les migrations sont appliquées:")
    print("      flask db upgrade")
    print("   4. Testez la connexion DB directement avec le script fourni")

def main():
    """Diagnostic principal"""
    print("🚀 DIAGNOSTIC API ROUTES")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test base de données
    db_ok = test_database()
    
    # Test API seulement si DB OK
    if db_ok:
        test_api_endpoints()
    
    # Suggestions
    check_server_logs()
    
    print("\n" + "=" * 50)
    print("✅ DIAGNOSTIC TERMINÉ")
    print("=" * 50)

if __name__ == "__main__":
    main()