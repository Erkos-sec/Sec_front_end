const db = require('./config/database');
require('dotenv').config();

async function checkDatabase() {
    console.log('🔍 Checking Database Structure...\n');
    
    try {
        // Check locations table structure
        console.log('1️⃣ Checking locations table...');
        const [allLocations] = await db.execute('SELECT * FROM locations LIMIT 5');
        console.log(`   Found ${allLocations.length} total locations`);
        if (allLocations.length > 0) {
            console.log('   Sample location columns:', Object.keys(allLocations[0]));
            console.log('   Sample data:', allLocations[0]);
        }
        
        // Check camera table
        console.log('\n2️⃣ Checking camera table...');
        const [cameras] = await db.execute('SELECT * FROM camera LIMIT 5');
        console.log(`   Found ${cameras.length} total cameras`);
        if (cameras.length > 0) {
            console.log('   Sample camera columns:', Object.keys(cameras[0]));
            console.log('   Camera IDs:', cameras.map(c => c.camera_id));
        }
        
        // Check car_detections
        console.log('\n3️⃣ Checking car_detections...');
        const [carCount] = await db.execute('SELECT COUNT(*) as total FROM car_detections');
        console.log(`   Total car detections: ${carCount[0].total}`);
        
        if (cameras.length > 0) {
            const testCameraId = cameras[0].camera_id;
            const [recentCars] = await db.execute(
                'SELECT COUNT(*) as recent FROM car_detections WHERE camera_id = ? AND timestamp_first_detected > UNIX_TIMESTAMP() - 86400',
                [testCameraId]
            );
            console.log(`   Last 24h for camera ${testCameraId}: ${recentCars[0].recent}`);
            
            const [weekCars] = await db.execute(
                'SELECT COUNT(*) as recent FROM car_detections WHERE camera_id = ? AND timestamp_first_detected > UNIX_TIMESTAMP() - 604800',
                [testCameraId]
            );
            console.log(`   Last 7 days for camera ${testCameraId}: ${weekCars[0].recent}`);
        }
        
        // Check clients
        console.log('\n4️⃣ Checking clients...');
        const [clients] = await db.execute('SELECT * FROM clients LIMIT 1');
        if (clients.length > 0) {
            console.log('   Client columns:', Object.keys(clients[0]));
        }
        
        console.log('\n✅ Database check complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

checkDatabase();
