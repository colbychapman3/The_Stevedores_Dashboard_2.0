# 🚀 Quick Setup Guide

## Prerequisites
- Python 3.11+
- pip (Python package installer)

## Installation Steps

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**
   ```bash
   python main.py
   ```
   
   Or alternatively:
   ```bash
   python app.py
   ```

3. **Access the Dashboard**
   - Main Wizard: http://localhost:5000
   - Master Dashboard: http://localhost:5000/master
   - Calendar View: http://localhost:5000/calendar
   - Analytics: http://localhost:5000/analytics

## Test the Auto-Fill Feature

1. Go to the main wizard (http://localhost:5000)
2. Upload either:
   - `complete_comprehensive_test_document.txt`
   - `complete_comprehensive_test_document.pdf`
3. Watch as all form fields get automatically populated
4. Navigate through the wizard steps to see data persistence

## File Structure

```
maritime-dashboard-current/
├── src/                    # Backend source code
│   ├── main.py            # Main Flask application
│   ├── models/            # Database models
│   └── routes/            # API endpoints
├── static/                # Frontend files
│   ├── index.html         # Main wizard interface
│   ├── master-dashboard.html
│   ├── calendar.html
│   └── analytics.html
├── database/              # SQLite database directory
├── uploads/               # File upload directory
├── main.py               # Application entry point
├── app.py                # Alternative entry point
├── requirements.txt      # Python dependencies
├── README.md            # Full documentation
└── SETUP.md             # This file
```

## Features Included

✅ 4-Step Wizard with Auto-Fill
✅ Master Dashboard for Multi-Ship Operations
✅ Calendar and Analytics Views
✅ Document Upload and Processing
✅ TICO Transportation Management
✅ Real-Time Berth Status Tracking
✅ Comprehensive Test Documents

## Support

For detailed documentation, see README.md
For issues, check the Flask console output for error messages.

---
**Ready to streamline your maritime operations!** 🚢

