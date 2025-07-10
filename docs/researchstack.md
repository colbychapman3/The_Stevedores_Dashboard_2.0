# Research Stack

## Flask Framework Research

**Context7-compatible library ID:** `/pallets/flask`
**Trust Score:** 8.8
**Code Snippets Available:** 541

### Latest Flask Application Setup (2025)

```python
from flask import Flask

app = Flask(__name__)
app.config.from_mapping(
    SECRET_KEY="dev",
)
app.config.from_prefixed_env()

@app.route("/")
def index():
    return "Hello, World!"
```

### Flask Application Factory Pattern

```python
import os
from flask import Flask

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    return app
```

### Production Configuration

```python
SECRET_KEY = '192b9bdd22ab9ed4d12e236c78afcb9a393ec15f71bbf5dc987d54727823bcbf'
```

### Development Commands

```bash
# Development server
$ flask --app flaskr run --debug

# Production with Gunicorn
$ pip install gunicorn
$ gunicorn --config gunicorn.conf.py production:app
```

## Flask-SQLAlchemy Research

**Context7-compatible library ID:** `/pallets-eco/flask-sqlalchemy`
**Trust Score:** 8
**Code Snippets Available:** 89

### Modern Flask-SQLAlchemy Setup (2025)

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# create the app
app = Flask(__name__)
# configure the SQLite database, relative to the app instance folder
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
# initialize the app with the extension
db.init_app(app)
```

### Model Definition with Type Annotations

```python
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    email: Mapped[str]

class Ship(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    imo_number: Mapped[str]
    vessel_type: Mapped[str]
    flag_state: Mapped[str]
    gross_tonnage: Mapped[int]
    year_built: Mapped[int]
```

### Database Operations

```python
# Creating tables
with app.app_context():
    db.create_all()

# Inserting data
ship = Ship(name="Example Ship", imo_number="1234567")
db.session.add(ship)
db.session.commit()

# Querying data
ships = db.session.execute(db.select(Ship).order_by(Ship.name)).scalars()

# Get or 404 pattern
ship = db.get_or_404(Ship, ship_id)
```

### Connection String Examples

```python
# SQLite, relative to Flask instance path
SQLALCHEMY_DATABASE_URI = "sqlite:///project.db"

# PostgreSQL
SQLALCHEMY_DATABASE_URI = "postgresql://scott:tiger@localhost/project"

# MySQL / MariaDB
SQLALCHEMY_DATABASE_URI = "mysql://scott:tiger@localhost/project"
```

## Progressive Web App Research

### Service Worker Implementation

```javascript
// Basic Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
```

### Web App Manifest

```json
{
    "name": "Stevedores Dashboard",
    "short_name": "Stevedores",
    "description": "Maritime management dashboard",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#000000",
    "icons": [
        {
            "src": "/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

### IndexedDB for Offline Storage

```javascript
// Opening IndexedDB database
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('StevedoresDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const objectStore = db.createObjectStore('ships', { keyPath: 'id' });
            objectStore.createIndex('name', 'name', { unique: false });
        };
    });
}
```

## Dependencies and Versions

### Backend Dependencies (requirements.txt)

```txt
Flask==3.0.3
Flask-SQLAlchemy==3.1.1
Werkzeug==3.0.3
Gunicorn==22.0.0
python-dotenv==1.0.1
```

### Frontend Dependencies (package.json)

```json
{
    "devDependencies": {
        "tailwindcss": "^3.4.0",
        "@tailwindcss/forms": "^0.5.7"
    },
    "scripts": {
        "build-css": "tailwindcss -i ./static/src/input.css -o ./static/css/output.css --watch"
    }
}
```

## Testing Framework

### Pytest Configuration

```python
import pytest
from src.main import create_app
from src.models import db

@pytest.fixture()
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture()
def client(app):
    return app.test_client()

@pytest.fixture()
def runner(app):
    return app.test_cli_runner()
```

## Production Deployment

### Gunicorn Configuration (gunicorn.conf.py)

```python
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
```

### Environment Variables

```bash
# Development
export FLASK_APP=src.main:create_app
export FLASK_ENV=development
export SECRET_KEY=dev

# Production
export SECRET_KEY=your-production-secret-key
export SQLALCHEMY_DATABASE_URI=sqlite:///production.db
```

## Installation Commands

### Development Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
npm install

# Initialize database
python scripts/migrate_data.py

# Run development server
flask --app src.main run --debug
```

### Production Setup

```bash
# Install production dependencies
pip install -r requirements.txt

# Build CSS
npm run build-css

# Run with Gunicorn
gunicorn --config gunicorn.conf.py production:app
```

## Research Sources

*   **Flask Documentation:** Latest patterns from Context7-compatible library `/pallets/flask`
*   **Flask-SQLAlchemy Documentation:** Modern SQLAlchemy 2.0+ patterns from `/pallets-eco/flask-sqlalchemy`
*   **Service Worker API:** Web standards for offline functionality
*   **IndexedDB API:** Client-side storage for offline data
*   **PWA Best Practices:** Progressive Web App implementation patterns

## Key Technical Decisions

1.  **Flask Application Factory:** Using the factory pattern for better testing and configuration management
2.  **Modern SQLAlchemy:** Using SQLAlchemy 2.0+ with type annotations and modern query syntax
3.  **SQLite Database:** Lightweight database suitable for the application's requirements
4.  **Service Worker Strategy:** Cache-first for static resources, network-first for dynamic data
5.  **IndexedDB Integration:** For robust offline data storage and synchronization
6.  **Gunicorn WSGI Server:** Production-ready Python WSGI HTTP Server
