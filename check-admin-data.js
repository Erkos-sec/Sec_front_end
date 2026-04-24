const db = require('./config/database');
require('dotenv').config();

async function checkAdminData() {
    const email = 'admin_client@admin.com';
    console.log(`🔍 Checking data for: ${email}\n`);
    
    try {
        // Get location for admin
        const [locations] = await db.execute(
            'SELECT location_id FROM locations WHERE client_email = ?',
            [email]
        );
        
        if (locations.length === 0) {
            console.log('❌ No locations found for admin_client@admin.com');
            process.exit(0);
        }
        
        console.log(`✅ Found location: ${locations[0].location_id}\n`);
        const locationId = locations[0].location_id;
        
        // Get cameras for this location
        const [cameras] = await db.execute(
            'SELECT camera_id FROM camera WHERE location_id = ?',
            [locationId]
        );
        
        console.log(`✅ Found ${cameras.length} camera(s) for this location\n`);
        
        if (cameras.length === 0) {
            console.log('❌ No cameras found for this location');
            process.exit(0);
        }
        
        const cameraId = cameras[0].camera_id;
        console.log(`   Using camera: ${cameraId}\n`);
        
        // Check car detections in last year (8760 hours)
        const [lastYear] = await db.execute(`
            SELECT COUNT(*) as count,
                   MIN(FROM_UNIXTIME(timestamp_first_detected)) as oldest,
                   MAX(FROM_UNIXTIME(timestamp_first_detected)) as newest
            FROM car_detections 
            WHERE camera_id = ? 
            AND timestamp_first_detected > UNIX_TIMESTAMP() - 3600 * 8760
        `, [cameraId]);
        
        console.log('📊 Last Year (8760 hours):');
        console.log(`   Total detections: ${lastYear[0].count}`);
        console.log(`   Date range: ${lastYear[0].oldest} to ${lastYear[0].newest}`);
        
        // Check all time
        const [allTime] = await db.execute(`
            SELECT COUNT(*) as count,
                   MIN(FROM_UNIXTIME(timestamp_first_detected)) as oldest,
                   MAX(FROM_UNIXTIME(timestamp_first_detected)) as newest
            FROM car_detections 
            WHERE camera_id = ?
        `, [cameraId]);
        
        console.log('\n📊 All Time:');
        console.log(`   Total detections: ${allTime[0].count}`);
        console.log(`   Date range: ${allTime[0].oldest} to ${allTime[0].newest}`);
        
        // Check infractions
        const [infractions] = await db.execute(`
            SELECT COUNT(*) as count
            FROM car_detections 
            WHERE camera_id = ? 
            AND infraction_occured = 1
        `, [cameraId]);
        
        console.log(`\n🚨 Total infractions: ${infractions[0].count}`);
        
        // Check how many days ago the newest data is
        const [daysAgo] = await db.execute(`
            SELECT DATEDIFF(NOW(), FROM_UNIXTIME(MAX(timestamp_first_detected))) as days_ago
            FROM car_detections
            WHERE camera_id = ?
        `, [cameraId]);
        
        console.log(`\n⏰ Newest data is ${daysAgo[0].days_ago} days old`);
        
        if (lastYear[0].count === 0) {
            console.log('\n⚠️  No data in last year (365 days)');
            console.log('💡 The dashboard will show empty charts with current time filters');
        } else {
            console.log('\n✅ Data exists in last year - dashboard should display it!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

checkAdminData();
