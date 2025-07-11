#!/usr/bin/env python3
"""
Main entry point for the Maritime Dashboard Flask application.
Railway-compatible deployment configuration.
"""

import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask app from the src directory
from src.main import app

# Railway deployment configuration
if __name__ == '__main__':
    # Get port from environment variable (Railway sets PORT automatically)
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(debug=debug, host='0.0.0.0', port=port)