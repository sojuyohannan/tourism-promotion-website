const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'tourism_db',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌  Database connection failed:', err.message);
        console.error('   Make sure MySQL is running and .env credentials are correct.');
        return;
    }
    console.log('✅  MySQL connected — tourism_db ready');
    connection.release();
});

module.exports = pool.promise();
