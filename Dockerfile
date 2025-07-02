# Multi-stage Dockerfile for building Secure File Manager on Linux
# This container provides a consistent build environment with all necessary dependencies

FROM node:20-bullseye AS base

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    npm_config_cache=/tmp/.npm-cache \
    ELECTRON_CACHE=/tmp/.electron-cache \
    ELECTRON_BUILDER_CACHE=/tmp/.electron-builder-cache \
    PYTHONUNBUFFERED=1 \
    npm_config_python=/usr/bin/python3

# Install system dependencies required for Electron and native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials
    build-essential \
    git \
    curl \
    wget \
    python3 \
    python3-pip \
    python3-dev \
    pkg-config \
    # GUI libraries for Electron
    libgtk-3-0 \
    libgtk-3-dev \
    libgbm-dev \
    libxss1 \
    libasound2-dev \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgdk-pixbuf2.0-0 \
    # Additional Electron dependencies
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    # NSS and security libraries
    libnss3-dev \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    # Virtual display for headless builds
    xvfb \
    # Additional utilities
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Install global npm packages
RUN npm install -g electron-builder@24.9.1 --unsafe-perm

# Create non-root user for security
RUN groupadd -g 1001 builder && \
    useradd -r -u 1001 -g builder -m -d /home/builder -s /bin/bash builder && \
    mkdir -p /workspace /tmp/.electron-cache /tmp/.electron-builder-cache /tmp/.npm-cache && \
    chown -R builder:builder /home/builder /workspace /tmp/.electron-cache /tmp/.electron-builder-cache /tmp/.npm-cache

# Switch to non-root user
USER builder
WORKDIR /workspace

# Set up build environment
ENV HOME=/home/builder \
    XDG_CACHE_HOME=/tmp/.cache \
    DISPLAY=:99

# Copy package files first for better layer caching
COPY --chown=builder:builder package*.json ./

# Pre-install dependencies in a separate layer for better caching
# Clean install with proper error handling
RUN set -e && \
    echo "Node version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "Python version: $(python3 --version)" && \
    echo "Checking package.json..." && \
    cat package.json | grep -A5 -B5 '"name"' && \
    npm cache clean --force && \
    if [ -f "package-lock.json" ]; then \
        echo "Found package-lock.json, using npm ci..." && \
        npm ci --unsafe-perm --no-audit --no-fund --loglevel=info; \
    else \
        echo "No package-lock.json found, using npm install..." && \
        npm install --unsafe-perm --no-audit --no-fund --loglevel=info; \
    fi && \
    echo "Dependencies installed successfully" && \
    echo "Verifying installation..." && \
    npm ls --depth=0 || echo "Some peer dependencies missing, but continuing..."

# Copy the rest of the application
COPY --chown=builder:builder . .

# Expose workspace as volume mount point
VOLUME ["/workspace"]

# Default command
CMD ["npm", "run", "dist:linux"]
