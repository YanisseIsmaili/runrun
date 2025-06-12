import re

def validate_email(email):
    """Valide le format d'un email"""
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(pattern, email) is not None

def validate_password_strength(password):
    """
    Vérifie la force du mot de passe:
    - Au moins 8 caractères
    - Au moins une lettre majuscule
    - Au moins une lettre minuscule
    - Au moins un chiffre
    """
    if len(password) < 8:
        return False
    
    if not re.search(r'[A-Z]', password):
        return False
    
    if not re.search(r'[a-z]', password):
        return False
    
    if not re.search(r'[0-9]', password):
        return False
    
    return True

def validate_registration_data(data):
    """Valide les données d'inscription"""
    if not data.get('username'):
        return "Le nom d'utilisateur est requis"
    
    if len(data.get('username', '')) < 3:
        return "Le nom d'utilisateur doit contenir au moins 3 caractères"
    
    if not data.get('email'):
        return "L'email est requis"
    
    if not validate_email(data.get('email', '')):
        return "Format d'email invalide"
    
    if not data.get('password'):
        return "Le mot de passe est requis"
    
    if not validate_password_strength(data.get('password', '')):
        return "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre"
    
    return None

def validate_login_data(data):
    """Valide les données de connexion"""
    if not data.get('email'):
        return "L'email est requis"
    
    if not data.get('password'):
        return "Le mot de passe est requis"
    
    return None