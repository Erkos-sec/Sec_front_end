const express = require('express');
const db = require('../config/database');
const router = express.Router();

const requireAuth = (req, res, next) => {
    if (!req.session.clientEmail) {
        return res.redirect('/auth/login');
    }
    next();
};

router.get('/', requireAuth, async (req, res) => {
    try {
        const email = req.session.clientEmail;
        const pastHours = 100000;
        
        const stats = await getDashboardStats(email, pastHours);
        
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

async function getDashboardStats(email, pastHours) {
    const stats = {
        parkingUtilization: { used: 0, available: 0, percentage: 0 },
        averageStayTime: { cars: 0, people: 0 },
        footTraffic: 0,
        infringements: { count: 0, rate: 0 },
        totalSpots: 0
    };

    try {
        const [locationRows] = await db.execute(
            'SELECT location_id FROM locations WHERE client_email = ?',
            [email]
        );

        if (locationRows.length === 0) {
            return stats;
        }

        const locationIds = locationRows.map(row => row.location_id);
        const placeholders = locationIds.map(() => '?').join(',');

        const [cameraRows] = await db.execute(
            `SELECT camera_id, spots_tracked FROM camera WHERE location_id IN (${placeholders})`,
            locationIds
        );

        if (cameraRows.length === 0) {
            return stats;
        }

        const cameraIds = cameraRows.map(row => row.camera_id);
        const cameraPlaceholders = cameraIds.map(() => '?').join(',');
        const spotsTracked = cameraRows[0].spots_tracked;

        try {
            const [footTrafficRows] = await db.execute(`
                SELECT COUNT(DISTINCT person_id) AS foot_traffic_count
                FROM ppl_detections 
                WHERE camera_id IN (${cameraPlaceholders})
                AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
            `, [...cameraIds, pastHours]);

            if (footTrafficRows.length > 0) {
                stats.footTraffic = footTrafficRows[0].foot_traffic_count || 0;
            }
        } catch (error) {
            console.log('Foot traffic table might not exist:', error.message);
        }

        const [avgStayRows] = await db.execute(`
            SELECT AVG(duration) / 60 AS avg_stay_time_minutes 
            FROM car_detections 
            WHERE camera_id IN (${cameraPlaceholders})
            AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
        `, [...cameraIds, pastHours]);

        if (avgStayRows.length > 0 && avgStayRows[0].avg_stay_time_minutes) {
            stats.averageStayTime.cars = Math.round(avgStayRows[0].avg_stay_time_minutes * 100) / 100;
        }

        try {
            const [spotsUsedRows] = await db.execute(`
                SELECT COUNT(DISTINCT zone_) as spots_used 
                FROM car_detections 
                WHERE camera_id IN (${cameraPlaceholders})
                AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
            `, [...cameraIds, pastHours]);

            const spotsUsed = spotsUsedRows[0]?.spots_used || 0;

            let totalSpots = 0;
            for (const camera of cameraRows) {
                if (camera.spots_tracked) {
                    const matches = camera.spots_tracked.match(/name/g);
                    totalSpots += matches ? matches.length : 0;
                }
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

        const [infractionRows] = await db.execute(`
            SELECT COUNT(*) AS infraction_count
            FROM car_detections 
            WHERE camera_id IN (${cameraPlaceholders})
            AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
            AND infraction_occured = 1 
            AND approved = 0
        `, [...cameraIds, pastHours]);

        if (infractionRows.length > 0) {
            stats.infringements.count = infractionRows[0].infraction_count || 0;
            const totalDetections = stats.parkingUtilization.used + stats.infringements.count;
            stats.infringements.rate = totalDetections > 0 ? 
                Math.round((stats.infringements.count / totalDetections) * 100) : 0;
        }

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }

    return stats;
}

async function getInfractionData(email, pastHours) {
    try {
        const [locationRows] = await db.execute(
            'SELECT location_id FROM locations WHERE client_email = ?',
            [email]
        );

        if (locationRows.length === 0) {
            return [];
        }

        const locationIds = locationRows.map(row => row.location_id);
        const placeholders = locationIds.map(() => '?').join(',');

        const [cameraRows] = await db.execute(
            `SELECT camera_id FROM camera WHERE location_id IN (${placeholders})`,
            locationIds
        );

        if (cameraRows.length === 0) {
            return [];
        }

        const cameraIds = cameraRows.map(row => row.camera_id);
        const cameraPlaceholders = cameraIds.map(() => '?').join(',');

        const query = `
            SELECT cd.car_id, cd.license_plate, 
                   ROUND(cd.duration/60, 2) as dur_in_minutes, 
                   cd.zone_ as parking_spot, 
                   ROUND(cd.time_in_zone/60, 2) as minutes_parked, 
                   cd.infraction_type,
                   FROM_UNIXTIME(cd.timestamp_first_detected) as detection_time,
                   cd.approved,
                   cd.camera_id,
                   l.description as property_name
            FROM car_detections cd
            LEFT JOIN camera c ON cd.camera_id = c.camera_id
            LEFT JOIN locations l ON c.location_id = l.location_id
            WHERE cd.camera_id IN (${cameraPlaceholders})
              AND cd.timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
              AND cd.infraction_occured = 1
            ORDER BY cd.approved ASC, cd.timestamp_first_detected DESC
            LIMIT 100
        `;

        const [rows] = await db.execute(query, [...cameraIds, pastHours]);
        return rows;
    } catch (error) {
        console.error('Error fetching infraction data:', error);
        return [];
    }
}

module.exports = router;
