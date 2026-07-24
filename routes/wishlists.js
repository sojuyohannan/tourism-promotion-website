const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── GET /api/wishlists — user's wishlist ──────────────────────────
router.get('/', auth(['user']), async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT w.*, d.name, d.image, d.category, d.location, d.price, d.rating
             FROM wishlists w
             JOIN destinations d ON d.id = w.destination_id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/wishlists — add to wishlist ─────────────────────────
router.post('/', auth(['user']), async (req, res) => {
    const { destination_id } = req.body;
    if (!destination_id) return res.status(400).json({ error: 'destination_id required.' });
    try {
        await db.query(
            'INSERT IGNORE INTO wishlists (user_id, destination_id) VALUES (?, ?)',
            [req.user.id, destination_id]
        );
        res.json({ message: 'Added to wishlist.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/wishlists/:destination_id — remove from wishlist ──
router.delete('/:destination_id', auth(['user']), async (req, res) => {
    try {
        await db.query(
            'DELETE FROM wishlists WHERE user_id=? AND destination_id=?',
            [req.user.id, req.params.destination_id]
        );
        res.json({ message: 'Removed from wishlist.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
