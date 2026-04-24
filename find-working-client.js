const db = require('./config/database');
require('dotenv').config();

async function findWorkingClient() {
    console.log('🔍 Finding clients with data...\n');
    
    try {
        // Get all locations with cameras
        const [locationsWithCameras] = await db.execute(`
            SELECT DISTINCT l.client_email, l.location_id, c.camera_id
            FROM locations l
            JOIN camera c ON l.location_id = c.location_id
            LIMIT 10
        `);
        
        console.log(`Found ${locationsWithCameras.length} location(s) with cameras:\n`);
        
        for (const loc of locationsWithCameras) {
            console.log(`📧 ${loc.client_email}`);
            console.log(`   Location: ${loc.location_id}`);
            console.log(`   Camera: ${loc.camera_id}`);
            
            // Check for car detections
            const [detections] = await db.execute(`
                SELECT COUNT(*) as total,
                       MAX(FROM_UNIXTIME(timestamp_first_detected)) as newest
                FROM car_detections
                WHERE camera_id = ?
            `, [loc.camera_id]);
            
            console.log(`   Detections: ${detections[0].total}`);
            console.log(`   Newest: ${detections[0].newest}`);
            
            // Check last year
            const [lastYear] = await db.execute(`
                SELECT COUNT(*) as count
                FROM car_detections
                WHERE camera_id = ?
                AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * 8760
            `, [loc.camera_id]);
            
            console.log(`   Last year: ${lastYear[0].count}\n`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

findWorkingClient();
