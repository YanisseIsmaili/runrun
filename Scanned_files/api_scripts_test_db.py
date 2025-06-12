import pymysql

try:
    # Paramètres de connexion
    connection = pymysql.connect(
        host='192.168.0.47',
        user='root',
        password='root',
        database='running_app_db',
        port=3306
    )
    
    # Si la connexion réussit
    print("Connexion à la base de données réussie!")
    
    # Exécuter une requête simple
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"Résultat de la requête: {result}")
    
    # Fermer la connexion
    connection.close()
    
except Exception as e:
    print(f"Erreur de connexion à la base de données: {e}")