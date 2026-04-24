# 🚀 Getting Started - ERKOS Security Dashboard

## Quick Installation (5 Minutes)

### 1️⃣ Install Dependencies
```bash
cd /Users/t0e03vc/Desktop/EK_Front/Sec_front
npm install
```

### 2️⃣ Configure Environment
Create your `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
PORT=3001
SESSION_SECRET=erkos-security-2024-secret-key
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
```

### 3️⃣ Start the Server
```bash
npm start
```

Or use the convenient startup script:
```bash
./start.sh
```

### 4️⃣ Access Dashboard
Open your browser:
```
http://localhost:3001
```

Login with credentials from your `clients` table.

---

## 📁 Project Structure

```
Sec_front/
├── config/
│   └── database.js          # MySQL connection pool
├── public/
│   ├── css/
│   │   ├── dashboard.css    # Enhanced dashboard styles
│   │   └── login.css        # Modern login page styles
│   └── images/
│       └── erkos.png        # Logo (copied from template)
├── routes/
│   ├── auth.js              # Login/logout routes
│   └── dashboard.js         # Dashboard & API endpoints
├── views/
│   ├── dashboard.ejs        # Main dashboard with charts
│   ├── login.ejs            # Enhanced login page
│   └── error.ejs            # Error page
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── server.js               # Express server
├── start.sh                # Startup script
├── README.md               # Full documentation
├── SETUP.md                # Setup guide
├── IMPROVEMENTS.md         # Feature comparison
└── GETTING_STARTED.md      # This file
```

---

## 🎯 Key Features

### ✨ Enhanced Dashboard
- **Functional Charts**: All graphs show real data from your database
- **Parking Utilization**: Doughnut chart with live percentage
- **Stay Time Metrics**: Progress bars and visual indicators
- **Foot Traffic**: Line chart showing hourly patterns
- **Infringement Tracking**: Color-coded violation rates

### 🎨 Modern Design
- Gradient backgrounds and smooth animations
- Icon-enhanced cards and metrics
- Hover effects and transitions
- Mobile-responsive layout
- Professional color scheme (Indigo/Purple/Green)

### 🔄 Real-time Updates
- Auto-refresh every 30 seconds
- Time range filters (24h, 7d, 30d, 1y)
- Live data from MySQL database
- Instant infraction approval

---

## 🗄️ Database Requirements

Your MySQL database should have these tables:

### Required Tables
1. **clients** - User authentication
   - `client_email` (login)
   - `password` or `password_` (bcrypt supported)
   - `client_name`

2. **locations** - Location data
   - `location_id`
   - `client_email`

3. **camera** - Camera configuration
   - `camera_id`
   - `location_id`
   - `spots_tracked` (JSON field)

4. **car_detections** - Vehicle records
   - `car_id`
   - `license_plate`
   - `duration`
   - `zone_`
   - `infraction_occurred`
   - `approved`
   - `timestamp_first_detected`

5. **ppl_detections** - Foot traffic (optional)
   - `person_id`
   - `camera_id`
   - `timestamp_first_detected`

---

## 🎨 What's Different from Template?

### Visual Enhancements
✅ Animated login background with floating circles
✅ Icon-enhanced input fields
✅ Gradient card headers with badges
✅ Modern color scheme (Indigo instead of Teal)
✅ Smooth hover and loading animations
✅ Better mobile responsiveness

### Functional Improvements
✅ Charts properly scaled to actual data
✅ Center percentage display in doughnut charts
✅ New line chart for foot traffic patterns
✅ Progress bars for stay time metrics
✅ Enhanced table with badges
✅ Better data accuracy in calculations

### Code Quality
✅ Clean, organized CSS
✅ Consistent naming conventions
✅ Proper error handling
✅ Optimized animations
✅ Accessibility considerations

---

## 🔧 Common Commands

```bash
# Install dependencies
npm install

# Start server (production)
npm start

# Start with auto-reload (development)
npm run dev

# Use startup script
./start.sh
```

---

## 📊 API Endpoints

### Authentication
- `GET /auth/login` - Login page
- `POST /auth/login` - Login submission
- `GET /auth/logout` - Logout

### Dashboard
- `GET /dashboard` - Main dashboard
- `GET /dashboard/api/stats?hours=24` - Get statistics
- `GET /dashboard/api/infractions?hours=24` - Get infractions
- `POST /dashboard/api/approve` - Approve infraction

---

## 🎯 Testing Checklist

After installation, verify:

- [ ] Server starts without errors
- [ ] Can access login page at http://localhost:3001
- [ ] Can login with database credentials
- [ ] Dashboard loads with all 4 metric cards
- [ ] Charts display with actual data
- [ ] Time filter updates all metrics
- [ ] Infraction table shows data
- [ ] Can approve infractions
- [ ] Auto-refresh works (wait 30 seconds)
- [ ] Logout works correctly

---

## 🐛 Troubleshooting

### Server won't start
- Check if port 3001 is available
- Verify Node.js is installed (`node --version`)
- Ensure all dependencies installed (`npm install`)

### Can't login
- Verify user exists in `clients` table
- Check password field name (`password` or `password_`)
- Ensure database connection is working

### No data showing
- Check if database has records
- Verify time range has data
- Check browser console for errors
- Ensure API endpoints return data

### Charts not rendering
- Verify Chart.js CDN is accessible
- Check browser console for errors
- Ensure data format is correct

---

## 📚 Documentation

- **README.md** - Complete documentation
- **SETUP.md** - Detailed setup instructions
- **IMPROVEMENTS.md** - Feature comparison with template
- **GETTING_STARTED.md** - This quick start guide

---

## 🎉 You're Ready!

Your enhanced ERKOS Security Dashboard is ready to use!

**Next Steps:**
1. Configure your `.env` file
2. Run `npm install`
3. Start with `npm start` or `./start.sh`
4. Login and explore the enhanced features

**Need Help?**
- Check the README.md for detailed documentation
- Review SETUP.md for configuration options
- See IMPROVEMENTS.md for feature details

---

**Built with ❤️ for ERKOS Security**

*Enhanced Edition v2.0.0 - Functional Analytics & Modern UI*
