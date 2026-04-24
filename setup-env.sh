#!/bin/bash

# ERKOS Security Dashboard - Environment Setup Script
# This script creates a .env file with the necessary configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values from .env.example
DEFAULT_DB_HOST="db-uscentral-dev.c3q282o4et2s.us-east-2.rds.amazonaws.com"
DEFAULT_DB_USER="admin"
DEFAULT_DB_PASSWORD="HCZR2wAQ98c234c6KQfg"
DEFAULT_DB_NAME="clients_detections"
DEFAULT_PORT="3000"
DEFAULT_NODE_ENV="production"

# Logging functions
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

prompt() {
    echo -e "${CYAN}[INPUT]${NC} $1"
}

# Generate a secure session secret
generate_session_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32
    elif command -v head &> /dev/null && [ -f /dev/urandom ]; then
        head -c 32 /dev/urandom | base64
    else
        # Fallback method
        date +%s | sha256sum | base64 | head -c 32
    fi
}

# Function to prompt for input with default value
prompt_with_default() {
    local prompt_text="$1"
    local default_value="$2"
    local var_name="$3"
    local is_password="$4"
    
    if [ "$is_password" = "true" ]; then
        prompt "$prompt_text (default: [hidden]): "
        read -s user_input
        echo  # New line after password input
    else
        prompt "$prompt_text (default: $default_value): "
        read user_input
    fi
    
    if [ -z "$user_input" ]; then
        eval "$var_name=\"$default_value\""
    else
        eval "$var_name=\"$user_input\""
    fi
}

# Main setup function
main() {
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ERKOS Security Dashboard                    ║${NC}"
    echo -e "${GREEN}║              Environment Setup Script                    ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log "This script will help you create a .env file for your ERKOS Security Dashboard"
    echo ""
    
    # Check if .env already exists
    if [ -f ".env" ]; then
        warning ".env file already exists!"
        echo ""
        prompt "Do you want to:"
        echo "  1) Backup existing .env and create new one"
        echo "  2) Exit and keep existing .env"
        echo ""
        prompt "Enter your choice (1 or 2): "
        read choice
        
        case $choice in
            1)
                log "Backing up existing .env to .env.backup.$(date +%Y%m%d_%H%M%S)"
                cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
                ;;
            2)
                log "Keeping existing .env file. Exiting..."
                exit 0
                ;;
            *)
                error "Invalid choice. Exiting..."
                exit 1
                ;;
        esac
        echo ""
    fi
    
    log "Please provide the following configuration details:"
    log "Press Enter to use default values shown in brackets"
    echo ""
    
    # Database Configuration
    echo -e "${YELLOW}=== Database Configuration ===${NC}"
    prompt_with_default "Database Host" "$DEFAULT_DB_HOST" "DB_HOST"
    prompt_with_default "Database User" "$DEFAULT_DB_USER" "DB_USER"
    prompt_with_default "Database Password" "$DEFAULT_DB_PASSWORD" "DB_PASSWORD" "true"
    prompt_with_default "Database Name" "$DEFAULT_DB_NAME" "DB_NAME"
    echo ""
    
    # Server Configuration
    echo -e "${YELLOW}=== Server Configuration ===${NC}"
    prompt_with_default "Server Port" "$DEFAULT_PORT" "PORT"
    
    echo ""
    prompt "Environment (development/production): "
    echo "  1) production (recommended for deployment)"
    echo "  2) development (for local development)"
    read env_choice
    
    case $env_choice in
        1|"")
            NODE_ENV="production"
            ;;
        2)
            NODE_ENV="development"
            ;;
        *)
            NODE_ENV="production"
            warning "Invalid choice, defaulting to production"
            ;;
    esac
    echo ""
    
    # Generate session secret
    log "Generating secure session secret..."
    SESSION_SECRET=$(generate_session_secret)
    
    # Create .env file
    log "Creating .env file..."
    
    cat > .env << EOF
# ERKOS Security Dashboard Environment Configuration
# Generated on $(date)

# Database Configuration
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=3306

# Server Configuration
PORT=$PORT
NODE_ENV=$NODE_ENV

# Session Configuration
SESSION_SECRET=$SESSION_SECRET

# Application Configuration
LOG_LEVEL=info

# Security Configuration
BCRYPT_ROUNDS=12

# Optional: Email Configuration (for notifications)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# Optional: SSL Configuration
# SSL_CERT_PATH=/path/to/certificate.crt
# SSL_KEY_PATH=/path/to/private.key
EOF
    
    # Set proper permissions
    chmod 600 .env
    
    success ".env file created successfully!"
    echo ""
    
    # Display configuration summary (without sensitive data)
    echo -e "${CYAN}=== Configuration Summary ===${NC}"
    echo "Database Host: $DB_HOST"
    echo "Database User: $DB_USER"
    echo "Database Name: $DB_NAME"
    echo "Server Port: $PORT"
    echo "Environment: $NODE_ENV"
    echo "Session Secret: [Generated securely]"
    echo ""
    
    # Security reminder
    echo -e "${YELLOW}=== Security Reminders ===${NC}"
    warning "The .env file contains sensitive information!"
    log "✓ File permissions set to 600 (owner read/write only)"
    log "✓ Never commit .env files to version control"
    log "✓ Use different credentials for production vs development"
    echo ""
    
    # Test database connection (optional)
    prompt "Would you like to test the database connection? (y/N): "
    read test_db
    
    if [[ "$test_db" =~ ^[Yy]$ ]]; then
        test_database_connection
    fi
    
    success "Environment setup complete!"
    log "You can now start your application with: npm start"
    echo ""
}

# Test database connection
test_database_connection() {
    log "Testing database connection..."
    
    # Check if mysql client is available
    if ! command -v mysql &> /dev/null; then
        warning "MySQL client not found. Skipping connection test."
        log "Install mysql-client to test connections: sudo apt install mysql-client"
        return
    fi
    
    # Test connection with timeout
    if timeout 10 mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" &>/dev/null; then
        success "Database connection successful!"
    else
        error "Database connection failed!"
        warning "Please verify your database credentials and network connectivity"
        log "Common issues:"
        log "  - Incorrect host, username, or password"
        log "  - Database server not accessible from this location"
        log "  - Firewall blocking the connection"
        log "  - Database does not exist"
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
}

# Set trap for cleanup
trap cleanup EXIT

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    error "This script must be run from the application root directory"
    error "Please cd to the directory containing package.json"
    exit 1
fi

# Run main function
main "$@"
