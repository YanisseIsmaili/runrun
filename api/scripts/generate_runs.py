#!/usr/bin/env python3
# scripts/generate_runs.py
import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from faker import Faker
from app import create_app, db
from app.models.user import User
from app.models.run import Run
from app.models.route import Route

fake = Faker('fr_FR')

def generate_runs(count=10):
    """Génère des courses fictives"""
    app = create_app()
    
    with app.app_context():
        users = User.query.filter_by(is_active=True).all()
        routes = Route.query.filter_by(status='active').all()
        
        if not users:
            print("❌ Aucun utilisateur trouvé. Créez d'abord des utilisateurs.")
            return
        
        print(f"🔄 Génération de {count} courses pour {len(users)} utilisateurs...")
        
        runs_created = 0
        
        for i in range(count):
            try:
                user = random.choice(users)
                route = random.choice(routes) if routes and random.random() > 0.3 else None
                
                # Date de course (derniers 6 mois)
                start_time = fake.date_time_between(start_date='-6M', end_date='now')
                
                # Distance (500m à 25km)
                if route:
                    distance = route.distance + random.uniform(-200, 200)
                else:
                    distance = random.uniform(500, 25000)
                distance = max(500, distance)
                
                # Durée basée sur distance + variabilité
                base_pace = random.uniform(4, 8)  # min/km
                duration = int((distance / 1000) * base_pace * 60)  # secondes
                duration += random.randint(-300, 600)  # variabilité
                
                end_time = start_time + timedelta(seconds=duration)
                
                # Vitesses
                avg_speed = (distance / 1000) / (duration / 3600)  # km/h
                max_speed = avg_speed * random.uniform(1.1, 1.5)
                
                # Autres données
                elevation_gain = random.uniform(0, distance / 50) if random.random() > 0.4 else 0
                calories = int(distance * random.uniform(0.04, 0.08))
                
                run = Run(
                    user_id=user.id,
                    route_id=route.id if route else None,
                    start_time=start_time,
                    end_time=end_time,
                    duration=duration,
                    distance=distance,
                    avg_speed=avg_speed,
                    max_speed=max_speed,
                    status='finished',
                    elevation_gain=elevation_gain,
                    calories_burned=calories,
                    avg_heart_rate=random.randint(120, 180) if random.random() > 0.3 else None,
                    max_heart_rate=random.randint(150, 200) if random.random() > 0.3 else None,
                    weather_conditions='Ensoleillé' if random.random() > 0.7 else None,
                    notes=fake.sentence() if random.random() > 0.8 else None,
                    created_at=start_time,
                    updated_at=start_time
                )
                
                db.session.add(run)
                runs_created += 1
                
                if runs_created % 50 == 0:
                    print(f"✅ {runs_created} courses créées...")
                    
            except Exception as e:
                print(f"❌ Erreur course {i}: {e}")
                continue
        
        db.session.commit()
        print(f"🎉 {runs_created} courses créées")
        
        # Stats
        total_distance = db.session.query(db.func.sum(Run.distance)).scalar() or 0
        avg_distance = total_distance / runs_created if runs_created > 0 else 0
        print(f"📊 Distance totale: {total_distance/1000:.1f}km")
        print(f"📊 Distance moyenne: {avg_distance/1000:.2f}km")

if __name__ == '__main__':
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    generate_runs(count)