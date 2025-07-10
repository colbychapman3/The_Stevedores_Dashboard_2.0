# Active Context

**Current Work Focus:**

Project structure has been cleaned and organized. Ready to proceed with core development tasks including frontend refactoring, offline functionality implementation, and widget inter-communication system.

**Recent Changes:**

*   **COMPLETED:** Project structure cleanup and organization
*   **REMOVED:** `.vscode/` folder containing unrelated taskmaster-ai configuration
*   **CLEANED:** `package.json` - removed taskmaster dependencies, updated project name to "stevedores-dashboard"
*   **REGENERATED:** `package-lock.json` to match cleaned package.json
*   **VERIFIED:** All files now belong specifically to Stevedores Dashboard project
*   **CONFIRMED:** SQLite database structure and purpose for maritime operations data
*   Created complete memory bank documentation (9 files)
*   Migrated ship data from JSON file to SQLite database
*   Externalized JavaScript from HTML files

**Next Steps:**

*   Complete frontend refactoring (remove redundant code, hardcoded values, implement widget inter-communication)
*   Implement robust offline functionality (enhance service worker, implement offline data sync)
*   Perform UI/UX review and polish
*   Enhance data extraction wizard robustness
*   Implement comprehensive testing
*   Production readiness review

**Active Decisions and Considerations:**

*   How to best implement offline data sync using IndexedDB
*   How to handle potential conflicts between local and server data
*   How to improve the accuracy and robustness of the data extraction process
*   Widget inter-communication architecture and event system design

**Important Patterns and Preferences:**

*   Follow the instructions in the README
*   Maintain clean project structure with proper separation of concerns
*   Focus on offline-first PWA architecture for maritime environments
*   Use modern Flask patterns with SQLAlchemy 2.0+ syntax

**Learnings and Project Insights:**

*   Project structure is now clean and properly organized
*   Database migration to SQLite provides robust data storage for maritime operations
*   The application architecture supports comprehensive ship management with detailed operational data
*   Critical need for offline functionality in maritime environments where connectivity is limited
*   Widget system requires inter-communication for consistent analytics across dashboard views
