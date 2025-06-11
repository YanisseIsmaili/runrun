# api/fix_database.py
import os
import sys
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def fix_users_table():
    """Ajoute les colonnes manquantes à la table users"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔧 Ajout des colonnes manquantes à la table users...")
            
            # Ajouter la colonne is_active
            try:
                db.session.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
                print("✅ Colonne is_active ajoutée")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    print("ℹ️  Colonne is_active existe déjà")
                else:
                    print(f"⚠️  Erreur is_active: {e}")
            
            # Vérifier et ajouter d'autres colonnes potentiellement manquantes
            missing_columns = [
                ("last_login", "DATETIME"),
                ("created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"),
                ("updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
            ]
            
            for column_name, column_type in missing_columns:
                try:
                    db.session.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                    print(f"✅ Colonne {column_name} ajoutée")
                except Exception as e:
                    if "Duplicate column name" in str(e):
                        print(f"ℹ️  Colonne {column_name} existe déjà")
                    else:
                        print(f"⚠️  Erreur {column_name}: {e}")
            
            db.session.commit()
            print("🎉 Table users mise à jour avec succès!")
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            db.session.rollback()

if __name__ == "__main__":
    fix_users_table()