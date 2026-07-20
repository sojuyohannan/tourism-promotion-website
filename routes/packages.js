const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM packages ORDER BY created_at ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth(['admin']), async (req, res) => {
    const { title, destination_id, days, price, image, description } = req.body;
    if (!title || !price) return res.status(400).json({ error: 'title and price required.' });
    try {
        const id = `pkg-${Date.now()}`;
        await db.query(
            'INSERT INTO packages (id, title, destination_id, days, price, image, description) VALUES (?,?,?,?,?,?,?)',
            [id, title, destination_id || null, days || 3, price, image || '', description || '']
        );
        res.json({ id, title, message: 'Package created.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth(['admin']), async (req, res) => {
    try {
        await db.query('DELETE FROM packages WHERE id = ?', [req.params.id]);
        res.json({ message: 'Package deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
