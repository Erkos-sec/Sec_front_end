# ERKOS Security Dashboard - Enhanced Edition

A modern, feature-rich security dashboard with functional analytics and real-time data visualization for parking management and security monitoring.

## 🚀 Features

### Enhanced Functionality
- **Real-time Data Visualization**: Functional charts that display actual data from your database
- **Dynamic Dashboard**: All metrics update based on selected time ranges
- **Parking Utilization Tracking**: Live monitoring of parking spot availability
- **Infringement Management**: View and approve parking violations with one click
- **Foot Traffic Analytics**: Track visitor patterns with visual graphs
- **Average Stay Time**: Monitor vehicle and visitor duration metrics

### Modern UI/UX
- **Sleek Design**: Modern gradient backgrounds and smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Charts**: Powered by Chart.js with hover tooltips and animations
- **Live Updates**: Auto-refresh every 30 seconds to keep data current
- **Intuitive Navigation**: Easy-to-use time range filters and controls

### Security Features
- **Secure Authentication**: Bcrypt password hashing support
- **Session Management**: 24-hour secure sessions
- **Protected Routes**: Middleware-based authentication checks
- **Database Connection Pooling**: Optimized MySQL connections

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL Database
- npm or yarn package manager

## 🔧 Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd /Users/t0e03vc/Desktop/EK_Front/Sec_front
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the following variables:
   ```env
   PORT=3001
   NODE_ENV=development
   SESSION_SECRET=your-secret-key-here
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the dashboard**
   - Open your browser and navigate to `http://localhost:3001`
   - Login with your credentials from the database

## 📊 Database Schema

The application expects the following tables:

### Required Tables
- `clients` - User authentication and client information
- `locations` - Location data linked to clients
- `camera` - Camera information with spots_tracked field
- `car_detections` - Vehicle detection records with infraction data
- `ppl_detections` - People/foot traffic detection records

### Key Fields
- `clients.client_email` - Login email
- `clients.password` or `clients.password_` - Password (supports bcrypt)
- `camera.spots_tracked` - JSON field containing parking spot configuration
- `car_detections.infraction_occurred` - Boolean for violations
- `car_detections.approved` - Approval status for infractions

## 🎨 Features Breakdown

### Dashboard Metrics

1. **Parking Utilization Card**
   - Doughnut chart showing occupied vs available spots
   - Real-time percentage calculation
   - Total capacity display
   - Color-coded statistics

2. **Average Stay Time Card**
   - Vehicle average duration in hours
   - Foot traffic count
   - Progress bar visualization
   - Trend indicators

3. **Foot Traffic Analytics Card**
   - Line chart showing hourly patterns
   - Total visitor count
   - Peak vs normal flow indicators
   - Smooth animations

4. **Infringement Rate Card**
   - Violation percentage doughnut chart
   - Active violations count
   - Compliant vs violation breakdown
   - Alert badge for high rates

### Infraction Table
- Sortable columns
- Real-time data updates
- One-click approval system
- Detailed violation information
- Auto-refresh capability

## 🔄 API Endpoints

### Authentication
- `GET /auth/login` - Login page
- `POST /auth/login` - Login submission
- `GET /auth/logout` - Logout

### Dashboard
- `GET /dashboard` - Main dashboard page
- `GET /dashboard/api/stats?hours=24` - Get dashboard statistics
- `GET /dashboard/api/infractions?hours=24` - Get infraction data
- `POST /dashboard/api/approve` - Approve an infraction

## 🎯 Time Range Filters

- **Last 24 Hours** - Today's activity
- **Last 7 Days** - Weekly overview
- **Last 30 Days** - Monthly trends
- **Last Year** - Annual statistics

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Template Engine**: EJS
- **Database**: MySQL with connection pooling
- **Authentication**: bcryptjs, express-session
- **Charts**: Chart.js 4.4.0
- **Styling**: Custom CSS with modern gradients and animations

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints at:
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## 🔐 Security Best Practices

- Environment variables for sensitive data
- Session secret configuration
- Password hashing support
- SQL injection prevention via parameterized queries
- HTTPS ready (set `cookie.secure: true` in production)

## 🚦 Development vs Production

### Development
```bash
npm run dev
```
- Nodemon auto-reload
- Detailed error messages
- Development environment variables

### Production
```bash
npm start
```
- Set `NODE_ENV=production` in `.env`
- Enable HTTPS
- Set secure cookies
- Use production database

## 📈 Performance Optimizations

- Database connection pooling (10 connections)
- Efficient SQL queries with proper indexing
- Auto-refresh limited to 30-second intervals
- Lazy loading for chart data
- Optimized CSS animations

## 🎨 Customization

### Colors
Main color scheme uses:
- Primary: `#4F46E5` (Indigo)
- Success: `#10B981` (Green)
- Warning: `#EF4444` (Red)
- Purple: `#8B5CF6` (Purple)

### Fonts
- Primary: Inter (Google Fonts)
- Fallback: System fonts

## 🐛 Troubleshooting

### Database Connection Issues
- Verify database credentials in `.env`
- Check if MySQL server is running
- Ensure database exists and tables are created

### Login Issues
- Verify user exists in `clients` table
- Check password field name (`password` or `password_`)
- Ensure bcrypt hashes are valid

### Chart Not Displaying
- Check browser console for errors
- Verify Chart.js CDN is accessible
- Ensure data is being returned from API

## 📝 License

MIT License - Feel free to use and modify for your projects

## 👥 Support

For issues or questions, please check:
1. Database connection and credentials
2. Required tables exist with proper schema
3. Node.js and npm versions are compatible
4. All dependencies are installed

---

**Built with ❤️ for ERKOS Security**

*Enhanced Edition - Version 2.0.0*
