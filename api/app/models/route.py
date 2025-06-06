# api/app/models/route.py - Version corrigée
from app import db
from datetime import datetime
import json

class Route(db.Model):
    __tablename__ = 'routes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    distance = db.Column(db.Float, nullable=False)  # en kilomètres
    estimated_duration = db.Column(db.Integer, nullable=True)  # en secondes
    difficulty = db.Column(db.String(50), nullable=False, default='Facile')  # Facile, Moyen, Difficile
    status = db.Column(db.String(20), nullable=False, default='active')  # active, inactive
    elevation_gain = db.Column(db.Float, nullable=True)  # dénivelé en mètres
    _waypoints = db.Column('waypoints', db.Text, nullable=True)  # JSON des points de passage
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    creator = db.relationship('User', backref='created_routes')
    runs = db.relationship('Run', backref='route', lazy=True)
    
    @property
    def waypoints(self):
        """Retourne les points de passage sous forme de liste"""
        return json.loads(self._waypoints) if self._waypoints else []
    
    @waypoints.setter
    def waypoints(self, value):
        """Définit les points de passage depuis une liste"""
        self._waypoints = json.dumps(value)
    
    @property
    def active_runners(self):
        """Retourne le nombre de coureurs actuellement actifs sur cet itinéraire"""
        # Import local pour éviter les imports circulaires
        from app.models.run import Run
        from sqlalchemy import and_
        
        # Courses actives = courses commencées mais pas terminées
        return Run.query.filter(
            and_(
                Run.route_id == self.id,
                Run.end_time.is_(None)  # Course pas encore terminée
            )
        ).count()
    
    @property
    def total_runs_today(self):
        """Retourne le nombre total de courses effectuées aujourd'hui sur cet itinéraire"""
        # Import local pour éviter les imports circulaires
        from app.models.run import Run
        from sqlalchemy import and_, func
        
        today = datetime.utcnow().date()
        return Run.query.filter(
            and_(
                Run.route_id == self.id,
                func.date(Run.start_time) == today
            )
        ).count()
    
    @property
    def total_runs(self):
        """Retourne le nombre total de courses effectuées sur cet itinéraire"""
        return len(self.runs)
    
    @property
    def average_completion_time(self):
        """Retourne le temps moyen de completion de l'itinéraire"""
        completed_runs = [run for run in self.runs if run.duration]
        if not completed_runs:
            return None
        
        total_duration = sum(run.duration for run in completed_runs)
        return total_duration // len(completed_runs)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'distance': self.distance,
            'estimated_duration': self.estimated_duration,
            'difficulty': self.difficulty,
            'status': self.status,
            'elevation_gain': self.elevation_gain,
            'waypoints': self.waypoints,
            'created_by': self.created_by,
            'creator_name': f"{self.creator.first_name} {self.creator.last_name}" if self.creator else None,
            'active_runners': self.active_runners,
            'total_runs_today': self.total_runs_today,
            'total_runs': self.total_runs,
            'average_completion_time': self.average_completion_time,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def to_dict_summary(self):
        """Version simplifiée pour les listes"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'distance': self.distance,
            'estimated_duration': self.estimated_duration,
            'difficulty': self.difficulty,
            'status': self.status,
            'active_runners': self.active_runners,
            'total_runs_today': self.total_runs_today,
            'created_at': self.created_at.isoformat()
        }