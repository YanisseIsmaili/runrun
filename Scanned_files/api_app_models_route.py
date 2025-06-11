# api/app/models/route.py
from app import db
from datetime import datetime
import json

class Route(db.Model):
    __tablename__ = 'routes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    distance = db.Column(db.Float, nullable=False)  # en km
    estimated_duration = db.Column(db.Integer)  # en secondes
    difficulty = db.Column(db.String(50), nullable=False, default='Facile')
    status = db.Column(db.String(20), nullable=False, default='active')
    elevation_gain = db.Column(db.Float)  # en mètres
    waypoints = db.Column(db.Text)  # JSON string des points de passage
    surface_type = db.Column(db.String(50))  # route, trail, piste, etc.
    tags = db.Column(db.Text)  # JSON string des tags
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    runs = db.relationship('Run', backref='route', lazy=True)
    creator = db.relationship('User', backref='created_routes', foreign_keys=[created_by])
    
    def to_dict(self):
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
            'name': self.name,
            'description': self.description,
            'distance': self.distance,
            'estimated_duration': self.estimated_duration,
            'difficulty': self.difficulty,
            'status': self.status,
            'elevation_gain': self.elevation_gain,
            'waypoints': waypoints_data,
            'surface_type': self.surface_type,
            'tags': tags_data,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Route {self.name}>'