const db = require('./db/connection');

async function fixDb() {
    try {
        await db.query("ALTER TABLE bookings ADD COLUMN user_id INT DEFAULT NULL");
        console.log("Added user_id column.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
            process.exit(0);
        } else {
            console.error(err);
            process.exit(1);
        }
    }
}
fixDb();
