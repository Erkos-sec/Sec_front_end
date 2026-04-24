# Quick .env Setup for Lightsail

## Copy and Paste This Command Block

Simply copy this entire block and paste it into your Lightsail terminal:

```bash
# Navigate to app directory and create .env file
cd /opt/bitnami/projects/erkos-security-dashboard

# Generate secure session secret
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "erkos_security_$(date +%s)_$(whoami)")

# Create .env file with sudo
sudo tee .env > /dev/null << EOF
# ERKOS Security Dashboard Environment Configuration
DB_HOST=db-uscentral-dev.c3q282o4et2s.us-east-2.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=HCZR2wAQ98c234c6KQfg
DB_NAME=clients_detections
DB_PORT=3306
PORT=3000
NODE_ENV=production
SESSION_SECRET=$SESSION_SECRET
LOG_LEVEL=info
BCRYPT_ROUNDS=12
EOF

# Set secure permissions
sudo chmod 600 .env

# Confirm creation
echo "✅ .env file created with secure permissions"
ls -la .env
```

## Alternative: One-Line Version

If you prefer a single command:

```bash
cd /opt/bitnami/projects/erkos-security-dashboard && sudo tee .env > /dev/null << 'EOF'
DB_HOST=db-uscentral-dev.c3q282o4et2s.us-east-2.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=HCZR2wAQ98c234c6KQfg
DB_NAME=clients_detections
DB_PORT=3306
PORT=3000
NODE_ENV=production
SESSION_SECRET=erkos_security_dashboard_2024_secret_key
LOG_LEVEL=info
BCRYPT_ROUNDS=12
EOF
sudo chmod 600 .env && echo "✅ .env file created"
```

## Verification

After running either command, verify your .env file:

```bash
# Check file exists and has correct permissions
ls -la .env

# View file contents (be careful - contains passwords!)
cat .env
```

## Next Steps

Once your .env file is created, you can run the deployment:

```bash
sudo ./deploy.sh
```

---

**Security Note**: The .env file contains sensitive database credentials. The script automatically sets secure permissions (600) so only the owner can read/write the file.
