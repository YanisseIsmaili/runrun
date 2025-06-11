# api/scripts/add_route_support.py
import os
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Ajouter le répertoire parent au chemin
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import text

def add_route_support():
    """Ajoute le support des itinéraires à la base de données existante"""
    app = create_app()
    
    with app.app_context():
        try:
            # 1. Créer la table routes
            print("🔧 Création de la table routes...")
            
            create_routes_table = """
            CREATE TABLE IF NOT EXISTS routes (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                distance FLOAT NOT NULL,
                estimated_duration INTEGER,
                difficulty VARCHAR(50) NOT NULL DEFAULT 'Facile',
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                elevation_gain FLOAT,
                waypoints TEXT,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );
            """
            
            db.session.execute(text(create_routes_table))
            print("✅ Table routes créée")
            
            # 2. Ajouter la colonne route_id à la table runs si elle n'existe pas
            print("🔧 Ajout de la colonne route_id à la table runs...")
            
            try:
                add_route_id_column = """
                ALTER TABLE runs 
                ADD COLUMN route_id INTEGER,
                ADD COLUMN status VARCHAR(20) DEFAULT 'finished',
                ADD COLUMN avg_heart_rate INTEGER,
                ADD COLUMN max_heart_rate INTEGER,
                ADD COLUMN elevation_gain FLOAT,
                ADD COLUMN current_position TEXT,
                ADD FOREIGN KEY (route_id) REFERENCES routes(id);
                """
                
                db.session.execute(text(add_route_id_column))
                print("✅ Colonnes ajoutées à la table runs")
                
            except Exception as e:
                if "Duplicate column name" in str(e):
                    print("ℹ️  Les colonnes existent déjà dans la table runs")
                else:
                    print(f"⚠️  Erreur lors de l'ajout des colonnes: {e}")
            
            # 3. Créer un utilisateur admin s'il n'existe pas
            from app.models.user import User
            
            admin_user = User.query.filter_by(is_admin=True).first()
            if not admin_user:
                admin_user = User(
                    username='admin',
                    email='admin@example.com',
                    password='admin123',
                    first_name='Admin',
                    last_name='System',
                    is_admin=True
                )
                db.session.add(admin_user)
                db.session.commit()
                print("✅ Utilisateur admin créé")
            
            # 4. Ajouter des itinéraires de test
            from app.models.route import Route
            
            if Route.query.count() == 0:
                test_routes = [
                    {
                        'name': 'Parcours du Parc Central',
                        'description': 'Circuit autour du parc avec dénivelé modéré',
                        'distance': 5.2,
                        'estimated_duration': 1800,
                        'difficulty': 'Facile',
                        'status': 'active',
                        'elevation_gain': 50.0,
                        'waypoints': [
                            {'lat': 48.8566, 'lng': 2.3522, 'name': 'Départ'},
                            {'lat': 48.8576, 'lng': 2.3532, 'name': 'Point 1'},
                            {'lat': 48.8586, 'lng': 2.3542, 'name': 'Arrivée'}
                        ],
                        'created_by': admin_user.id
                    },
                    {
                        'name': 'Circuit Urbain',
                        'description': 'Parcours en ville avec plusieurs arrêts',
                        'distance': 8.5,
                        'estimated_duration': 2700,
                        'difficulty': 'Moyen',
                        'status': 'active',
                        'elevation_gain': 25.0,
                        'waypoints': [
                            {'lat': 48.8566, 'lng': 2.3522, 'name': 'Départ'},
                            {'lat': 48.8576, 'lng': 2.3532, 'name': 'Centre-ville'},
                            {'lat': 48.8586, 'lng': 2.3542, 'name': 'Retour'}
                        ],
                        'created_by': admin_user.id
                    }
                ]
                
                for route_data in test_routes:
                    route = Route(
                        name=route_data['name'],
                        description=route_data['description'],
                        distance=route_data['distance'],
                        estimated_duration=route_data['estimated_duration'],
                        difficulty=route_data['difficulty'],
                        status=route_data['status'],
                        elevation_gain=route_data['elevation_gain'],
                        created_by=route_data['created_by']
                    )
                    route.waypoints = route_data['waypoints']
                    db.session.add(route)
                
                db.session.commit()
                print(f"✅ {len(test_routes)} itinéraires de test créés")
            
            print("\n📊 Migration terminée avec succès!")
            print(f"   - Itinéraires: {Route.query.count()}")
            print(f"   - Utilisateurs: {User.query.count()}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur lors de la migration: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    add_route_support()