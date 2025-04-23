import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User

def create_super_admin(username, email, password):
    app = create_app()
    with app.app_context():
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
            role='super_admin'
        )
        
        db.session.add(admin)
        db.session.commit()
        print(f"Super admin créé avec succès: {username}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python create_admin.py <username> <email> <password>")
        sys.exit(1)
        
    username, email, password = sys.argv[1], sys.argv[2], sys.argv[3]
    create_super_admin(username, email, password)