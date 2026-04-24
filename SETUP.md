# Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Database
Copy `.env.example` to `.env` and update with your database credentials:
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=3001
SESSION_SECRET=your-random-secret-key-here
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
```

### Step 3: Start the Server
```bash
npm start
```

Or use the startup script:
```bash
./start.sh
```

## 🌐 Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3001
```

Login with credentials from your database `clients` table.

## 📊 Key Differences from Template

### Enhanced Features
1. **Functional Charts** - All graphs display real data, not static values
2. **Modern UI** - Gradient backgrounds, smooth animations, better spacing
3. **Better Data Visualization** - Charts update based on actual database values
4. **Improved Styling** - Modern color scheme with purple/indigo accents
5. **Enhanced UX** - Better hover effects, loading states, and transitions

### Visual Improvements
- **Login Page**: Animated background, modern input fields with icons
- **Dashboard Cards**: Gradient badges, improved chart layouts, better metrics display
- **Charts**: Properly scaled to show actual data percentages and values
- **Table**: Modern styling with badges and improved approve buttons
- **Responsive**: Better mobile experience with optimized layouts

### Functional Improvements
- **Data Accuracy**: Charts show actual percentages from database
- **Time Filters**: All metrics update when changing time ranges
- **Auto-refresh**: Dashboard updates every 30 seconds
- **Better Calculations**: Parking utilization and infringement rates are accurate
- **Progress Bars**: Visual indicators for stay time metrics

## 🎨 Customization

### Change Primary Color
Edit `/public/css/dashboard.css` and `/public/css/login.css`:
- Replace `#4F46E5` (indigo) with your brand color
- Update gradient combinations for consistency

### Modify Auto-refresh Interval
Edit `/views/dashboard.ejs`, line ~502:
```javascript
setInterval(() => {
    // Change 30000 (30 seconds) to your preferred interval
}, 30000);
```

### Add Custom Metrics
1. Add new card in `/views/dashboard.ejs`
2. Create API endpoint in `/routes/dashboard.js`
3. Add styling in `/public/css/dashboard.css`

## 🔧 Troubleshooting

### Port Already in Use
Change `PORT` in `.env` to a different port (e.g., 3002, 3003)

### Database Connection Failed
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists
- Test connection with MySQL client

### Charts Not Showing Data
- Check browser console for errors
- Verify API endpoints return data
- Ensure database has records in the selected time range

### Logo Not Displaying
- Ensure `erkos.png` exists in `/public/images/`
- Check file permissions
- Try clearing browser cache

## 📝 Database Requirements

Ensure these tables exist:
- `clients` (with `client_email`, `password`/`password_`, `client_name`)
- `locations` (with `location_id`, `client_email`)
- `camera` (with `camera_id`, `location_id`, `spots_tracked`)
- `car_detections` (with vehicle and infraction data)
- `ppl_detections` (with foot traffic data)

## 🎯 Next Steps

1. **Test Login** - Use existing client credentials
2. **Verify Data** - Check if metrics display correctly
3. **Test Time Filters** - Switch between different time ranges
4. **Approve Infractions** - Test the approval workflow
5. **Customize Branding** - Update colors and logo as needed

## 📞 Support

If you encounter issues:
1. Check the main `README.md` for detailed documentation
2. Verify all environment variables are set correctly
3. Ensure database schema matches requirements
4. Check Node.js version (v14+ required)

---

**Ready to go! 🎉**

Run `npm start` or `./start.sh` to begin.
