import os
import sys
import dotenv

# Charger les variables d'environnement depuis le fichier .env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(dotenv_path):
    dotenv.load_dotenv(dotenv_path)

# Ajouter le répertoire parent au chemin pour pouvoir importer les modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurer l'URL de la base de données pour utiliser MySQL
# Récupérer les variables depuis .env ou utiliser des valeurs par défaut
DB_USERNAME = os.getenv('DB_USERNAME', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'root')
DB_HOST = os.getenv('DB_HOST', '192.168.0.47')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_NAME = os.getenv('DB_NAME', 'running_app_db')

# Construire l'URL de connexion MySQL
os.environ['DATABASE_URL'] = f'mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

print(f"URL de la base de données: {os.environ['DATABASE_URL']}")

from app import create_app, db
from app.models.user import User

def create_super_admin(username, email, password):
    # Créer l'application Flask avec la configuration adaptée
    app = create_app()
    
    with app.app_context():
        try:
            # Vérifier la connexion à la base de données
            db.engine.connect()
            print("✅ Connexion à la base de données réussie")
            
            # Vérifier si les tables existent, sinon les créer
            db.create_all()
            
            # Vérifier si l'admin existe déjà
            existing_admin = User.query.filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_admin:
                print(f"Un utilisateur avec ce nom/email existe déjà: {existing_admin.username}")
                return
                
            # Créer le super admin
            admin = User(
                username=username,
                email=email,
                password=password,
                is_admin=True,
                first_name="Admin",  # Ajouter des valeurs par défaut
                last_name="Super",   # pour first_name et last_name
            )
            
            # Ajouter un rôle si la colonne existe
            if hasattr(admin, 'role'):
                admin.role = 'super_admin'
            
            # Sauvegarder dans la base de données
            db.session.add(admin)
            db.session.commit()
            print(f"Super admin créé avec succès: {username}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur lors de la création de l'administrateur: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python create_admin.py <username> <email> <password>")
        sys.exit(1)
        
    username, email, password = sys.argv[1], sys.argv[2], sys.argv[3]
    create_super_admin(username, email, password)