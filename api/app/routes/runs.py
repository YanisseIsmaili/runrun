from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.run import Run
from app.services.run_service import calculate_run_stats
from datetime import datetime
import json

runs_bp = Blueprint('runs', __name__)

@runs_bp.route('', methods=['POST'])
@jwt_required()
def create_run():
    current_user_id = get_jwt_identity()
    data = request.json
    
    # Création d'une nouvelle course
    new_run = Run(
        user_id=current_user_id,
        start_time=datetime.fromisoformat(data.get('start_time')),
        end_time=datetime.fromisoformat(data.get('end_time')) if data.get('end_time') else None,
        duration=data.get('duration'),
        distance=data.get('distance'),
        avg_speed=data.get('avg_speed'),
        max_speed=data.get('max_speed'),
        calories=data.get('calories')
    )
    
    # Ajout des données de route si présentes
    if 'route_data' in data:
        new_run.route_data = data['route_data']
    
    # Calcul automatique des statistiques manquantes
    if not all([new_run.duration, new_run.distance, new_run.avg_speed, new_run.calories]):
        calculate_run_stats(new_run)
    
    db.session.add(new_run)
    db.session.commit()
    
    return jsonify({
        "message": "Course enregistrée avec succès",
        "run": new_run.to_dict()
    }), 201

@runs_bp.route('', methods=['GET'])
@jwt_required()
def get_runs():
    current_user_id = get_jwt_identity()
    
    # Paramètres de pagination et de filtre
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Récupération des courses paginées
    runs_query = Run.query.filter_by(user_id=current_user_id).order_by(Run.start_time.desc())
    runs_pagination = runs_query.paginate(page=page, per_page=per_page, error_out=False)
    
    runs = [run.to_dict() for run in runs_pagination.items]
    
    return jsonify({
        "runs": runs,
        "total": runs_pagination.total,
        "pages": runs_pagination.pages,
        "current_page": page
    }), 200

@runs_bp.route('/<int:run_id>', methods=['GET'])
@jwt_required()
def get_run(run_id):
    current_user_id = get_jwt_identity()
    
    run = Run.query.filter_by(id=run_id, user_id=current_user_id).first()
    
    if not run:
        return jsonify({"error": "Course non trouvée"}), 404
    
    return jsonify(run.to_dict()), 200

@runs_bp.route('/<int:run_id>', methods=['DELETE'])
@jwt_required()
def delete_run(run_id):
    current_user_id = get_jwt_identity()
    
    run = Run.query.filter_by(id=run_id, user_id=current_user_id).first()
    
    if not run:
        return jsonify({"error": "Course non trouvée"}), 404
    
    db.session.delete(run)
    db.session.commit()
    
    return jsonify({"message": "Course supprimée avec succès"}), 200