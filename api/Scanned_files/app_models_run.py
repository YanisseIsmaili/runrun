from app import db
from datetime import datetime
import json

class Run(db.Model):
    __tablename__ = 'runs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # en secondes
    distance = db.Column(db.Float, nullable=True)    # en mètres
    avg_speed = db.Column(db.Float, nullable=True)   # en m/s
    max_speed = db.Column(db.Float, nullable=True)   # en m/s
    calories = db.Column(db.Integer, nullable=True)  # en kcal
    _route_data = db.Column('route_data', db.Text, nullable=True)  # JSON des coordonnées GPS
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def route_data(self):
        return json.loads(self._route_data) if self._route_data else []
    
    @route_data.setter
    def route_data(self, value):
        self._route_data = json.dumps(value)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'distance': self.distance,
            'avg_speed': self.avg_speed,
            'max_speed': self.max_speed,
            'calories': self.calories,
            'route_data': self.route_data,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }