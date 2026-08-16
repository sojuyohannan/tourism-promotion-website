const db = require('./db/connection');
(async () => {
  try {
    await db.query("UPDATE users SET status='active' WHERE role='provider'");
    await db.query("UPDATE provider_profiles SET status='approved'");
    console.log('✅ All existing providers & profiles updated to active/approved!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
