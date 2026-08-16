const db = require('./db/connection');
(async () => {
  try {
    await db.query("UPDATE services SET price_unit='per_km', price=18 WHERE type IN ('Taxi','Transportation','Transport') OR id='transport-1'");
    console.log('✅ Transport services updated to per_km!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
