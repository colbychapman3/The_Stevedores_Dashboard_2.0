# System Patterns

**System Architecture:**

The Stevedores Dashboard follows a hybrid web application architecture with:
- Python Flask backend with SQLite database
- Progressive Web App (PWA) frontend with offline capabilities
- Service worker for caching and offline functionality
- Widget-based modular frontend architecture

**Key Technical Decisions:**

*   **Database Migration:** Moved from JSON-based data storage to SQLite for better data integrity and query capabilities
*   **Code Organization:** Separated JavaScript from HTML files for better maintainability
*   **Offline-First Design:** Implementing PWA patterns with service worker and IndexedDB for offline data storage
*   **Widget Architecture:** Modular widget system for ship information display and analytics

**Design Patterns:**

*   **Model-View-Controller (MVC):** Flask backend follows MVC pattern with separate models, routes, and templates
*   **Progressive Enhancement:** Application works offline with enhanced functionality when online
*   **Modular Widget System:** Each widget is self-contained with its own data management and communication capabilities
*   **Service Worker Pattern:** Implements caching strategies for offline functionality

**Component Relationships:**

1.  **Backend Components:**
    - `main.py`: Application entry point (imports from src/main.py)
    - `src/main.py`: Main Flask application with app factory pattern
    - `src/models/`: Database models (User, Ship with comprehensive maritime data)
    - `src/routes/`: API endpoints for ships, users, file processing
    - `database/app.db`: SQLite database with maritime operations data

2.  **Frontend Components:**
    - `static/index.html`: Main wizard interface with auto-fill functionality
    - `static/master-dashboard.html`: Multi-ship operations dashboard
    - `static/ship-info.html`: Individual ship information and widgets
    - `static/calendar.html`: Operations scheduling calendar
    - `static/analytics.html`: Performance analytics dashboard
    - `static/js/`: Modular JavaScript for each page
    - `static/sw.js`: Service worker for offline functionality
    - `static/manifest.json`: PWA manifest

3.  **Widget System:**
    - Data extraction wizard with PDF/CSV/TXT processing
    - Live analytics widgets in master-dashboard
    - Editable ship information widgets
    - Real-time KPI tracking and berth status

4.  **Configuration & Deployment:**
    - `package.json`: Clean Node.js dependencies for Tailwind CSS
    - `requirements.txt`: Python dependencies
    - `gunicorn.conf.py`: Production server configuration
    - Environment files for secure deployment

**Critical Implementation Paths:**

1.  **Data Flow:** User uploads data → Wizard processes → SQLite storage → Widget display
2.  **Offline Sync:** Service worker caches data → IndexedDB local storage → Background sync when online
3.  **Widget Communication:** Widget updates → Event system → Other widgets update → Data consistency maintained
4.  **Production Deploy:** Code quality checks → Testing → Environment setup → Production deployment

**Architectural Concerns:**

*   **Data Consistency:** Ensuring widgets remain synchronized across different views
*   **Offline Data Management:** Handling conflicts between local and server data
*   **Performance:** Optimizing for maritime environments with limited connectivity
*   **Error Handling:** Robust error handling for data extraction and processing
