# app/models/route.py - Modèle Route complet avec debug

from datetime import datetime
import json
import logging
from app import db

logger = logging.getLogger(__name__)

class Route(db.Model):
    __tablename__ = 'routes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    distance = db.Column(db.Float, nullable=False)
    estimated_duration = db.Column(db.Integer)  # en secondes
    difficulty = db.Column(db.String(50), default='Facile')
    elevation_gain = db.Column(db.Float)  # en mètres
    waypoints = db.Column(db.Text)  # JSON string
    status = db.Column(db.String(20), default='active')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    runs = db.relationship('Run', backref='route', lazy=True)
    creator = db.relationship('User', backref='created_routes', lazy=True)
    
    def to_dict(self):
        """Méthode to_dict() sécurisée"""
        try:
            waypoints_data = []
            if self.waypoints:
                try:
                    waypoints_data = json.loads(self.waypoints)
                except (json.JSONDecodeError, TypeError):
                    waypoints_data = []
            
            tags_data = []
            if self.tags:
                try:
                    tags_data = json.loads(self.tags)
                except (json.JSONDecodeError, TypeError):
                    tags_data = []
            
            return {
                'id': self.id,
                'name': self.name or '',
                'description': self.description or '',
                'distance': float(self.distance) if self.distance is not None else 0.0,
                'estimated_duration': self.estimated_duration,
                'difficulty': self.difficulty or 'Facile',
                'status': self.status or 'active',
                'elevation_gain': float(self.elevation_gain) if self.elevation_gain is not None else None,
                'waypoints': waypoints_data,
                'surface_type': self.surface_type,
                'tags': tags_data,
                'created_by': self.created_by,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        except Exception as e:
            print(f"Erreur to_dict() route {self.id}: {e}")
            # Retourner un dict minimal en cas d'erreur
            return {
                'id': getattr(self, 'id', None),
                'name': getattr(self, 'name', 'Route inconnue') or 'Route inconnue',
                'description': '',
                'distance': 0.0,
                'estimated_duration': None,
                'difficulty': 'Facile',
                'status': 'active',
                'elevation_gain': None,
                'waypoints': [],
                'surface_type': None,
                'tags': [],
                'created_by': getattr(self, 'created_by', None),
                'created_at': None,
                'updated_at': None
            }
    
    def set_waypoints(self, waypoints_list):
        """Définit les waypoints avec validation"""
        try:
            if waypoints_list is None:
                self.waypoints = None
                return
            
            if isinstance(waypoints_list, str):
                # Déjà une chaîne JSON
                json.loads(waypoints_list)  # Validation
                self.waypoints = waypoints_list
            elif isinstance(waypoints_list, list):
                # Validation des waypoints
                for i, waypoint in enumerate(waypoints_list):
                    if not isinstance(waypoint, dict):
                        raise ValueError(f"Waypoint {i} doit être un dictionnaire")
                    if 'lat' not in waypoint or 'lng' not in waypoint:
                        raise ValueError(f"Waypoint {i} doit contenir 'lat' et 'lng'")
                    
                    # Validation des coordonnées
                    lat = float(waypoint['lat'])
                    lng = float(waypoint['lng'])
                    
                    if not (-90 <= lat <= 90):
                        raise ValueError(f"Latitude invalide pour waypoint {i}: {lat}")
                    if not (-180 <= lng <= 180):
                        raise ValueError(f"Longitude invalide pour waypoint {i}: {lng}")
                
                self.waypoints = json.dumps(waypoints_list)
            else:
                raise ValueError(f"Type waypoints non supporté: {type(waypoints_list)}")
                
        except Exception as e:
            logger.error(f"Erreur set_waypoints pour route {getattr(self, 'id', 'new')}: {e}")
            raise
    
    def get_waypoints(self):
        """Récupère les waypoints sous forme de liste"""
        try:
            if not self.waypoints:
                return []
            
            if isinstance(self.waypoints, str):
                return json.loads(self.waypoints)
            elif isinstance(self.waypoints, list):
                return self.waypoints
            else:
                logger.warning(f"Type waypoints inattendu: {type(self.waypoints)}")
                return []
                
        except (json.JSONDecodeError, TypeError) as e:
            logger.error(f"Erreur get_waypoints pour route {self.id}: {e}")
            return []
    
    def validate_data(self):
        """Valide les données de la route"""
        errors = []
        
        if not self.name or len(self.name.strip()) == 0:
            errors.append("Le nom est requis")
        
        if self.distance is None or self.distance <= 0:
            errors.append("La distance doit être positive")
        
        if self.estimated_duration is not None and self.estimated_duration <= 0:
            errors.append("La durée estimée doit être positive")
        
        if self.elevation_gain is not None and self.elevation_gain < 0:
            errors.append("Le dénivelé ne peut pas être négatif")
        
        if self.difficulty not in ['Facile', 'Moyen', 'Difficile']:
            errors.append("Difficulté invalide")
        
        if self.status not in ['active', 'inactive', 'archived']:
            errors.append("Statut invalide")
        
        # Validation des waypoints
        try:
            waypoints = self.get_waypoints()
            if waypoints:
                for i, waypoint in enumerate(waypoints):
                    if not isinstance(waypoint, dict):
                        errors.append(f"Waypoint {i+1} invalide")
                        continue
                    
                    if 'lat' not in waypoint or 'lng' not in waypoint:
                        errors.append(f"Waypoint {i+1} manque lat/lng")
                        continue
                    
                    try:
                        lat = float(waypoint['lat'])
                        lng = float(waypoint['lng'])
                        
                        if not (-90 <= lat <= 90):
                            errors.append(f"Latitude invalide waypoint {i+1}")
                        if not (-180 <= lng <= 180):
                            errors.append(f"Longitude invalide waypoint {i+1}")
                    except (ValueError, TypeError):
                        errors.append(f"Coordonnées invalides waypoint {i+1}")
        
        except Exception as e:
            errors.append(f"Erreur validation waypoints: {str(e)}")
        
        return errors
    
    def __repr__(self):
        return f'<Route {self.id}: {self.name} ({self.distance}km)>'
    
    @classmethod
    def get_active_routes(cls):
        """Récupère toutes les routes actives"""
        return cls.query.filter_by(status='active').all()
    
    @classmethod
    def search_routes(cls, search_term):
        """Recherche des routes par nom ou description"""
        if not search_term:
            return cls.query.all()
        
        return cls.query.filter(
            db.or_(
                cls.name.contains(search_term),
                cls.description.contains(search_term)
            )
        ).all()
    
    @classmethod
    def get_routes_by_difficulty(cls, difficulty):
        """Récupère les routes par difficulté"""
        return cls.query.filter_by(difficulty=difficulty, status='active').all()
    
    @classmethod
    def get_popular_routes(cls, limit=10):
        """Récupère les routes les plus populaires (avec le plus de runs)"""
        from app.models.run import Run
        
        return db.session.query(cls).join(Run).group_by(cls.id).order_by(
            db.func.count(Run.id).desc()
        ).limit(limit).all()