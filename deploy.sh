#!/bin/bash

# ERKOS Security Dashboard - AWS Lightsail Deployment Script
# This script handles complete deployment including git pull, dependencies, and app startup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="erkos-security-dashboard"
APP_DIR="/opt/bitnami/projects/$APP_NAME"
REPO_URL="https://github.com/Erkos-sec/Sec_front_end.git"  # Your actual repo URL
NODE_VERSION="18"
PORT=3000

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Install Node.js and npm if not present
install_nodejs() {
    log "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        log "Installing Node.js $NODE_VERSION..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        apt-get install -y nodejs
    else
        log "Node.js is already installed: $(node --version)"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    log "npm version: $(npm --version)"
}

# Install PM2 for process management
install_pm2() {
    log "Checking PM2 installation..."
    
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        npm install -g pm2
        pm2 startup
    else
        log "PM2 is already installed: $(pm2 --version)"
    fi
}

# Install Git if not present
install_git() {
    log "Checking Git installation..."
    
    if ! command -v git &> /dev/null; then
        log "Installing Git..."
        apt-get update
        apt-get install -y git
    else
        log "Git is already installed: $(git --version)"
    fi
}

# Create application directory and set permissions
setup_app_directory() {
    log "Setting up application directory..."
    
    # Create directory if it doesn't exist
    mkdir -p "$APP_DIR"
    
    # Set proper ownership (assuming bitnami user exists on Lightsail)
    if id "bitnami" &>/dev/null; then
        chown -R bitnami:bitnami "$APP_DIR"
        log "Set ownership to bitnami user"
    else
        warning "bitnami user not found, keeping root ownership"
    fi
}

# Configure git to never prompt for credentials
configure_git() {
    log "Configuring git to avoid credential prompts..."
    
    # Set git to never prompt for credentials
    export GIT_TERMINAL_PROMPT=0
    export GIT_ASKPASS=/bin/echo
    
    # Configure git globally to avoid prompts
    git config --global credential.helper ""
    git config --global --unset-all credential.helper || true
    
    # Set timeout to fail fast instead of hanging
    git config --global http.timeout 10
    git config --global https.timeout 10
}

# Clone or pull repository
deploy_code() {
    log "Deploying application code..."
    
    # Configure git first
    configure_git
    
    if [ -d "$APP_DIR/.git" ]; then
        log "Repository exists, attempting to pull latest changes..."
        cd "$APP_DIR"
        
        # Stash any local changes
        git stash --quiet || true
        
        # Try to pull latest changes with no credential prompts
        # Use timeout to prevent hanging
        if timeout 30 git -c credential.helper="" pull origin main 2>/dev/null || timeout 30 git -c credential.helper="" pull origin master 2>/dev/null; then
            log "Successfully pulled latest changes from repository"
            # Apply stashed changes if any
            git stash pop --quiet || true
        else
            warning "Could not pull from repository (authentication, network, or timeout)"
            warning "Continuing with existing code in $APP_DIR"
            # Still try to pop stash in case we stashed something
            git stash pop --quiet || true
        fi
    else
        log "No existing repository found, attempting to clone..."
        
        # Try to clone with timeout and no credential prompts
        if timeout 60 git -c credential.helper="" clone "$REPO_URL" "$APP_DIR" 2>/dev/null; then
            log "Successfully cloned repository"
            cd "$APP_DIR"
        else
            warning "Could not clone repository (authentication, network, or timeout)"
            
            # Check if there's already application code in the directory
            if [ -f "$APP_DIR/server.js" ] && [ -f "$APP_DIR/package.json" ]; then
                log "Found existing application code in $APP_DIR"
                log "Continuing deployment with existing files..."
                cd "$APP_DIR"
            else
                error "No application code found in $APP_DIR"
                error "Please either:"
                error "  1. Manually upload your code to $APP_DIR"
                error "  2. Use a public repository URL"
                error "  3. Configure SSH keys for git authentication"
                exit 1
            fi
        fi
    fi
    
    # Show current commit if we're in a git repository
    if [ -d ".git" ]; then
        log "Current commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
        log "Last commit message: $(git log -1 --pretty=%B 2>/dev/null || echo 'No commit history')"
    else
        log "Not a git repository, using local files"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing Node.js dependencies..."
    cd "$APP_DIR"
    
    # Clear npm cache
    npm cache clean --force
    
    # Install dependencies
    npm ci --production
    
    success "Dependencies installed successfully"
}

# Setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    cd "$APP_DIR"
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        log "Creating .env file..."
        cat > .env << EOF
# ERKOS Security Dashboard Environment Configuration
NODE_ENV=production
PORT=$PORT

# Database Configuration
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32)

# Application Configuration
LOG_LEVEL=info
EOF
        warning "Please update the .env file with your actual database credentials"
    else
        log ".env file already exists"
    fi
    
    # Set proper permissions
    chmod 600 .env
}

# Configure firewall
setup_firewall() {
    log "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        log "Using UFW (Uncomplicated Firewall)..."
        # Allow HTTP and HTTPS traffic
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow $PORT/tcp
        
        # Enable firewall if not already enabled
        ufw --force enable
        success "UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        log "Using firewalld..."
        # Allow HTTP and HTTPS traffic
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=$PORT/tcp
        firewall-cmd --reload
        success "firewalld configured"
    elif command -v iptables &> /dev/null; then
        log "Using iptables..."
        # Allow HTTP and HTTPS traffic
        iptables -A INPUT -p tcp --dport 80 -j ACCEPT
        iptables -A INPUT -p tcp --dport 443 -j ACCEPT
        iptables -A INPUT -p tcp --dport $PORT -j ACCEPT
        
        # Save iptables rules if possible
        if command -v iptables-save &> /dev/null; then
            iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
        fi
        success "iptables configured"
    else
        warning "No supported firewall found (ufw, firewalld, or iptables)"
        warning "Please manually configure your firewall to allow:"
        warning "  - Port 80 (HTTP)"
        warning "  - Port 443 (HTTPS)" 
        warning "  - Port $PORT (Application)"
        log "On AWS Lightsail, you can configure firewall rules in the Lightsail console"
    fi
}

# Start application with PM2
start_application() {
    log "Starting application with PM2..."
    cd "$APP_DIR"
    
    # Stop existing process if running
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start application
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Show status
    pm2 status
    
    success "Application started successfully"
}

# Setup Nginx reverse proxy (optional)
setup_nginx() {
    log "Setting up Nginx reverse proxy..."
    
    if ! command -v nginx &> /dev/null; then
        log "Installing Nginx..."
        apt-get update
        apt-get install -y nginx
    fi
    
    # Check if port 80 is in use by another service
    if lsof -ti:80 &>/dev/null; then
        warning "Port 80 is already in use"
        log "Checking for conflicting services..."
        
        # Stop common conflicting services
        for service in apache2 httpd lighttpd; do
            if systemctl is-active --quiet $service 2>/dev/null; then
                log "Stopping $service..."
                systemctl stop $service 2>/dev/null || true
                systemctl disable $service 2>/dev/null || true
            fi
        done
    fi
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Handle static files efficiently
    location /css/ {
        proxy_pass http://localhost:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /js/ {
        proxy_pass http://localhost:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /images/ {
        proxy_pass http://localhost:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    if nginx -t; then
        log "Nginx configuration is valid"
        
        # Try to start/reload Nginx
        if systemctl is-active --quiet nginx 2>/dev/null; then
            systemctl reload nginx || systemctl restart nginx
        else
            systemctl start nginx || service nginx start || nginx
        fi
        
        # Enable Nginx to start on boot
        systemctl enable nginx 2>/dev/null || true
        
        success "Nginx configured successfully"
    else
        error "Nginx configuration has errors"
        warning "Continuing deployment without Nginx proxy"
        warning "Your application will be accessible directly on port $PORT"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 5
    
    # Check if application is responding
    if curl -f -s "http://localhost:$PORT" > /dev/null; then
        success "Application is responding on port $PORT"
    else
        error "Application health check failed"
        pm2 logs $APP_NAME --lines 20
        exit 1
    fi
}

# Main deployment function
main() {
    log "Starting ERKOS Security Dashboard deployment..."
    
    check_permissions
    install_git
    install_nodejs
    install_pm2
    setup_app_directory
    deploy_code
    install_dependencies
    setup_environment
    setup_firewall
    start_application
    setup_nginx
    health_check
    
    success "Deployment completed successfully!"
    log "Application is running on http://$(curl -s ifconfig.me):80"
    log "You can also access it directly on port $PORT"
    log ""
    log "Useful commands:"
    log "  pm2 status           - Check application status"
    log "  pm2 logs $APP_NAME   - View application logs"
    log "  pm2 restart $APP_NAME - Restart application"
    log "  pm2 stop $APP_NAME   - Stop application"
}

# Run main function
main "$@"
