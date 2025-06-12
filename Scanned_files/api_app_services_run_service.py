from datetime import datetime

def calculate_run_stats(run):
    """
    Calcule les statistiques manquantes d'une course
    - Si la durée est manquante, mais que les heures de début et de fin sont présentes, elle est calculée
    - Si la vitesse moyenne est manquante, mais que la distance et la durée sont présentes, elle est calculée
    - Les calories sont estimées en fonction de la distance
    """
    # Calcul de la durée si manquante
    if not run.duration and run.start_time and run.end_time:
        run.duration = (run.end_time - run.start_time).total_seconds()
    
    # Calcul de la vitesse moyenne si manquante
    if not run.avg_speed and run.distance and run.duration:
        run.avg_speed = run.distance / run.duration  # en m/s
    
    # Estimation des calories (approximation simple)
    if not run.calories and run.distance:
        # Approximation: 1 km = 60 kcal pour une personne de 70kg
        run.calories = int(run.distance / 1000 * 60)
    
    return run

def format_duration(seconds):
    """Formate la durée en heures:minutes:secondes"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60
    
    return f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"

def calculate_pace(distance, duration):
    """Calcule l'allure en minutes par kilomètre"""
    if not distance or not duration or distance == 0:
        return 0
    
    # Conversion distance en kilomètres
    distance_km = distance / 1000
    
    # Calcul de l'allure (minutes par kilomètre)
    pace_minutes = duration / 60 / distance_km
    
    return pace_minutes