#!/usr/bin/env python3
# test_login.py - Script pour tester la connexion
import sys
import os
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User

def test_user_creation():
    """Test de création d'utilisateur"""
    app = create_app()
    
    with app.app_context():
        try:
            # Supprimer l'utilisateur test s'il existe
            existing_user = User.query.filter_by(email='yanisse@gmail.com').first()
            if existing_user:
                db.session.delete(existing_user)
                db.session.commit()
                print("🗑️ Utilisateur existant supprimé")
            
            # Créer un nouvel utilisateur test
            test_user = User(
                username='yanisse',
                email='yanisse@gmail.com',
                first_name='Yanisse',
                last_name='Test',
                is_active=True,
                is_admin=False
            )
            
            # Utiliser set_password
            test_user.set_password('password123')
            
            db.session.add(test_user)
            db.session.commit()
            
            print(f"✅ Utilisateur créé: {test_user.username}")
            print(f"   Email: {test_user.email}")
            print(f"   Actif: {test_user.is_active}")
            print(f"   Hash mot de passe: {test_user.password_hash[:20]}...")
            
            # Test de vérification du mot de passe
            test_password = 'password123'
            verify_result = test_user.verify_password(test_password)
            print(f"✅ Vérification mot de passe '{test_password}': {verify_result}")
            
            # Test avec mauvais mot de passe
            wrong_password = 'wrongpassword'
            wrong_verify = test_user.verify_password(wrong_password)
            print(f"❌ Vérification mot de passe '{wrong_password}': {wrong_verify}")
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            db.session.rollback()
            return False

def test_login_simulation():
    """Simulation du processus de login"""
    app = create_app()
    
    with app.app_context():
        try:
            # Chercher l'utilisateur
            email = 'yanisse@gmail.com'
            password = 'password123'
            
            print(f"\n🔍 Test de connexion pour: {email}")
            
            user = User.query.filter_by(email=email.lower()).first()
            
            if not user:
                print(f"❌ Utilisateur non trouvé: {email}")
                return False
            
            print(f"✅ Utilisateur trouvé: {user.username}")
            
            # Test de vérification du mot de passe
            if user.verify_password(password):
                print(f"✅ Mot de passe correct")
                print(f"✅ Compte actif: {user.is_active}")
                print(f"✅ LOGIN RÉUSSI pour {user.username}")
                return True
            else:
                print(f"❌ Mot de passe incorrect")
                return False
                
        except Exception as e:
            print(f"❌ Erreur simulation: {e}")
            return False

def list_all_users():
    """Liste tous les utilisateurs"""
    app = create_app()
    
    with app.app_context():
        try:
            users = User.query.all()
            print(f"\n📊 {len(users)} utilisateur(s) en base:")
            
            for user in users:
                print(f"   - ID: {user.id}, Username: {user.username}, Email: {user.email}, Actif: {user.is_active}")
                
        except Exception as e:
            print(f"❌ Erreur liste: {e}")

if __name__ == "__main__":
    print("🧪 TEST DE CONNEXION")
    print("=" * 50)
    
    # Liste des utilisateurs existants
    list_all_users()
    
    # Test de création d'utilisateur
    print("\n1. Test de création d'utilisateur:")
    test_user_creation()
    
    # Test de simulation de login
    print("\n2. Test de simulation de login:")
    test_login_simulation()
    
    print("\n" + "=" * 50)
    print("✅ Tests terminés")