const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.clientEmail) {
        return res.redirect('/auth/login');
    }
    next();
};

// Dashboard main page
router.get('/', requireAuth, async (req, res) => {
    try {
        const email = req.session.clientEmail;
        const pastHours = 100000; // Large number to get historical data
        
        // Get dashboard statistics with fallback defaults
        const stats = await getDashboardStats(email, pastHours);
        
        // Ensure all required properties exist with defaults
        const safeStats = {
            parkingUtilization: stats.parkingUtilization || { used: 0, available: 0, percentage: 0 },
            averageStayTime: stats.averageStayTime || { cars: 0, people: 0 },
            footTraffic: stats.footTraffic || 0,
            infringements: stats.infringements || { count: 0, rate: 0 },
            totalSpots: stats.totalSpots || 0
        };
        
        res.render('dashboard', {
            clientName: req.session.clientName || 'User',
            clientEmail: email,
            stats: safeStats
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        
        // Render with default stats if there's an error
        const defaultStats = {
            parkingUtilization: { used: 0, available: 0, percentage: 0 },
            averageStayTime: { cars: 0, people: 0 },
            footTraffic: 0,
            infringements: { count: 0, rate: 0 },
            totalSpots: 0
        };
        
        res.render('dashboard', {
            clientName: req.session.clientName || 'User',
            clientEmail: req.session.clientEmail,
            stats: defaultStats
        });
    }
});

// API endpoint for real-time data updates
router.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const email = req.session.clientEmail;
        const pastHours = parseInt(req.query.hours) || 24;
        
        const stats = await getDashboardStats(email, pastHours);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// API endpoint for infringement table data
router.get('/api/infractions', requireAuth, async (req, res) => {
    try {
        const email = req.session.clientEmail;
        const pastHours = parseInt(req.query.hours) || 24;
        
        const infractions = await getInfractionData(email, pastHours);
        res.json(infractions);
    } catch (error) {
        console.error('Error fetching infraction data:', error);
        res.status(500).json({ error: 'Failed to fetch infraction data' });
    }
});

// API endpoint to approve an infraction
router.post('/api/approve', requireAuth, async (req, res) => {
    try {
        const { car_id } = req.body;
        
        if (!car_id) {
            return res.status(400).json({ success: false, message: 'Car ID is required' });
        }

        const query = 'UPDATE car_detections SET approved = 1 WHERE car_id = ?';
        await db.execute(query, [car_id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error approving infraction:', error);
        res.status(500).json({ success: false, message: 'Failed to approve infraction' });
    }
});

// Helper function to get dashboard statistics
async function getDashboardStats(email, pastHours) {
    const stats = {
        parkingUtilization: { used: 0, available: 0, percentage: 0 },
        averageStayTime: { cars: 0, people: 0 },
        footTraffic: 0,
        infringements: { count: 0, rate: 0 },
        totalSpots: 0
    };

    try {
        // Get location_id for the client through locations table
        const [locationRows] = await db.execute(
            'SELECT location_id FROM locations WHERE client_email = ? LIMIT 1',
            [email]
        );

        if (locationRows.length === 0) {
            return stats;
        }

        const locationId = locationRows[0].location_id;

        // Get camera_id and spots_tracked from camera table using location_id
        const [cameraRows] = await db.execute(
            'SELECT camera_id, spots_tracked FROM camera WHERE location_id = ? LIMIT 1',
            [locationId]
        );

        if (cameraRows.length === 0) {
            return stats;
        }

        const cameraId = cameraRows[0].camera_id;
        const spotsTracked = cameraRows[0].spots_tracked;

        // Get foot traffic count from ppl_detections table
        try {
            const [footTrafficRows] = await db.execute(`
                SELECT COUNT(DISTINCT person_id) AS foot_traffic_count
                FROM ppl_detections 
                WHERE camera_id = ? 
                AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
            `, [cameraId, pastHours]);

            if (footTrafficRows.length > 0) {
                stats.footTraffic = footTrafficRows[0].foot_traffic_count || 0;
            }
        } catch (error) {
            console.log('Foot traffic table might not exist:', error.message);
        }

        // Get average stay time for cars
        const [avgStayRows] = await db.execute(`
            SELECT AVG(duration) / 60 AS avg_stay_time_minutes 
            FROM car_detections 
            WHERE camera_id = ? 
            AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
        `, [cameraId, pastHours]);

        if (avgStayRows.length > 0 && avgStayRows[0].avg_stay_time_minutes) {
            stats.averageStayTime.cars = Math.round(avgStayRows[0].avg_stay_time_minutes * 100) / 100;
        }

        // Calculate parking utilization using the spots_tracked field
        try {
            // Get spots currently occupied (cars detected in the time period)
            const [spotsUsedRows] = await db.execute(`
                SELECT COUNT(DISTINCT zone_) as spots_used 
                FROM car_detections 
                WHERE camera_id = ? 
                AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
            `, [cameraId, pastHours]);

            const spotsUsed = spotsUsedRows[0]?.spots_used || 0;

            // Calculate total spots from spots_tracked field
            let totalSpots = 0;
            if (spotsTracked) {
                // Count occurrences of "name" in spots_tracked to get total spots
                const matches = spotsTracked.match(/name/g);
                totalSpots = matches ? matches.length : 0;
            }

            stats.totalSpots = totalSpots;

            if (totalSpots > 0) {
                stats.parkingUtilization.used = spotsUsed;
                stats.parkingUtilization.available = totalSpots - spotsUsed;
                stats.parkingUtilization.percentage = Math.round((spotsUsed / totalSpots) * 100);
            }
        } catch (error) {
            console.error('Error calculating parking utilization:', error);
        }

        // Get infringement data using correct column name
        const [infractionRows] = await db.execute(`
            SELECT COUNT(*) AS infraction_count
            FROM car_detections 
            WHERE camera_id = ? 
            AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
            AND infraction_occurred = 1 
            AND approved = 0
        `, [cameraId, pastHours]);

        if (infractionRows.length > 0) {
            stats.infringements.count = infractionRows[0].infraction_count || 0;
            // Calculate infringement rate as percentage of total detections
            const totalDetections = stats.parkingUtilization.used + stats.infringements.count;
            stats.infringements.rate = totalDetections > 0 ? 
                Math.round((stats.infringements.count / totalDetections) * 100) : 0;
        }

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }

    return stats;
}

// Helper function to get infraction table data
async function getInfractionData(email, pastHours) {
    try {
        // Get location_id for the client
        const [locationRows] = await db.execute(
            'SELECT location_id FROM locations WHERE client_email = ? LIMIT 1',
            [email]
        );

        if (locationRows.length === 0) {
            return [];
        }

        const locationId = locationRows[0].location_id;

        // Get camera_id from camera table
        const [cameraRows] = await db.execute(
            'SELECT camera_id FROM camera WHERE location_id = ? LIMIT 1',
            [locationId]
        );

        if (cameraRows.length === 0) {
            return [];
        }

        const cameraId = cameraRows[0].camera_id;
        console.log('Camera ID found:', cameraId);

        // Get infraction data using correct column names
        const query = `
            SELECT car_id, license_plate, 
                   ROUND(duration/60, 2) as dur_in_minutes, 
                   zone_ as parking_spot, 
                   ROUND(time_in_zone/60, 2) as minutes_parked, 
                   infraction_type,
                   FROM_UNIXTIME(timestamp_first_detected) as detection_time
            FROM car_detections 
            WHERE camera_id = ? 
              AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
              AND infraction_occurred = 1 
              AND approved = 0
            ORDER BY timestamp_first_detected DESC
            LIMIT 50
        `;

        const [rows] = await db.execute(query, [cameraId, pastHours]);
        return rows;
    } catch (error) {
        console.error('Error fetching infraction data:', error);
        return [];
    }
}

module.exports = router;
