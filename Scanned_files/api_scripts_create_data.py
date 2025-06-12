import os
import sys
import pymysql
from datetime import datetime
from dotenv import load_dotenv

# Charger les variables d'environnement du fichier .env
load_dotenv()

# Récupérer les informations de connexion depuis les variables d'environnement
DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME")

def create_stats_table_if_not_exists(conn):
    """Crée la table des statistiques si elle n'existe pas déjà"""
    with conn.cursor() as cursor:
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS global_stats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            total_users INT NOT NULL,
            active_users INT NOT NULL,
            total_runs INT NOT NULL,
            total_distance FLOAT NOT NULL,
            average_pace FLOAT NOT NULL,
            runs_this_month INT NOT NULL,
            distance_this_month FLOAT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
    conn.commit()

def insert_stats_data():
    """Insère les données statistiques dans la base de données MySQL"""
    try:
        # Connexion à la base de données MySQL
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USERNAME,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )
        
        print(f"Connexion réussie à la base de données MySQL: {DB_HOST}:{DB_PORT}/{DB_NAME}")
        
        # Création de la table si nécessaire
        create_stats_table_if_not_exists(conn)
        
        # Données à insérer (correspondant à statsData dans votre code React)
        stats_data = {
            "total_users": 150,
            "active_users": 75,
            "total_runs": 520,
            "total_distance": 3250,
            "average_pace": 5.2,
            "runs_this_month": 120,
            "distance_this_month": 750
        }
        
        # Insertion des données
        with conn.cursor() as cursor:
            cursor.execute('''
            INSERT INTO global_stats (
                total_users, active_users, total_runs, total_distance, 
                average_pace, runs_this_month, distance_this_month, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                stats_data["total_users"],
                stats_data["active_users"],
                stats_data["total_runs"],
                stats_data["total_distance"],
                stats_data["average_pace"],
                stats_data["runs_this_month"],
                stats_data["distance_this_month"],
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ))
        
        # Validation des changements
        conn.commit()
        
        print("Données statistiques insérées avec succès!")
        
        # Fermeture de la connexion
        conn.close()
        return True
        
    except Exception as e:
        print(f"Erreur lors de l'insertion des données: {e}")
        return False

if __name__ == "__main__":
    success = insert_stats_data()
    sys.exit(0 if success else 1)