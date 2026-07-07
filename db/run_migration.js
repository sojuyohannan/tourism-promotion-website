// Safe migration runner — checks columns before adding
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST     || 'localhost',
        port:     process.env.DB_PORT     || 3306,
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'tourism_db',
    });

    async function hasColumn(table, col) {
        const [r] = await conn.query(
            `SELECT COUNT(*) as n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`,
            [table, col]
        );
        return r[0].n > 0;
    }
    async function addCol(table, col, def) {
        if (!(await hasColumn(table, col))) {
            await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${col} ${def}`);
            console.log(`  + ${table}.${col}`);
        }
    }
    async function tableExists(name) {
        const [r] = await conn.query(
            `SELECT COUNT(*) as n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?`, [name]
        );
        return r[0].n > 0;
    }
    async function indexExists(table, idxName) {
        const [r] = await conn.query(
            `SELECT COUNT(*) as n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?`,
            [table, idxName]
        );
        return r[0].n > 0;
    }

    console.log('\n🔧  Running Migration v2...\n');

    // ── USERS ────────────────────────────────────────────
    await addCol('users', 'phone',  "VARCHAR(20) DEFAULT NULL");
    await addCol('users', 'status', "ENUM('active','pending','suspended') DEFAULT 'active'");

    // ── DESTINATIONS ─────────────────────────────────────
    await addCol('destinations', 'district',            "VARCHAR(120) DEFAULT NULL");
    await addCol('destinations', 'state',               "VARCHAR(120) DEFAULT NULL");
    await addCol('destinations', 'season',              "VARCHAR(80) DEFAULT NULL");
    await addCol('destinations', 'budget_min',          "INT DEFAULT 0");
    await addCol('destinations', 'budget_max',          "INT DEFAULT 0");
    await addCol('destinations', 'featured',            "TINYINT(1) DEFAULT 0");
    await addCol('destinations', 'nearby_attractions',  "TEXT DEFAULT NULL");
    await addCol('destinations', 'gallery',             "TEXT DEFAULT NULL");

    // ── SERVICES ─────────────────────────────────────────
    await addCol('services', 'destination_id',      "VARCHAR(60) DEFAULT NULL");
    await addCol('services', 'provider_id',         "INT DEFAULT NULL");
    await addCol('services', 'status',              "ENUM('pending','approved','rejected') DEFAULT 'approved'");
    await addCol('services', 'capacity',            "INT DEFAULT NULL");
    await addCol('services', 'images',              "TEXT DEFAULT NULL");
    await addCol('services', 'operating_hours',     "VARCHAR(200) DEFAULT NULL");
    await addCol('services', 'cancellation_policy', "TEXT DEFAULT NULL");
    await addCol('services', 'rejection_reason',    "TEXT DEFAULT NULL");
    await addCol('services', 'price_unit',          "ENUM('fixed','per_km') DEFAULT 'fixed'");

    // ── BOOKINGS ─────────────────────────────────────────
    await addCol('bookings', 'destination_id',   "VARCHAR(60) DEFAULT NULL");
    await addCol('bookings', 'package_id',       "VARCHAR(60) DEFAULT NULL");
    await addCol('bookings', 'special_requests', "TEXT DEFAULT NULL");
    await addCol('bookings', 'phone',            "VARCHAR(20) DEFAULT NULL");
    await addCol('bookings', 'payment_status',   "ENUM('unpaid','paid','refunded') DEFAULT 'unpaid'");
    await addCol('bookings', 'payment_amount',   "DECIMAL(10,2) DEFAULT 0");
    await addCol('bookings', 'payment_ref',      "VARCHAR(80) DEFAULT NULL");
    await addCol('bookings', 'distance_km',      "DECIMAL(10,2) DEFAULT 0");

    // Extend status enum safely
    try {
        await conn.query(`ALTER TABLE bookings MODIFY COLUMN status ENUM('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending'`);
        console.log('  ~ bookings.status enum extended');
    } catch(e) { console.log('  ~ bookings.status already extended'); }

    // ── REVIEWS ──────────────────────────────────────────
    await addCol('reviews', 'booking_id', "INT DEFAULT NULL");
    await addCol('reviews', 'service_id', "VARCHAR(60) DEFAULT NULL");
    await addCol('reviews', 'package_id', "VARCHAR(60) DEFAULT NULL");
    await addCol('reviews', 'user_id',    "INT DEFAULT NULL");

    try {
        await conn.query(`ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`);
        console.log('  + CONSTRAINT fk_reviews_user');
    } catch(e) { /* ignore if already exists */ }

    // ── NEW: provider_profiles ────────────────────────────
    if (!(await tableExists('provider_profiles'))) {
        await conn.query(`
            CREATE TABLE provider_profiles (
                id              INT           AUTO_INCREMENT PRIMARY KEY,
                user_id         INT           NOT NULL UNIQUE,
                business_name   VARCHAR(200)  NOT NULL,
                owner_name      VARCHAR(120)  NOT NULL,
                phone           VARCHAR(20)   NOT NULL,
                address         TEXT          DEFAULT NULL,
                license_no      VARCHAR(100)  DEFAULT NULL,
                description     TEXT          DEFAULT NULL,
                profile_image   TEXT          DEFAULT NULL,
                status          ENUM('pending','approved','rejected') DEFAULT 'pending',
                created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  + TABLE provider_profiles');
    }

    await addCol('services', 'commission_percentage', "DECIMAL(5,2) DEFAULT 10.00");

    // ── NEW: booking_services ─────────────────────────────
    if (!(await tableExists('booking_services'))) {
        await conn.query(`
            CREATE TABLE booking_services (
                id                    INT           AUTO_INCREMENT PRIMARY KEY,
                booking_id            INT           NOT NULL,
                service_id            VARCHAR(60)   NOT NULL,
                provider_id           INT           DEFAULT NULL,
                service_name          VARCHAR(120)  DEFAULT NULL,
                service_type          VARCHAR(60)   DEFAULT NULL,
                price                 DECIMAL(10,2) DEFAULT 0,
                service_amount        DECIMAL(10,2) DEFAULT 0,
                commission_percentage DECIMAL(5,2)  DEFAULT 10.00,
                commission_amount     DECIMAL(10,2) DEFAULT 0,
                provider_amount       DECIMAL(10,2) DEFAULT 0,
                status                ENUM('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending',
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        `);
        console.log('  + TABLE booking_services');
    }
    await addCol('booking_services', 'service_name',          "VARCHAR(120) DEFAULT NULL");
    await addCol('booking_services', 'service_type',          "VARCHAR(60) DEFAULT NULL");
    await addCol('booking_services', 'service_amount',        "DECIMAL(10,2) DEFAULT 0");
    await addCol('booking_services', 'commission_percentage', "DECIMAL(5,2) DEFAULT 10.00");
    await addCol('booking_services', 'commission_amount',     "DECIMAL(10,2) DEFAULT 0");
    await addCol('booking_services', 'provider_amount',       "DECIMAL(10,2) DEFAULT 0");

    // ── NEW: notifications ────────────────────────────────
    if (!(await tableExists('notifications'))) {
        await conn.query(`
            CREATE TABLE notifications (
                id          INT           AUTO_INCREMENT PRIMARY KEY,
                user_id     INT           NOT NULL,
                type        VARCHAR(60)   NOT NULL,
                title       VARCHAR(200)  NOT NULL,
                message     TEXT          DEFAULT NULL,
                is_read     TINYINT(1)    DEFAULT 0,
                created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  + TABLE notifications');
    }

    // ── NEW: wishlists ────────────────────────────────────
    if (!(await tableExists('wishlists'))) {
        await conn.query(`
            CREATE TABLE wishlists (
                id              INT         AUTO_INCREMENT PRIMARY KEY,
                user_id         INT         NOT NULL,
                destination_id  VARCHAR(60) NOT NULL,
                created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_wishlist (user_id, destination_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  + TABLE wishlists');
    }

    // ── NEW: payments ─────────────────────────────────────
    if (!(await tableExists('payments'))) {
        await conn.query(`
            CREATE TABLE payments (
                id           INT           AUTO_INCREMENT PRIMARY KEY,
                booking_id   INT           NOT NULL,
                amount       DECIMAL(10,2) NOT NULL,
                card_holder  VARCHAR(120)  NOT NULL,
                payment_ref  VARCHAR(80)   NOT NULL UNIQUE,
                status       VARCHAR(40)   DEFAULT 'success',
                created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        `);
        console.log('  + TABLE payments');
    }

    // ── INDEXES ───────────────────────────────────────────
    const indexes = [
        ['services',      'idx_services_destination', 'destination_id'],
        ['services',      'idx_services_provider',    'provider_id'],
        ['services',      'idx_services_status',      'status'],
        ['bookings',      'idx_bookings_user',         'user_id'],
        ['bookings',      'idx_bookings_status',       'status'],
        ['notifications', 'idx_notifications_user',   'user_id'],
    ];
    for (const [table, name, col] of indexes) {
        if (!(await indexExists(table, name))) {
            try {
                await conn.query(`CREATE INDEX ${name} ON ${table}(${col})`);
                console.log(`  + INDEX ${name}`);
            } catch(e) { /* ignore */ }
        }
    }

    // Mark existing services as approved
    await conn.query(`UPDATE services SET status='approved' WHERE status IS NULL`);

    // Update seeded services to correct destinations
    await conn.query(`UPDATE services SET destination_id='munnar' WHERE id IN ('hotel-1', 'food-1')`);
    await conn.query(`UPDATE services SET destination_id='mysore' WHERE id='guide-1'`);
    await conn.query(`UPDATE services SET destination_id='goa' WHERE id='transport-1'`);
    await conn.query(`UPDATE services SET destination_id='varanasi' WHERE id='craft-1'`);
    await conn.query(`UPDATE services SET destination_id='jaipur' WHERE id='guide-2'`);
    console.log('  ~ Seeded services updated with correct destination IDs');

    await conn.end();
    console.log('\n✅  Migration v2 complete!\n');
}

migrate().catch(e => { console.error('❌ Migration error:', e.message); process.exit(1); });
