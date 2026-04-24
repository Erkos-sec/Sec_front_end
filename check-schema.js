const db = require('./config/database');
require('dotenv').config();

async function checkSchema() {
    try {
        const [columns] = await db.execute('DESCRIBE car_detections');
        console.log('\n📋 car_detections table columns:\n');
        columns.forEach(col => {
            console.log(`   ${col.Field} (${col.Type})`);
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

checkSchema();
