# Document préparatoire - Application de Running

## 1. Rappel du projet

### 1.1 Description
Notre projet consiste à développer une application mobile de suivi de course à pied qui permet aux utilisateurs de :
- Suivre leur itinéraire en temps réel via GPS
- Enregistrer leurs performances (distance, temps, vitesse)
- Consulter leur historique de courses
- Recevoir des exercices quotidiens personnalisés

Une interface web est également développée pour permettre aux administrateurs de :
- Visualiser les statistiques globales des utilisateurs
- Gérer les utilisateurs et leurs données
- Analyser les tendances et performances

### 1.2 Objectifs
- Fournir un outil de suivi de performance pour les coureurs
- Offrir une interface d'administration complète
- Assurer la sécurité des données utilisateurs
- Respecter les normes RGPD
m
## 2. Modèle de données actuel

### 2.1 Entités principales

#### User
```python
{
    "id": UUID,
    "username": String,
    "email": String,
    "password_hash": String,
    "first_name": String,
    "last_name": String,
    "date_of_birth": Date,
    "height": Float,
    "weight": Float,
    "created_at": DateTime,
    "updated_at": DateTime
}
```

#### Run
```python
{
    "id": UUID,
    "user_id": UUID (FK),
    "start_time": DateTime,
    "end_time": DateTime,
    "distance": Float,
    "duration": Integer,
    "average_speed": Float,
    "calories": Integer,
    "route_data": JSON/GeoJSON,
    "weather_conditions": String,
    "created_at": DateTime
}
```

#### Exercise
```python
{
    "id": UUID,
    "title": String,
    "description": String,
    "difficulty": Enum (Facile/Modéré/Difficile),
    "type": Enum (light_run/interval/long_run/recovery/strength),
    "duration": Integer,
    "created_at": DateTime
}
```

### 2.2 Relations
- Un utilisateur peut avoir plusieurs courses (1:N)
- Un utilisateur peut avoir plusieurs exercices recommandés (N:M)
- Les courses contiennent des données de localisation dans route_data

## 3. Répartition des rôles

### 3.1 Full Stack Developer
- **Responsabilités principales** :
  - Développement de l'application mobile
  - Création de l'API backend
  - Mise en place de l'interface web d'administration
  - Intégration du système de géolocalisation
  - Sécurisation de l'application

### 3.2 UI/UX Designer (si applicable)
- Conception des interfaces utilisateur
- Création des wireframes et prototypes
- Tests d'utilisabilité

### 3.3 DevOps (si applicable)
- Déploiement des applications
- Configuration des environnements
- Maintenance des serveurs

## 4. Technologies choisies

### 4.1 Application mobile
- **Framework** : React Native avec Expo
- **Navigation** : React Navigation
- **Gestion d'état** : Context API
- **Géolocalisation** : expo-location
- **Cartographie** : react-native-maps
- **Stockage local** : AsyncStorage
- **Notifications** : expo-notifications

### 4.2 Backend (API)
- **Framework** : Python Flask
- **Base de données** : SQLite (développement) / PostgreSQL (production)
- **ORM** : SQLAlchemy
- **Authentification** : JWT (Flask-JWT-Extended)
- **Validation** : Marshmallow
- **CORS** : Flask-CORS

### 4.3 Interface web d'administration
- **Framework** : React avec Vite
- **UI Framework** : Tailwind CSS
- **Graphiques** : Chart.js / Recharts
- **Formulaires** : React Hook Form
- **Routing** : React Router v6
- **HTTP Client** : Axios
- **Tables** : React Table
- **Icônes** : Heroicons

### 4.4 Infrastructure
- **Développement** : Environnement local
- **Tests** : Jest (frontend) / pytest (backend)
- **CI/CD** : GitHub Actions (recommandé)
- **Hébergement** : 
  - Backend : Heroku / DigitalOcean / AWS
  - Web admin : Vercel / Netlify
  - Mobile : Expo Build Service + App Store / Google Play

### 4.5 Sécurité
- **HTTPS** : SSL/TLS pour toutes les communications
- **Authentification** : JWT avec refresh tokens
- **Validation des données** : Côté client et serveur
- **Protection CSRF** : Tokens CSRF
- **Sanitization** : Protection contre les injections
- **RGPD** : Consentement explicite, droit à l'oubli, export des données

## 5. État d'avancement

### 5.1 Réalisé
- Architecture globale du projet
- Modèle de données
- API backend (authentification, gestion des courses, statistiques)
- Application mobile (authentification, tracking GPS, historique)
- Structure de base de l'interface d'administration

### 5.2 En cours
- Amélioration de l'interface utilisateur mobile
- Développement complet de l'interface d'administration
- Tests unitaires et d'intégration
- Optimisation des performances

### 5.3 À venir
- Déploiement sur les plateformes de production
- Tests utilisateurs
- Documentation complète
- Mise en place du CI/CD

## 6. Défis techniques identifiés

1. **Précision du tracking GPS**
   - Solution : Utilisation de filtres Kalman pour lisser les données
   - Implémentation d'un système de détection des arrêts

2. **Performance avec de grandes quantités de données**
   - Solution : Pagination des requêtes
   - Mise en cache des résultats fréquemment accédés

3. **Synchronisation hors ligne**
   - Solution : Queue de synchronisation avec reprise automatique
   - Stockage local des courses non synchronisées

4. **Sécurité des données de santé**
   - Solution : Chiffrement des données sensibles
   - Conformité RGPD avec consentement explicite

## 7. Architecture technique

### 7.1 Architecture générale
```
[Application Mobile] <---> [API Flask] <---> [Base de données]
                              ^
                              |
                     [Interface Web Admin]
```

### 7.2 Flux de données
1. L'utilisateur lance une course sur l'application mobile
2. Les données GPS sont collectées en temps réel
3. À la fin de la course, les données sont envoyées à l'API
4. L'API stocke les données dans la base de données
5. L'interface admin peut accéder aux données via l'API

## 8. Points d'attention pour la démo

1. **Fonctionnalités à démontrer** :
   - Inscription/Connexion d'un utilisateur
   - Démarrage et enregistrement d'une course
   - Visualisation de l'historique
   - Interface d'administration avec statistiques
   - Gestion des utilisateurs

2. **Scénario de démonstration** :
   - Création d'un compte utilisateur
   - Simulation d'une course (mode démo)
   - Consultation des statistiques sur l'interface admin
   - Modification des données utilisateur

3. **Points techniques à souligner** :
   - Sécurité et authentification
   - Performance du tracking GPS
   - Réactivité de l'interface
   - Visualisation des données

---

*Ce document servira de base pour la présentation lors de la soutenance finale. Il sera enrichi avec des captures d'écran, des diagrammes détaillés et des métriques de performance.*
