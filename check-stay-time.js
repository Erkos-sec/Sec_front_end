const db = require('./config/database');
require('dotenv').config();

async function checkStayTime() {
    const email = 'admin_client@admin.com';
    console.log('🔍 Checking Average Stay Time Data...\n');
    
    try {
        // Get all locations and cameras for this user
        const [locationRows] = await db.execute(
            'SELECT location_id FROM locations WHERE client_email = ?',
            [email]
        );

        if (locationRows.length === 0) {
            console.log('❌ No locations found');
            process.exit(0);
        }

        const locationIds = locationRows.map(row => row.location_id);
        const placeholders = locationIds.map(() => '?').join(',');

        const [cameraRows] = await db.execute(
            `SELECT camera_id FROM camera WHERE location_id IN (${placeholders})`,
            locationIds
        );

        if (cameraRows.length === 0) {
            console.log('❌ No cameras found');
            process.exit(0);
        }

        const cameraIds = cameraRows.map(row => row.camera_id);
        const cameraPlaceholders = cameraIds.map(() => '?').join(',');

        console.log(`Found ${cameraIds.length} cameras\n`);

        // Check duration field
        const [sampleData] = await db.execute(`
            SELECT duration, 
                   ROUND(duration/60, 2) as duration_minutes,
                   FROM_UNIXTIME(timestamp_first_detected) as detection_time
            FROM car_detections 
            WHERE camera_id IN (${cameraPlaceholders})
            ORDER BY timestamp_first_detected DESC
            LIMIT 5
        `, cameraIds);

        console.log('📊 Sample car detections:');
        sampleData.forEach(row => {
            console.log(`   Duration: ${row.duration} seconds (${row.duration_minutes} minutes)`);
            console.log(`   Time: ${row.detection_time}\n`);
        });

        // Check average for different time ranges
        const timeRanges = [
            { name: 'Last 24 Hours', hours: 24 },
            { name: 'Last 7 Days', hours: 168 },
            { name: 'Last 30 Days', hours: 720 },
            { name: 'Last Year', hours: 8760 },
            { name: 'All Time', hours: null }
        ];

        for (const range of timeRanges) {
            let query, params;
            
            if (range.hours) {
                query = `
                    SELECT 
                        COUNT(*) as count,
                        AVG(duration) as avg_duration_seconds,
                        AVG(duration) / 60 AS avg_stay_time_minutes
                    FROM car_detections 
                    WHERE camera_id IN (${cameraPlaceholders})
                    AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * ?
                `;
                params = [...cameraIds, range.hours];
            } else {
                query = `
                    SELECT 
                        COUNT(*) as count,
                        AVG(duration) as avg_duration_seconds,
                        AVG(duration) / 60 AS avg_stay_time_minutes
                    FROM car_detections 
                    WHERE camera_id IN (${cameraPlaceholders})
                `;
                params = cameraIds;
            }

            const [result] = await db.execute(query, params);
            
            console.log(`\n📅 ${range.name}:`);
            console.log(`   Records: ${result[0].count}`);
            console.log(`   Avg Duration: ${result[0].avg_duration_seconds} seconds`);
            console.log(`   Avg Stay Time: ${result[0].avg_stay_time_minutes} minutes`);
            console.log(`   In Hours: ${(result[0].avg_stay_time_minutes / 60).toFixed(2)} hours`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

checkStayTime();
