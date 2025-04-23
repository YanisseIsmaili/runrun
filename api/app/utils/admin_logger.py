# Dans app/utils/admin_logger.py
from app.models.admin_log import AdminLog
from app import db

def log_admin_action(admin_id, action, resource_type, resource_id=None, details=None):
    log = AdminLog(
        admin_id=admin_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    db.session.add(log)
    db.session.commit()