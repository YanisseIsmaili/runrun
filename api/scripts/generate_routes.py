#!/usr/bin/env python3
# scripts/generate_routes.py
import sys
import os
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from faker import Faker
from app import create_app, db
from app.models.user import User
from app.models.route import Route

fake = Faker('fr_FR')

def generate_routes(count=10):
    """Génère des parcours fictifs"""
    app = create_app()
    
    with app.app_context():
        admin_users = User.query.filter_by(is_admin=True).all()
        if not admin_users:
            print("❌ Aucun admin trouvé.")
            return
        
        route_types = [
            'Circuit Urbain', 'Parcours Nature', 'Trail Forêt', 'Route Côtière',
            'Boucle Parc', 'Sentier Montagne', 'Piste Cyclable', 'Tour Ville'
        ]
        
        difficulties = ['Facile', 'Moyen', 'Difficile']
        surfaces = ['Asphalte', 'Terre', 'Sentier', 'Mixte']
        
        print(f"🔄 Génération de {count} parcours...")
        
        routes_created = 0
        
        for i in range(count):
            try:
                route_type = random.choice(route_types)
                location = fake.city()
                name = f"{route_type} {location}"
                
                distance = random.uniform(1000, 20000)  # 1-20km
                difficulty = random.choice(difficulties)
                surface = random.choice(surfaces)
                
                # Durée estimée basée sur distance
                base_pace = 5 if difficulty == 'Facile' else 5.5 if difficulty == 'Moyen' else 6
                estimated_duration = int((distance / 1000) * base_pace * 60)
                
                route = Route(
                    name=name,
                    description=fake.text(max_nb_chars=200),
                    distance=distance,
                    estimated_duration=estimated_duration,
                    difficulty=difficulty,
                    status='active',
                    elevation_gain=random.uniform(0, distance/20),
                    surface_type=surface,
                    created_by=random.choice(admin_users).id,
                    tags=f"{difficulty.lower()},{surface.lower()},{route_type.lower().replace(' ', '_')}"
                )
                
                db.session.add(route)
                routes_created += 1
                
            except Exception as e:
                print(f"❌ Erreur parcours {i}: {e}")
                continue
        
        db.session.commit()
        print(f"🎉 {routes_created} parcours créés")

if __name__ == '__main__':
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    generate_routes(count)