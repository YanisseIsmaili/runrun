# api/app/models/user.py - SUPPORT DUAL HASHAGE
from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt
import hashlib

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    date_of_birth = db.Column(db.Date, nullable=True)
    height = db.Column(db.Float, nullable=True)
    weight = db.Column(db.Float, nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    runs = db.relationship('Run', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def detect_hash_type(self, hash_value):
        """Détecte le type de hashage utilisé"""
        if not hash_value:
            return "none"
        
        # Werkzeug/Flask standard
        if hash_value.startswith('pbkdf2:'):
            return "werkzeug"
        
        # BCrypt
        if hash_value.startswith('$2a$') or hash_value.startswith('$2b$') or hash_value.startswith('$2y$'):
            return "bcrypt"
        
        # SHA256 simple (format custom)
        if len(hash_value) == 64 and all(c in '0123456789abcdef' for c in hash_value):
            return "sha256"
        
        # MD5 simple
        if len(hash_value) == 32 and all(c in '0123456789abcdef' for c in hash_value):
            return "md5"
        
        return "unknown"
    
    def set_password(self, password):
        """Utilise Werkzeug par défaut pour les nouveaux mots de passe"""
        self.password_hash = generate_password_hash(password)
    
    @property
    def password(self):
        raise AttributeError('Le mot de passe ne peut pas être lu')
    
    @password.setter
    def password(self, password):
        self.set_password(password)
    
    def verify_password(self, password):
        """🔧 VÉRIFICATION UNIVERSELLE - Support multi-hashage"""
        if not self.password_hash or not password:
            return False
        
        hash_type = self.detect_hash_type(self.password_hash)
        print(f"🔍 {self.username}: Type de hash détecté = {hash_type}")
        
        try:
            # 1. Werkzeug/Flask (méthode standard)
            if hash_type == "werkzeug":
                result = check_password_hash(self.password_hash, password)
                print(f"✅ Werkzeug check: {result}")
                return result
            
            # 2. BCrypt
            elif hash_type == "bcrypt":
                try:
                    result = bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
                    print(f"✅ BCrypt check: {result}")
                    return result
                except Exception as e:
                    print(f"⚠️ BCrypt error: {e}")
                    return False
            
            # 3. SHA256 simple
            elif hash_type == "sha256":
                sha256_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
                result = sha256_hash == self.password_hash
                print(f"✅ SHA256 check: {result}")
                return result
            
            # 4. MD5 simple
            elif hash_type == "md5":
                md5_hash = hashlib.md5(password.encode('utf-8')).hexdigest()
                result = md5_hash == self.password_hash
                print(f"✅ MD5 check: {result}")
                return result
            
            # 5. Tentative avec Werkzeug sur hash inconnu
            else:
                print(f"🔄 Hash inconnu, tentative Werkzeug...")
                try:
                    result = check_password_hash(self.password_hash, password)
                    print(f"✅ Werkzeug fallback: {result}")
                    return result
                except:
                    print(f"❌ Aucune méthode ne fonctionne")
                    return False
                    
        except Exception as e:
            print(f"💥 Erreur vérification pour {self.username}: {e}")
            return False
    
    def get_hash_info(self):
        """Retourne des infos sur le hash actuel"""
        hash_type = self.detect_hash_type(self.password_hash)
        return {
            "type": hash_type,
            "length": len(self.password_hash) if self.password_hash else 0,
            "hash_preview": self.password_hash[:20] + "..." if self.password_hash else "None"
        }
    
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
            'is_admin': self.is_admin,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<User {self.username}>'