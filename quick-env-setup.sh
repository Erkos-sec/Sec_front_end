#!/bin/bash

# ERKOS Security Dashboard - Quick Environment Setup
# One-liner script to create .env file with default production settings

echo "🚀 Creating .env file for ERKOS Security Dashboard..."

# Generate secure session secret
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64 2>/dev/null || echo "erkos_security_$(date +%s)_$(whoami)")

# Create .env file with production settings
cat > .env << 'EOF'
# ERKOS Security Dashboard Environment Configuration
# Production Environment

# Database Configuration
DB_HOST=db-uscentral-dev.c3q282o4et2s.us-east-2.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=HCZR2wAQ98c234c6KQfg
DB_NAME=clients_detections
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# Session Configuration
SESSION_SECRET=SESSION_SECRET_PLACEHOLDER

# Application Configuration
LOG_LEVEL=info

# Security Configuration
BCRYPT_ROUNDS=12

# Optional: Email Configuration (uncomment and configure if needed)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# Optional: SSL Configuration (uncomment and configure if needed)
# SSL_CERT_PATH=/path/to/certificate.crt
# SSL_KEY_PATH=/path/to/private.key
EOF

# Replace the placeholder with actual session secret
sed -i "s/SESSION_SECRET_PLACEHOLDER/$SESSION_SECRET/" .env

# Set secure permissions
chmod 600 .env

echo "✅ .env file created successfully!"
echo "📁 File location: $(pwd)/.env"
echo "🔒 Permissions set to 600 (secure)"
echo ""
echo "Configuration:"
echo "  • Database: clients_detections on AWS RDS"
echo "  • Port: 3000"
echo "  • Environment: production"
echo "  • Session Secret: [Generated securely]"
echo ""
echo "🚀 Ready to deploy! Run: sudo ./deploy.sh"
