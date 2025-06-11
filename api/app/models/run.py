# api/app/models/run.py
from app import db
from datetime import datetime

class Run(db.Model):
    __tablename__ = 'runs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('routes.id'), nullable=True)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Integer)  # en secondes
    distance = db.Column(db.Float, nullable=False)  # en km
    avg_speed = db.Column(db.Float)  # en km/h
    max_speed = db.Column(db.Float)  # en km/h
    avg_heart_rate = db.Column(db.Integer)  # bpm
    max_heart_rate = db.Column(db.Integer)  # bpm
    calories_burned = db.Column(db.Integer)
    elevation_gain = db.Column(db.Float)  # en mètres
    status = db.Column(db.String(20), default='finished')  # in_progress, finished, paused
    gps_data = db.Column(db.Text)  # JSON string des coordonnées GPS
    current_position = db.Column(db.Text)  # Position actuelle pour courses en cours
    weather_conditions = db.Column(db.Text)  # Conditions météo
    notes = db.Column(db.Text)  # Notes de l'utilisateur
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'route_id': self.route_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'distance': self.distance,
            'avg_speed': self.avg_speed,
            'max_speed': self.max_speed,
            'avg_heart_rate': self.avg_heart_rate,
            'max_heart_rate': self.max_heart_rate,
            'calories_burned': self.calories_burned,
            'elevation_gain': self.elevation_gain,
            'status': self.status,
            'weather_conditions': self.weather_conditions,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Run {self.id} - User {self.user_id}>'