const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── GET /api/reviews/:destination_id ─────────────────────────────
router.get('/:destination_id', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.name AS reviewer_name
             FROM reviews r
             LEFT JOIN users u ON u.id = r.user_id
             WHERE r.destination_id = ? ORDER BY r.created_at DESC`,
            [req.params.destination_id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/reviews — only tourists who completed a booking ─────
router.post('/', auth(['user', 'admin']), async (req, res) => {
    const { destination_id, booking_id, service_id, rating, comment, reviewer_name } = req.body;
    if (!destination_id || !rating) return res.status(400).json({ error: 'destination_id and rating required.' });

    // Verify booking belongs to user and is Completed (skip for admin)
    if (req.user.role === 'user' && booking_id) {
        const [[b]] = await db.query(
            'SELECT id FROM bookings WHERE id=? AND user_id=? AND status=?',
            [booking_id, req.user.id, 'Completed']
        );
        if (!b) return res.status(403).json({ error: 'You can only review destinations where your booking is Completed.' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO reviews (destination_id, user_id, reviewer_name, rating, comment, booking_id, service_id)
             VALUES (?,?,?,?,?,?,?)`,
            [destination_id, req.user.id, reviewer_name || req.user.name, rating, comment||'', booking_id||null, service_id||null]
        );
        // Update destination avg rating
        const [[avg]] = await db.query('SELECT AVG(rating) as avg FROM reviews WHERE destination_id=?', [destination_id]);
        await db.query('UPDATE destinations SET rating=? WHERE id=?', [parseFloat(avg.avg).toFixed(1), destination_id]);
        res.json({ id: result.insertId, message: 'Review submitted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/reviews/:id — admin moderation ───────────────────
router.delete('/:id', auth(['admin']), async (req, res) => {
    try {
        await db.query('DELETE FROM reviews WHERE id=?', [req.params.id]);
        res.json({ message: 'Review removed.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
