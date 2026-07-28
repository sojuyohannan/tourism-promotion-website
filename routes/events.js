const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM events ORDER BY event_date ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth(['admin']), async (req, res) => {
    const { title, location, event_date, description } = req.body;
    if (!title || !location || !event_date)
        return res.status(400).json({ error: 'title, location, event_date required.' });
    try {
        const [result] = await db.query(
            'INSERT INTO events (title, location, event_date, description) VALUES (?,?,?,?)',
            [title, location, event_date, description || '']
        );
        res.json({ id: result.insertId, message: 'Event created.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth(['admin']), async (req, res) => {
    try {
        await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ message: 'Event deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
