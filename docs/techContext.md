# Tech Context

**Technologies Used:**

*   **Backend:** Python Flask web framework
*   **Database:** SQLite for data storage
*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **PWA:** Service Workers, Web App Manifest, IndexedDB
*   **CSS Framework:** Tailwind CSS for styling
*   **Build Tools:** Node.js, npm for package management
*   **Deployment:** Gunicorn WSGI server for production

**Development Setup:**

1.  Install Python 3.x and pip
2.  Install Node.js and npm
3.  Clone the repository
4.  Install Python dependencies: `pip install -r requirements.txt`
5.  Install Node.js dependencies: `npm install`
6.  Initialize SQLite database: `python scripts/migrate_data.py`
7.  Run development server: `python src/main.py`

**Technical Constraints:**

*   Must work completely offline (PWA requirements)
*   SQLite database for local data storage
*   Service worker must cache all critical resources
*   IndexedDB for offline data synchronization
*   Cross-platform compatibility (web-based)

**Dependencies:**

*   **Python Backend:**
    - Flask (web framework)
    - Flask-SQLAlchemy (ORM)
    - Werkzeug (WSGI utilities)
    - Gunicorn (production server)
    - PyPDF2 (document processing)
    - Flask-CORS (cross-origin requests)
*   **Frontend:**
    - Tailwind CSS (utility-first CSS framework)
    - Service Worker API (offline functionality)
    - IndexedDB API (client-side storage)
*   **Development:**
    - Node.js and npm (package management)
    - Tailwind CLI (CSS processing)

**Tool Usage Patterns:**

*   **Development:** `python src/main.py` for local development server
*   **Production:** `gunicorn --config gunicorn.conf.py production:app`
*   **Database Migration:** `python scripts/migrate_data.py`
*   **CSS Build:** `npm run build-css` (if using Tailwind CLI)

**Production Environment:**

*   Environment variables for sensitive configuration
*   SSL/TLS encryption for secure connections
*   Database backups and recovery procedures
*   Monitoring and logging for production issues
*   Load balancing for high availability (if needed)
