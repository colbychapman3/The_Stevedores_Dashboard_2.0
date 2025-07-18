# Multi-stage Docker build for Stevedores Dashboard 2.0
# Optimized for production deployment

# Stage 1: Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build-all

# Stage 2: Python application stage
FROM python:3.11-slim AS python-base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash stevedores

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Production stage
FROM python:3.11-slim AS production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_ENV=production \
    FLASK_DEBUG=0

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash --uid 1000 stevedores

# Set working directory
WORKDIR /app

# Copy Python dependencies from python-base stage
COPY --from=python-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-base /usr/local/bin /usr/local/bin

# Copy built assets from build stage
COPY --from=build /app/static/dist ./static/dist
COPY --from=build /app/static/sw-enhanced.js ./static/sw-enhanced.js

# Copy application code
COPY --chown=stevedores:stevedores . .

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs /app/database && \
    chown -R stevedores:stevedores /app

# Create health check script
RUN echo '#!/bin/bash\ncurl -f http://localhost:5000/health || exit 1' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh

# Switch to non-root user
USER stevedores

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /app/healthcheck.sh

# Run application
CMD ["gunicorn", "--config", "gunicorn.conf.py", "main:app"]