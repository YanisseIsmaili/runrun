# Dans app/utils/decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.user import User

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({
                "status": "error",
                "message": "Accès refusé",
                "errors": {"auth": "Droits administrateur requis"}
            }), 403
        return f(*args, **kwargs)
    return decorated

def super_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_super_admin:
            return jsonify({
                "status": "error",
                "message": "Accès refusé",
                "errors": {"auth": "Droits super-administrateur requis"}
            }), 403
        return f(*args, **kwargs)
    return decorated