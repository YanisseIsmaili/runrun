# api/scripts/create_admin.py
import os
import sys
import getpass
from dotenv import load_dotenv

# Charger les variables d'environnement
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

# Ajouter le répertoire parent au chemin
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User

def create_super_admin():
    """Crée un super administrateur"""
    app = create_app()
    
    with app.app_context():
        try:
            # Vérifier la connexion à la base de données
            db.engine.connect()
            print("✅ Connexion à la base de données réussie")
            
            # Créer les tables si elles n'existent pas
            db.create_all()
            print("✅ Tables créées/vérifiées")
            
            # Demander les informations de l'admin
            print("\n🔧 Création d'un compte administrateur")
            print("-" * 40)
            
            username = input("Nom d'utilisateur: ").strip()
            if not username:
                print("❌ Le nom d'utilisateur est requis")
                return
            
            email = input("Email: ").strip()
            if not email:
                print("❌ L'email est requis")
                return
            
            password = getpass.getpass("Mot de passe: ")
            if len(password) < 6:
                print("❌ Le mot de passe doit contenir au moins 6 caractères")
                return
            
            # Vérifier si l'admin existe déjà
            existing_admin = User.query.filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_admin:
                print(f"❌ Un utilisateur avec ce nom/email existe déjà: {existing_admin.username}")
                return
            
            # Créer le super admin
            admin = User(
                username=username,
                email=email,
                first_name="Super",
                last_name="Admin",
                is_admin=True,
                is_active=True
            )
            
            # Utiliser la méthode set_password au lieu du setter
            admin.set_password(password)
            
            db.session.add(admin)
            db.session.commit()
            
            print(f"✅ Super administrateur créé avec succès!")
            print(f"   Nom d'utilisateur: {username}")
            print(f"   Email: {email}")
            print("\n🚀 Vous pouvez maintenant vous connecter à l'interface d'administration")
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False
    
    return True

if __name__ == "__main__":
    create_super_admin()