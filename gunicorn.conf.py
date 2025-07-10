# Gunicorn Production Configuration for Stevedores Dashboard
# File: gunicorn.conf.py

import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', 5000)}"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
preload_app = True

# Timeout settings
timeout = 30
keepalive = 2
graceful_timeout = 30

# Process naming
proc_name = "stevedores_dashboard"

# User and group to run as
user = None
group = None

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

# Logging
accesslog = "logs/access.log"
errorlog = "logs/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Enable stdio inheritance for logging
capture_output = True
enable_stdio_inheritance = True

# Worker memory management
max_requests_jitter = 100
preload_app = True

# Performance tuning
worker_tmp_dir = "/dev/shm" if os.path.exists("/dev/shm") else None

# Development vs Production
if os.environ.get('FLASK_ENV') == 'development':
    reload = True
    workers = 1
else:
    reload = False

# SSL (if using HTTPS)
if os.environ.get('SSL_CERT') and os.environ.get('SSL_KEY'):
    certfile = os.environ.get('SSL_CERT')
    keyfile = os.environ.get('SSL_KEY')
