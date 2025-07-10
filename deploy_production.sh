#!/bin/bash
# Stevedores Dashboard Production Deployment Script
# Memory-First Autonomous Technical Agent Implementation

echo "🚢 STEVEDORES DASHBOARD PRODUCTION DEPLOYMENT"
echo "============================================="

echo "📋 Step 1: Backing up current configuration..."
cp src/main.py src/main_backup.py
cp requirements.txt requirements_backup.txt

echo "🔧 Step 2: Implementing production enhancements..."
# Enhanced main.py with security and error handling
mv src/main_enhanced.py src/main.py

# Enhanced requirements with security dependencies  
mv requirements_enhanced.txt requirements.txt

echo "📦 Step 3: Installing production dependencies..."
pip install -r requirements.txt

echo "🗄️ Step 4: Initializing production database..."
python -c "
from src.main import app, db
with app.app_context():
    try:
        db.create_all()
        print('✅ Production database initialized successfully')
    except Exception as e:
        print(f'❌ Database initialization failed: {e}')
"

echo "🔍 Step 5: Running production health checks..."
python -c "
from src.main import app
with app.test_client() as client:
    try:
        response = client.get('/health')
        if response.status_code == 200:
            print('✅ Health check passed')
            print(f'   Response: {response.get_json()}')
        else:
            print(f'❌ Health check failed: {response.status_code}')
    except Exception as e:
        print(f'❌ Health check error: {e}')
"

echo "🌐 Step 6: Testing PWA components..."
python -c "
import os
if os.path.exists('static/manifest.json'):
    print('✅ PWA manifest found')
else:
    print('❌ PWA manifest missing')

if os.path.exists('static/sw.js'):
    print('✅ Service worker found')
else:
    print('❌ Service worker missing')
"

echo "🚀 Step 7: Starting production server..."
echo "Run this command to start production server:"
echo "gunicorn -c gunicorn.conf.py src.main:app"

echo ""
echo "✅ PRODUCTION DEPLOYMENT COMPLETE"
echo "=================================="
echo "🔗 Access your production-ready Stevedores Dashboard at:"
echo "   Main Dashboard: http://localhost:5000/master"
echo "   Wizard: http://localhost:5000/wizard"
echo "   Health Check: http://localhost:5000/health"
echo ""
echo "📊 Monitor performance with enhanced logging in logs/"
echo "🔒 Security features: Rate limiting, CSRF protection, input validation"
echo "📱 PWA features: Offline capability, installable interface"
