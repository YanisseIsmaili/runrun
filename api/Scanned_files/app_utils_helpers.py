from datetime import datetime, timedelta

def format_datetime(dt):
    """Formate une date et heure en chaîne de caractères"""
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    return dt.strftime("%d/%m/%Y %H:%M:%S")

def get_date_range(range_type):
    """
    Retourne une plage de dates en fonction du type demandé
    - 'day': aujourd'hui
    - 'week': semaine en cours
    - 'month': mois en cours
    - 'year': année en cours
    """
    now = datetime.utcnow()
    
    if range_type == 'day':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
    
    elif range_type == 'week':
        # Lundi de la semaine actuelle
        start_date = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=7)
    
    elif range_type == 'month':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end_date = datetime(now.year + 1, 1, 1)
        else:
            end_date = datetime(now.year, now.month + 1, 1)
    
    elif range_type == 'year':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = datetime(now.year + 1, 1, 1)
    
    else:
        raise ValueError(f"Type de plage de dates inconnu: {range_type}")
    
    return start_date, end_date