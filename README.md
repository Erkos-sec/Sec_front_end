# ERKOS Security Dashboard

A modern, responsive dashboard application for ERKOS Security parking management system. Built with Node.js, Express, and MySQL.

## Features

- 🔐 **Secure Authentication** - Email/password login with session management
- 📊 **Interactive Charts** - Real-time pie charts showing parking statistics
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Auto-refreshing dashboard data every 30 seconds
- 🎨 **Modern UI** - Clean, professional interface with smooth animations
- 📈 **Key Metrics Tracking**:
  - Parking utilization rates
  - Average stay times for cars and people
  - Foot traffic monitoring
  - Infringement rate tracking

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL (AWS RDS)
- **Frontend**: EJS templating with vanilla JavaScript
- **Charts**: Chart.js for interactive visualizations
- **Styling**: Modern CSS with animations and responsive design
- **Session Management**: Express-session with secure configuration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to the MySQL database (configured in .env)

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd "New App"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   The `.env` file is already configured with the database credentials from the old app. Make sure the database is accessible.

4. **Start the application**:
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## Database Schema

The application connects to the existing `clients_detections` database with the following key tables:

- `clients` - User authentication and client information
- `locations` - Camera and location mapping
- `car_detections` - Vehicle detection and parking data
- `foot_traffic` - Pedestrian traffic data
- `camera` - Camera configuration and spot tracking

## Usage

### Login
- Use existing client credentials from the old system
- Email and password authentication
- Session-based login with "Keep me signed in" option

### Dashboard Features
- **Time Filter**: Switch between Today, This Week, This Month, and This Year views
- **Auto-refresh**: Data updates automatically every 30 seconds
- **Interactive Charts**: Hover over pie charts for detailed information
- **Responsive Layout**: Optimized for all screen sizes

### Key Metrics
1. **Parking Utilization Rate**: Shows occupied vs available parking spots
2. **Average Stay Time**: Displays average duration for cars and people
3. **Foot Traffic**: Tracks pedestrian movement with trend indicators
4. **Infringement Rate**: Monitors parking violations and compliance

## API Endpoints

- `GET /` - Root redirect to dashboard or login
- `GET /auth/login` - Login page
- `POST /auth/login` - Authentication endpoint
- `GET /auth/logout` - Logout and session destruction
- `GET /dashboard` - Main dashboard page
- `GET /dashboard/api/stats` - JSON API for dashboard statistics

## Security Features

- Password hashing support (bcrypt)
- Session-based authentication
- SQL injection prevention with prepared statements
- XSS protection through EJS templating
- Secure session configuration
- Environment variable protection

## Performance Optimizations

- Database connection pooling
- Efficient SQL queries with proper indexing
- Client-side caching of static assets
- Optimized chart rendering
- Responsive image loading

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Development

### File Structure
```
New App/
├── config/
│   └── database.js          # Database connection and pooling
├── public/
│   └── css/
│       ├── login.css        # Login page styles
│       └── dashboard.css    # Dashboard styles
├── routes/
│   ├── auth.js             # Authentication routes
│   └── dashboard.js        # Dashboard routes and API
├── views/
│   ├── login.ejs           # Login page template
│   ├── dashboard.ejs       # Dashboard template
│   └── error.ejs           # Error page template
├── .env                    # Environment configuration
├── package.json           # Dependencies and scripts
├── server.js              # Main application server
└── README.md              # This file
```

### Adding New Features
1. Create new routes in the `routes/` directory
2. Add corresponding EJS templates in `views/`
3. Update CSS files for styling
4. Test with the existing database structure

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check `.env` file configuration
   - Verify database server accessibility
   - Ensure correct credentials

2. **Login Issues**:
   - Verify client exists in `clients` table
   - Check password format (hashed vs plain text)
   - Review session configuration

3. **Charts Not Loading**:
   - Check browser console for JavaScript errors
   - Verify Chart.js CDN accessibility
   - Ensure data is being returned from API

### Logs
- Application logs are output to console
- Database connection status is logged on startup
- Authentication attempts are logged for security

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production` in environment
- [ ] Configure HTTPS for secure sessions
- [ ] Set up proper logging (Winston, etc.)
- [ ] Configure reverse proxy (nginx)
- [ ] Set up process manager (PM2)
- [ ] Configure database backup strategy

### Environment Variables for Production
```env
NODE_ENV=production
SESSION_SECRET=your_secure_random_secret_here
DB_HOST=your_production_db_host
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password
DB_NAME=clients_detections
PORT=3000
```

## Support

For issues or questions regarding this dashboard application, please check:
1. Database connectivity and credentials
2. Node.js and npm versions
3. Browser console for client-side errors
4. Server logs for backend issues

## License

This project is proprietary software for ERKOS Security.

---

© 2024 ERKOS SECURITY
