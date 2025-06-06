# api/app/models/run.py - Version corrigée avec route_id
from app import db
from datetime import datetime
import json

class Run(db.Model):
    __tablename__ = 'runs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('routes.id'), nullable=True)  # Nouveau champ
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # en secondes
    distance = db.Column(db.Float, nullable=True)    # en mètres
    avg_speed = db.Column(db.Float, nullable=True)   # en m/s
    max_speed = db.Column(db.Float, nullable=True)   # en m/s
    calories = db.Column(db.Integer, nullable=True)  # en kcal
    avg_heart_rate = db.Column(db.Integer, nullable=True)  # bpm
    max_heart_rate = db.Column(db.Integer, nullable=True)  # bpm
    elevation_gain = db.Column(db.Float, nullable=True)  # en mètres
    status = db.Column(db.String(20), nullable=False, default='running')  # running, paused, finished
    _route_data = db.Column('route_data', db.Text, nullable=True)  # JSON des coordonnées GPS
    _current_position = db.Column('current_position', db.Text, nullable=True)  # Position actuelle
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def route_data(self):
        return json.loads(self._route_data) if self._route_data else []
    
    @route_data.setter
    def route_data(self, value):
        self._route_data = json.dumps(value)
    
    @property
    def current_position(self):
        return json.loads(self._current_position) if self._current_position else None
    
    @current_position.setter
    def current_position(self, value):
        self._current_position = json.dumps(value)
    
    @property
    def avg_pace(self):
        """Calcule l'allure moyenne en min/km"""
        if self.duration and self.distance and self.distance > 0:
            pace_seconds = (self.duration / (self.distance / 1000))  # sec/km
            pace_minutes = pace_seconds / 60
            minutes = int(pace_minutes)
            seconds = int((pace_minutes - minutes) * 60)
            return f"{minutes}:{seconds:02d}"
        return "0:00"
    
    @property
    def is_active(self):
        """Vérifie si la course est active (pas terminée)"""
        return self.end_time is None
    
    @property
    def elapsed_time(self):
        """Retourne le temps écoulé depuis le début de la course"""
        if self.start_time:
            end_point = self.end_time or datetime.utcnow()
            return int((end_point - self.start_time).total_seconds())
        return 0
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'route_id': self.route_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'distance': self.distance,
            'avg_speed': self.avg_speed,
            'max_speed': self.max_speed,
            'calories': self.calories,
            'avg_heart_rate': self.avg_heart_rate,
            'max_heart_rate': self.max_heart_rate,
            'elevation_gain': self.elevation_gain,
            'status': self.status,
            'avg_pace': self.avg_pace,
            'is_active': self.is_active,
            'elapsed_time': self.elapsed_time,
            'route_data': self.route_data,
            'current_position': self.current_position,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }