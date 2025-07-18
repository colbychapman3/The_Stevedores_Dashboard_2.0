#!/usr/bin/env python3
"""
Main Flask application for the Maritime Dashboard.
"""

import os
from flask import Flask, render_template
from flask_cors import CORS
from src.models import db
from src.models.user import User
from src.models.ship import Ship
from src.routes.ships import ships_bp
from src.routes.user import user_bp
from src.routes.file_processor import file_processor_bp

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    # Use absolute path for database
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(ships_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(file_processor_bp)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        """Serve the main dashboard."""
        return render_template('index.html')
    
    @app.route('/health')
    def health_check():
        """Health check endpoint."""
        return {'status': 'healthy', 'service': 'maritime-dashboard'}
    
    return app

# Create the app instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)