const db = require('./db/connection');
const bcrypt = require('bcryptjs');

async function seedProvider() {
    try {
        const hash = await bcrypt.hash('provider123', 10);
        await db.query("INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ['Demo Provider', 'provider@tourism.com', hash, 'provider']
        );
        console.log("Provider account seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seedProvider();
