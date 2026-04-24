const db = require('./config/database');
require('dotenv').config();

async function testDatabase() {
    console.log('🔍 Testing Database Connection and Data...\n');
    
    try {
        // Test 1: Check clients table
        console.log('1️⃣ Checking clients table...');
        const [clients] = await db.execute('SELECT client_email FROM clients LIMIT 5');
        console.log(`   Found ${clients.length} clients:`);
        clients.forEach(c => console.log(`   - ${c.client_email}`));
        
        if (clients.length === 0) {
            console.log('   ⚠️  No clients found in database!');
            process.exit(0);
        }
        
        const testEmail = clients[0].client_email;
        console.log(`\n   Using test email: ${testEmail}\n`);
        
        // Test 2: Check locations
        console.log('2️⃣ Checking locations table...');
        const [locations] = await db.execute(
            'SELECT location_id FROM locations WHERE client_email = ?',
            [testEmail]
        );
        console.log(`   Found ${locations.length} locations for this client`);
        
        if (locations.length === 0) {
            console.log('   ⚠️  No locations found for this client!');
            console.log('   💡 Dashboard needs locations linked to client_email');
            process.exit(0);
        }
        
        const locationId = locations[0].location_id;
        console.log(`   Location ID: ${locationId}\n`);
        
        // Test 3: Check camera
        console.log('3️⃣ Checking camera table...');
        const [cameras] = await db.execute(
            'SELECT camera_id, spots_tracked FROM camera WHERE location_id = ?',
            [locationId]
        );
        console.log(`   Found ${cameras.length} cameras for this location`);
        
        if (cameras.length === 0) {
            console.log('   ⚠️  No cameras found for this location!');
            console.log('   💡 Dashboard needs camera linked to location_id');
            process.exit(0);
        }
        
        const cameraId = cameras[0].camera_id;
        console.log(`   Camera ID: ${cameraId}\n`);
        
        // Test 4: Check car_detections
        console.log('4️⃣ Checking car_detections table...');
        const [carDetections] = await db.execute(
            'SELECT COUNT(*) as total FROM car_detections WHERE camera_id = ?',
            [cameraId]
        );
        console.log(`   Total car detections: ${carDetections[0].total}`);
        
        const [recentCars] = await db.execute(
            'SELECT COUNT(*) as recent FROM car_detections WHERE camera_id = ? AND timestamp_first_detected > UNIX_TIMESTAMP() - 86400',
            [cameraId]
        );
        console.log(`   Last 24 hours: ${recentCars[0].recent}`);
        
        // Test 5: Check infractions
        console.log('\n5️⃣ Checking infractions...');
        const [infractions] = await db.execute(
            'SELECT COUNT(*) as total FROM car_detections WHERE camera_id = ? AND infraction_occurred = 1',
            [cameraId]
        );
        console.log(`   Total infractions: ${infractions[0].total}`);
        
        const [recentInfractions] = await db.execute(
            'SELECT COUNT(*) as recent FROM car_detections WHERE camera_id = ? AND infraction_occurred = 1 AND timestamp_first_detected > UNIX_TIMESTAMP() - 86400',
            [cameraId]
        );
        console.log(`   Last 24 hours: ${recentInfractions[0].recent}`);
        
        // Test 6: Check ppl_detections
        console.log('\n6️⃣ Checking ppl_detections table...');
        try {
            const [pplDetections] = await db.execute(
                'SELECT COUNT(*) as total FROM ppl_detections WHERE camera_id = ?',
                [cameraId]
            );
            console.log(`   Total people detections: ${pplDetections[0].total}`);
        } catch (error) {
            console.log('   ⚠️  ppl_detections table not found or error:', error.message);
        }
        
        console.log('\n✅ Database test complete!');
        
        if (recentCars[0].recent === 0) {
            console.log('\n⚠️  WARNING: No car detections in last 24 hours!');
            console.log('💡 Try selecting a longer time range (7 days, 30 days, or 1 year)');
        }
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
    
    process.exit(0);
}

testDatabase();
