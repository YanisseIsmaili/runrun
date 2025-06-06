#!/usr/bin/env python3
import os
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

from app import create_app, db
from app.models.user import User
from app.models.run import Run
from datetime import datetime, timedelta
import random

def create_test_data():
    app = create_app()
    with app.app_context():
        print("Création des données de test...")
        
        # Créer des utilisateurs de test
        users_data = [
            {'username': 'alex', 'email': 'alex@test.com', 'first_name': 'Alexandre', 'last_name': 'Dupont'},
            {'username': 'sophie', 'email': 'sophie@test.com', 'first_name': 'Sophie', 'last_name': 'Martin'},
            {'username': 'thomas', 'email': 'thomas@test.com', 'first_name': 'Thomas', 'last_name': 'Bernard'},
            {'username': 'julie', 'email': 'julie@test.com', 'first_name': 'Julie', 'last_name': 'Leclerc'},
            {'username': 'mathieu', 'email': 'mathieu@test.com', 'first_name': 'Mathieu', 'last_name': 'Petit'}
        ]
        
        created_users = []
        for user_data in users_data:
            # Vérifier si l'utilisateur existe déjà
            existing_user = User.query.filter_by(username=user_data['username']).first()
            if not existing_user:
                user = User(
                    username=user_data['username'],
                    email=user_data['email'],
                    password='password123',
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    is_admin=False
                )
                db.session.add(user)
                created_users.append(user)
            else:
                created_users.append(existing_user)
        
        db.session.commit()
        print(f"✅ {len(created_users)} utilisateurs créés/trouvés")
        
        # Créer des courses de test
        total_runs = 0
        for user in created_users:
            # Créer 15-25 courses par utilisateur sur les 30 derniers jours
            num_runs = random.randint(15, 25)
            
            for i in range(num_runs):
                # Date aléatoire dans les 30 derniers jours
                days_ago = random.randint(0, 30)
                run_date = datetime.utcnow() - timedelta(days=days_ago)
                
                # Paramètres de course réalistes
                distance = random.randint(3000, 20000)  # 3-20 km en mètres
                duration = int(distance / random.uniform(3.0, 5.5))  # Vitesse 3-5.5 m/s
                avg_speed = distance / duration if duration > 0 else 0
                
                run = Run(
                    user_id=user.id,
                    start_time=run_date,
                    end_time=run_date + timedelta(seconds=duration),
                    duration=duration,
                    distance=distance,
                    avg_speed=avg_speed,
                    max_speed=avg_speed * random.uniform(1.1, 1.3),
                    calories=int(distance * 0.06)  # Approximation calories
                )
                db.session.add(run)
                total_runs += 1
        
        db.session.commit()
        print(f"✅ {total_runs} courses créées")
        
        # Afficher les statistiques
        total_users = User.query.count()
        total_runs_db = Run.query.count()
        total_distance = db.session.query(db.func.sum(Run.distance)).scalar() or 0
        
        print(f"\n📊 Statistiques finales:")
        print(f"   - Utilisateurs: {total_users}")
        print(f"   - Courses: {total_runs_db}")
        print(f"   - Distance totale: {total_distance/1000:.1f} km")
        print(f"\n✅ Données de test créées avec succès!")

if __name__ == "__main__":
    create_test_data()