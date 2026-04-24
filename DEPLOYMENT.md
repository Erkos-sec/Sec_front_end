# ERKOS Security Dashboard - AWS Lightsail Deployment Guide

This guide provides complete instructions for deploying the ERKOS Security Dashboard to AWS Lightsail.

## Prerequisites

1. **AWS Lightsail Instance**
   - Ubuntu 20.04 LTS or newer
   - At least 1GB RAM (2GB recommended)
   - Node.js blueprint or blank Ubuntu instance

2. **Database Setup**
   - MySQL database (can be on same instance or separate RDS)
   - Database credentials and connection details

3. **Domain (Optional)**
   - Custom domain pointing to your Lightsail instance IP

## Quick Deployment

### Step 1: Connect to Your Lightsail Instance

```bash
# Using Lightsail browser-based SSH or
ssh -i your-key.pem bitnami@your-instance-ip
```

### Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/your-username/your-repo.git
cd your-repo/Sec_front_end
```

### Step 3: Update Configuration

1. **Update deploy.sh**:
   ```bash
   nano deploy.sh
   ```
   - Change `REPO_URL` to your actual repository URL
   - Modify `APP_NAME` if desired
   - Adjust `PORT` if needed

2. **Update ecosystem.config.js**:
   ```bash
   nano ecosystem.config.js
   ```
   - Update repository URL in deploy section
   - Modify host IP address

### Step 4: Run Deployment Script

```bash
# Make script executable and run
chmod +x deploy.sh
sudo ./deploy.sh
```

The script will automatically:
- Install Node.js, npm, PM2, and Git
- Clone/pull latest code
- Install dependencies
- Setup environment variables
- Configure firewall
- Start the application
- Setup Nginx reverse proxy
- Perform health checks

## Manual Deployment Steps

If you prefer manual deployment or need to troubleshoot:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### 2. Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/bitnami/projects/erkos-security-dashboard
sudo chown -R $USER:$USER /opt/bitnami/projects/erkos-security-dashboard

# Clone repository
git clone https://github.com/your-username/your-repo.git /opt/bitnami/projects/erkos-security-dashboard
cd /opt/bitnami/projects/erkos-security-dashboard

# Install dependencies
npm ci --production
```

### 3. Configure Environment

```bash
# Create .env file
cp .env.example .env
nano .env
```

Update with your database credentials:
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
SESSION_SECRET=your-session-secret
```

### 4. Start Application

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Setup Nginx (Optional)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/erkos-dashboard
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or use _ for any domain
    
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
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/erkos-dashboard /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Useful Commands

### Application Management
```bash
# Check application status
pm2 status

# View logs
pm2 logs erkos-security-dashboard

# Restart application
pm2 restart erkos-security-dashboard

# Stop application
pm2 stop erkos-security-dashboard

# Monitor application
pm2 monit
```

### Updates and Redeployment
```bash
# Pull latest changes
cd /opt/bitnami/projects/erkos-security-dashboard
git pull origin main

# Install new dependencies (if any)
npm ci --production

# Restart application
pm2 restart erkos-security-dashboard
```

### Using npm Scripts
```bash
# Deploy (runs full deployment script)
npm run deploy

# Start in production mode
npm run deploy:production

# Stop application
npm run deploy:stop

# Restart application
npm run deploy:restart

# View logs
npm run deploy:logs

# Check status
npm run deploy:status
```

## Firewall Configuration

The deployment script automatically configures UFW firewall:

```bash
# Manual firewall setup if needed
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Application (if not using Nginx)
sudo ufw enable
```

## SSL Certificate (Optional)

For HTTPS, use Let's Encrypt:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logs

### Application Logs
```bash
# PM2 logs
pm2 logs erkos-security-dashboard

# Application log files
tail -f /opt/bitnami/projects/erkos-security-dashboard/logs/combined.log
```

### System Monitoring
```bash
# System resources
htop

# Disk usage
df -h

# Memory usage
free -h

# PM2 monitoring
pm2 monit
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **Permission Errors**
   ```bash
   sudo chown -R bitnami:bitnami /opt/bitnami/projects/erkos-security-dashboard
   ```

3. **Database Connection Issues**
   - Check .env file credentials
   - Verify database server is running
   - Check firewall rules

4. **Application Won't Start**
   ```bash
   # Check PM2 logs
   pm2 logs erkos-security-dashboard
   
   # Check application directly
   cd /opt/bitnami/projects/erkos-security-dashboard
   node server.js
   ```

### Health Checks

```bash
# Check if application is responding
curl http://localhost:3000

# Check Nginx status
sudo systemctl status nginx

# Check PM2 processes
pm2 status
```

## Security Considerations

1. **Environment Variables**: Never commit .env files to version control
2. **Database Security**: Use strong passwords and restrict access
3. **Firewall**: Only open necessary ports
4. **Updates**: Keep system and dependencies updated
5. **SSL**: Use HTTPS in production
6. **Backup**: Regular database and application backups

## Performance Optimization

1. **PM2 Clustering**: Enable cluster mode for multiple CPU cores
2. **Nginx Caching**: Configure appropriate caching headers
3. **Database Optimization**: Index frequently queried columns
4. **Monitoring**: Use PM2 monitoring or external services

## Support

For deployment issues:
1. Check the logs: `pm2 logs erkos-security-dashboard`
2. Verify configuration files
3. Check system resources
4. Review firewall settings

---

**Note**: Remember to update the repository URLs, domain names, and database credentials in the configuration files before deployment.
