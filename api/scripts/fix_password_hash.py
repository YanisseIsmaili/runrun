# fix_password_hash.py - À placer dans api/
from app import create_app, db
from sqlalchemy import text

def fix_password_hash_column():
    app = create_app()
    
    with app.app_context():
        try:
            print("🔧 Agrandissement de la colonne password_hash...")
            
            # Agrandir la colonne password_hash de 128 à 255 caractères
            db.session.execute(text(
                "ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255)"
            ))
            
            db.session.commit()
            print("✅ Colonne password_hash agrandie à 255 caractères")
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            db.session.rollback()

if __name__ == "__main__":
    fix_password_hash_column()