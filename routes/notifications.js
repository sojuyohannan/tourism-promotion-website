const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── GET /api/notifications — my notifications ─────────────────────
router.get('/', auth(['admin', 'user', 'provider']), async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/notifications/unread-count ──────────────────────────
router.get('/unread-count', auth(['admin', 'user', 'provider']), async (req, res) => {
    try {
        const [[r]] = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND is_read=0',
            [req.user.id]
        );
        res.json({ count: r.count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/notifications/:id/read ────────────────────────────
router.patch('/:id/read', auth(['admin', 'user', 'provider']), async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
        res.json({ message: 'Marked as read.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/notifications/read-all ────────────────────────────
router.patch('/read-all', auth(['admin', 'user', 'provider']), async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
        res.json({ message: 'All marked as read.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
