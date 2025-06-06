from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    date_of_birth = db.Column(db.Date, nullable=True)
    height = db.Column(db.Float, nullable=True)  # en cm
    weight = db.Column(db.Float, nullable=True)  # en kg
    profile_picture = db.Column(db.String(255), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # role = db.Column(db.String(20), default='user')  # 'user', 'admin', 'super_admin'
    
    # Relation One-to-Many avec Run
    runs = db.relationship('Run', backref='user', lazy=True, cascade='all, delete-orphan')
    
    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')
    def is_super_admin(self):
        return 'admin'
    
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'date_of_birth': self.date_of_birth.strftime('%Y-%m-%d') if self.date_of_birth else None,
            'height': self.height,
            'weight': self.weight,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }