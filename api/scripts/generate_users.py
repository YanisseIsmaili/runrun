#!/usr/bin/env python3
# scripts/generate_users.py
import sys
import os
from datetime import datetime, timedelta
import random

# Ajouter le répertoire parent au chemin
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from faker import Faker
from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models.user import User

fake = Faker('fr_FR')

def generate_users(count=10):
    """Génère des utilisateurs fictifs"""
    app = create_app()
    
    with app.app_context():
        print(f"🔄 Génération de {count} utilisateurs...")
        
        users_created = 0
        
        for i in range(count):
            try:
                # Données de base
                first_name = fake.first_name()
                last_name = fake.last_name()
                username = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}"
                email = f"{username}@{fake.domain_name()}"
                
                # Vérifier unicité
                if User.query.filter_by(username=username).first() or \
                   User.query.filter_by(email=email).first():
                    continue
                
                # Créer utilisateur
                user = User(
                    username=username,
                    email=email,
                    password_hash=generate_password_hash('password123'),
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=65),
                    height=random.uniform(150, 200),
                    weight=random.uniform(50, 100),
                    is_admin=False,
                    is_active=random.choice([True, True, True, False]),  # 75% actifs
                    created_at=fake.date_time_between(start_date='-2y', end_date='now'),
                    last_login=fake.date_time_between(start_date='-30d', end_date='now') if random.random() > 0.3 else None
                )
                
                db.session.add(user)
                users_created += 1
                
                if users_created % 10 == 0:
                    print(f"✅ {users_created} utilisateurs créés...")
                    
            except Exception as e:
                print(f"❌ Erreur utilisateur {i}: {e}")
                continue
        
        
        db.session.commit()
        print(f"🎉 {users_created} utilisateurs créés ")

if __name__ == '__main__':
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    generate_users(count)