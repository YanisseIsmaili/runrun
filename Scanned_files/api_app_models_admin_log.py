# Dans app/models/admin_log.py
from app import db
from datetime import datetime

class AdminLog(db.Model):
    __tablename__ = 'admin_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relation avec User
    admin = db.relationship('User', backref='admin_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_username': self.admin.username if self.admin else None,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'created_at': self.created_at.isoformat()
        }