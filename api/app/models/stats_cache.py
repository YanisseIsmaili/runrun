# app/models/stats_cache.py
from app import db
from datetime import datetime

class StatsCache(db.Model):
    __tablename__ = 'stats_cache'
    
    id = db.Column(db.Integer, primary_key=True)
    cache_key = db.Column(db.String(100), unique=True, nullable=False)
    cache_data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    def __repr__(self):
        return f'<StatsCache {self.cache_key}>'