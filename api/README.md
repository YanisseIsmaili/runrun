# Running App API

Backend API pour l'application de running développée avec Flask et MySQL.

## Installation

1. Assurez-vous que MAMP est installé et en cours d'exécution
2. Créez une base de données MySQL nommée `running_app_db`
3. Installez les dépendances Python:
pip install -r requirements.txt
Copier4. Configurez vos variables d'environnement dans un fichier `.env` (voir .env.example)
5. Initialisez la base de données:
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
Copier
## Lancement du serveur
python run.py
Copier
Le serveur sera accessible à l'adresse http://localhost:5000

## Endpoints API

### Authentification
- POST /api/auth/register - Inscription d'un nouvel utilisateur
- POST /api/auth/login - Connexion d'un utilisateur
- POST /api/auth/refresh - Rafraîchissement du token JWT

### Utilisateurs
- GET /api/users/profile - Récupération du profil de l'utilisateur connecté
- PUT /api/users/profile - Mise à jour du profil de l'utilisateur connecté

### Courses
- POST /api/runs - Enregistrement d'une nouvelle course
- GET /api/runs - Récupération de toutes les courses de l'utilisateur
- GET /api/runs/<id> - Récupération d'une course spécifique
- DELETE /api/runs/<id> - Suppression d'une course

### Statistiques
- GET /api/stats - Récupération des statistiques globales de l'utilisateur