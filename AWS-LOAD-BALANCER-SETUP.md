# AWS Lightsail Load Balancer Setup for ERKOS Security Dashboard

This guide shows you how to set up AWS Lightsail Load Balancer to route traffic from port 80 to your application running on any internal port (like 3002).

## 🎯 **Why Use AWS Load Balancer Instead of Nginx?**

- ✅ **Native AWS Integration** - No server configuration needed
- ✅ **Automatic Port Routing** - Routes port 80 → your app port seamlessly
- ✅ **SSL/TLS Support** - Easy HTTPS setup with AWS certificates
- ✅ **Health Monitoring** - Automatic health checks and recovery
- ✅ **High Availability** - Built-in redundancy and failover
- ✅ **Scalability** - Easy to add more instances later

## 🚀 **Step-by-Step Setup**

### **Step 1: Access Lightsail Console**
1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Navigate to **Networking** → **Load balancers**
3. Click **"Create load balancer"**

### **Step 2: Configure Basic Settings**
- **Load balancer location**: Same region as your instance
- **Availability Zone**: Choose the zone where your instance is located
- **Load balancer name**: `erkos-security-lb`

### **Step 3: Configure Target Instances**
- **Target instances**: Select your ERKOS instance
- **Target port**: `3002` (or whatever port your app is running on)
- **Health check path**: `/` (root path)
- **Health check protocol**: HTTP

### **Step 4: Configure Listeners**
- **HTTP Listener**: Port 80 → Target port 3002
- **HTTPS Listener** (optional): Port 443 → Target port 3002

### **Step 5: Review and Create**
- Review all settings
- Click **"Create load balancer"**
- Wait 5-10 minutes for provisioning

## 🔧 **Configuration Details**

### **Load Balancer Settings**
```
Name: erkos-security-lb
Protocol: HTTP/HTTPS
Listener Port: 80 (HTTP), 443 (HTTPS)
Target Port: 3002 (your app port)
Health Check: HTTP on /
```

### **Target Group Configuration**
```
Protocol: HTTP
Port: 3002
Health Check Path: /
Health Check Interval: 30 seconds
Healthy Threshold: 2
Unhealthy Threshold: 2
Timeout: 5 seconds
```

## 🌐 **DNS and Domain Setup**

### **Option 1: Use Load Balancer DNS Name**
After creation, you'll get a DNS name like:
```
erkos-security-lb-1234567890.us-east-2.elb.amazonaws.com
```

### **Option 2: Attach Static IP**
1. Create a **Static IP** in Lightsail
2. Attach it to your **Load Balancer**
3. Point your domain to this static IP

### **Option 3: Route 53 Integration**
1. Create a **Route 53 Hosted Zone** for your domain
2. Create an **Alias Record** pointing to your load balancer
3. Update your domain's nameservers

## 🔒 **SSL/TLS Certificate Setup**

### **Step 1: Request Certificate**
1. In Load Balancer settings, go to **"Certificates"**
2. Click **"Request certificate"**
3. Enter your domain name (e.g., `dashboard.erkos.com`)
4. Choose validation method (DNS recommended)

### **Step 2: Validate Certificate**
1. Add the DNS validation record to your domain
2. Wait for validation (usually 5-15 minutes)

### **Step 3: Attach Certificate**
1. Go to load balancer **"Listeners"**
2. Add **HTTPS listener** on port 443
3. Select your validated certificate

### **Step 4: Configure HTTP → HTTPS Redirect**
1. In load balancer settings
2. Enable **"HTTP to HTTPS redirection"**
3. All HTTP traffic will automatically redirect to HTTPS

## 🏥 **Health Checks**

The load balancer automatically monitors your application:

### **Health Check Configuration**
- **Path**: `/` (your home page)
- **Protocol**: HTTP
- **Port**: 3002 (your app port)
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy threshold**: 2 consecutive successes
- **Unhealthy threshold**: 2 consecutive failures

### **Health Check Responses**
Your application should return:
- **HTTP 200** status code for healthy
- **Any other status** for unhealthy

## 📊 **Monitoring and Metrics**

AWS provides built-in monitoring:

### **Available Metrics**
- Request count
- Response time
- Error rate (4xx, 5xx)
- Target health status
- Active connections

### **CloudWatch Integration**
- Automatic metric collection
- Custom dashboards
- Alerting and notifications

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Health Check Failing**
   ```bash
   # Test your app responds on the health check path
   curl http://localhost:3002/
   ```

2. **Target Not Receiving Traffic**
   ```bash
   # Check if app is listening on correct port
   sudo netstat -tlnp | grep :3002
   ```

3. **SSL Certificate Issues**
   - Verify DNS validation records
   - Check certificate status in console
   - Ensure domain points to load balancer

### **Verification Commands**

```bash
# Check app is running
pm2 status

# Test local connectivity
curl http://localhost:3002

# Check what ports are listening
sudo lsof -i -P | grep LISTEN

# View application logs
pm2 logs erkos-security-dashboard
```

## 🎯 **Final URLs**

After setup, your dashboard will be accessible at:

### **HTTP Access**
```
http://your-load-balancer-dns-name
http://your-static-ip
http://your-domain.com
```

### **HTTPS Access** (with certificate)
```
https://your-domain.com
```

## 💡 **Best Practices**

1. **Always use HTTPS** in production
2. **Enable HTTP → HTTPS redirect**
3. **Monitor health checks** regularly
4. **Set up CloudWatch alarms** for critical metrics
5. **Use static IP** for consistent access
6. **Keep certificates updated** (auto-renewal available)

## 🚀 **Scaling Options**

### **Add More Instances**
1. Create additional Lightsail instances
2. Deploy your application to them
3. Add them as targets to the load balancer

### **Auto Scaling** (Future)
- Upgrade to Application Load Balancer (ALB)
- Use Auto Scaling Groups
- Implement container-based deployment

---

**Note**: This setup eliminates the need for Nginx or any reverse proxy configuration on your server. AWS handles all the routing natively and more reliably than manual server configuration.
