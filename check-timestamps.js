const db = require('./config/database');
require('dotenv').config();

async function checkTimestamps() {
    console.log('🔍 Checking Data Timestamps...\n');
    
    try {
        // Get the date range of car detections
        const [dateRange] = await db.execute(`
            SELECT 
                MIN(FROM_UNIXTIME(timestamp_first_detected)) as oldest,
                MAX(FROM_UNIXTIME(timestamp_first_detected)) as newest,
                COUNT(*) as total
            FROM car_detections
        `);
        
        console.log('📅 Car Detections Date Range:');
        console.log(`   Oldest: ${dateRange[0].oldest}`);
        console.log(`   Newest: ${dateRange[0].newest}`);
        console.log(`   Total: ${dateRange[0].total}`);
        
        // Check how old the newest data is
        const [daysAgo] = await db.execute(`
            SELECT 
                DATEDIFF(NOW(), FROM_UNIXTIME(MAX(timestamp_first_detected))) as days_ago
            FROM car_detections
        `);
        
        console.log(`\n⏰ Newest data is ${daysAgo[0].days_ago} days old`);
        
        if (daysAgo[0].days_ago > 365) {
            console.log('\n⚠️  WARNING: Data is over 1 year old!');
            console.log('💡 The dashboard time filters won\'t show this data.');
            console.log('💡 You need to either:');
            console.log('   1. Add recent data to the database, OR');
            console.log('   2. Modify the dashboard to show all data regardless of time');
        } else if (daysAgo[0].days_ago > 30) {
            console.log('\n💡 Select "This Year" in the time filter to see this data');
        } else if (daysAgo[0].days_ago > 7) {
            console.log('\n💡 Select "This Month" in the time filter to see this data');
        }
        
        // Check for infractions
        const [infractions] = await db.execute(`
            SELECT COUNT(*) as total
            FROM car_detections
            WHERE infraction_occurred = 1
        `);
        console.log(`\n🚨 Total infractions in database: ${infractions[0].total}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

checkTimestamps();
