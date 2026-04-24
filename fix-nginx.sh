#!/bin/bash

# ERKOS Security Dashboard - Nginx Port Conflict Fix
# This script resolves common Nginx deployment issues on Lightsail

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check what's using port 80
check_port_80() {
    log "Checking what's using port 80..."
    
    if command -v lsof &> /dev/null; then
        PORT_80_PROCESS=$(lsof -ti:80 2>/dev/null || echo "")
        if [ -n "$PORT_80_PROCESS" ]; then
            log "Port 80 is being used by:"
            ps -p $PORT_80_PROCESS -o pid,ppid,cmd 2>/dev/null || echo "Process not found"
        fi
    elif command -v netstat &> /dev/null; then
        log "Port 80 usage:"
        netstat -tlnp | grep :80 || echo "No process found on port 80"
    elif command -v ss &> /dev/null; then
        log "Port 80 usage:"
        ss -tlnp | grep :80 || echo "No process found on port 80"
    fi
}

# Stop conflicting services
stop_conflicting_services() {
    log "Stopping conflicting web servers..."
    
    # Common web servers that might conflict
    for service in apache2 httpd lighttpd; do
        if systemctl is-active --quiet $service 2>/dev/null; then
            log "Stopping $service..."
            systemctl stop $service
            systemctl disable $service
            success "$service stopped and disabled"
        fi
    done
}

# Fix Nginx configuration and start
fix_nginx() {
    log "Configuring Nginx for ERKOS Security Dashboard..."
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/erkos-dashboard << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # Handle WebSocket connections
        proxy_set_header Sec-WebSocket-Extensions $http_sec_websocket_extensions;
        proxy_set_header Sec-WebSocket-Key $http_sec_websocket_key;
        proxy_set_header Sec-WebSocket-Version $http_sec_websocket_version;
    }
    
    # Handle static files efficiently
    location /css/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /js/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /images/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/erkos-dashboard /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    if nginx -t; then
        success "Nginx configuration is valid"
    else
        error "Nginx configuration has errors"
        return 1
    fi
}

# Start Nginx service
start_nginx() {
    log "Starting Nginx service..."
    
    # Try different methods to start Nginx
    if systemctl start nginx 2>/dev/null; then
        success "Nginx started with systemctl"
    elif service nginx start 2>/dev/null; then
        success "Nginx started with service command"
    elif nginx 2>/dev/null; then
        success "Nginx started directly"
    else
        error "Failed to start Nginx"
        return 1
    fi
    
    # Enable Nginx to start on boot
    systemctl enable nginx 2>/dev/null || true
}

# Verify Nginx is working
verify_nginx() {
    log "Verifying Nginx is working..."
    
    sleep 2
    
    if curl -f -s http://localhost:80 > /dev/null; then
        success "Nginx is responding on port 80"
    else
        warning "Nginx may not be responding on port 80"
        log "This might be normal if your Node.js app isn't running yet"
    fi
    
    # Show Nginx status
    if systemctl is-active --quiet nginx 2>/dev/null; then
        success "Nginx service is active"
    else
        warning "Nginx service status unclear"
    fi
}

# Main function
main() {
    log "ERKOS Security Dashboard - Nginx Fix Script"
    echo ""
    
    check_port_80
    echo ""
    
    stop_conflicting_services
    echo ""
    
    fix_nginx
    echo ""
    
    start_nginx
    echo ""
    
    verify_nginx
    echo ""
    
    success "Nginx configuration complete!"
    log "Your ERKOS Security Dashboard should now be accessible on port 80"
    log "Make sure your Node.js application is running on port 3000"
}

# Run main function
main "$@"
