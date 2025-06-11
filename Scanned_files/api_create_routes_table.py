# api/scripts/create_routes_table.py
import os
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Ajouter le répertoire parent au chemin pour pouvoir importer les modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.route import Route
from app.models.user import User

def create_routes_table():
    """Crée la table des itinéraires et ajoute des données de test"""
    app = create_app()
    
    with app.app_context():
        try:
            # Créer toutes les tables (incluant routes)
            db.create_all()
            print("✅ Table 'routes' créée avec succès")
            
            # Vérifier s'il y a des administrateurs
            admin_user = User.query.filter_by(is_admin=True).first()
            
            if not admin_user:
                print("❌ Aucun administrateur trouvé. Créez d'abord un utilisateur admin.")
                return
            
            # Ajouter des itinéraires de test s'ils n'existent pas
            if Route.query.count() == 0:
                test_routes = [
                    {
                        'name': 'Parcours du Parc Central',
                        'description': 'Circuit autour du parc avec dénivelé modéré',
                        'distance': 5.2,
                        'estimated_duration': 1800,  # 30 minutes
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
                        'estimated_duration': 2700,  # 45 minutes
                        'difficulty': 'Moyen',
                        'status': 'active',
                        'elevation_gain': 25.0,
                        'waypoints': [
                            {'lat': 48.8566, 'lng': 2.3522, 'name': 'Départ'},
                            {'lat': 48.8576, 'lng': 2.3532, 'name': 'Centre-ville'},
                            {'lat': 48.8586, 'lng': 2.3542, 'name': 'Retour'}
                        ],
                        'created_by': admin_user.id
                    },
                    {
                        'name': 'Trail Montagne',
                        'description': 'Parcours difficile en montagne',
                        'distance': 12.3,
                        'estimated_duration': 4500,  # 75 minutes
                        'difficulty': 'Difficile',
                        'status': 'active',
                        'elevation_gain': 300.0,
                        'waypoints': [
                            {'lat': 48.8566, 'lng': 2.3522, 'name': 'Base'},
                            {'lat': 48.8576, 'lng': 2.3532, 'name': 'Sommet'},
                            {'lat': 48.8586, 'lng': 2.3542, 'name': 'Retour base'}
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
            else:
                print("ℹ️  Des itinéraires existent déjà dans la base de données")
            
            # Afficher les statistiques
            total_routes = Route.query.count()
            active_routes = Route.query.filter_by(status='active').count()
            
            print(f"\n📊 Statistiques:")
            print(f"   - Itinéraires totaux: {total_routes}")
            print(f"   - Itinéraires actifs: {active_routes}")
            print(f"\n✅ Configuration des itinéraires terminée!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur lors de la création des itinéraires: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    create_routes_table()