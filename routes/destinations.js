const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── GET /api/destinations — public list ──────────────────────────
router.get('/', async (req, res) => {
    try {
        let query = 'SELECT * FROM destinations WHERE 1=1';
        const params = [];
        if (req.query.featured === '1') { query += ' AND featured = 1'; }
        if (req.query.category) { query += ' AND category = ?'; params.push(req.query.category); }
        if (req.query.state)    { query += ' AND state = ?'; params.push(req.query.state); }
        query += ' ORDER BY featured DESC, created_at DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/destinations/:id — full detail with services & reviews
router.get('/:id', async (req, res) => {
    try {
        const [[dest]] = await db.query('SELECT * FROM destinations WHERE id = ?', [req.params.id]);
        if (!dest) return res.status(404).json({ error: 'Destination not found.' });

        const [services] = await db.query(`
            SELECT s.*, pp.business_name, pp.phone AS provider_phone, u.name AS provider_name
            FROM services s
            LEFT JOIN users u ON u.id = s.provider_id
            LEFT JOIN provider_profiles pp ON pp.user_id = s.provider_id
            WHERE s.destination_id = ? AND s.status = 'approved'
            ORDER BY s.type, s.price
        `, [req.params.id]);

        const [packages] = await db.query(
            'SELECT * FROM packages WHERE destination_id = ? ORDER BY price',
            [req.params.id]
        );

        const [reviews] = await db.query(`
            SELECT r.*, u.name AS reviewer_name
            FROM reviews r
            LEFT JOIN users u ON u.id = r.user_id
            WHERE r.destination_id = ?
            ORDER BY r.created_at DESC
            LIMIT 20
        `, [req.params.id]);

        const avgRating = reviews.length
            ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
            : dest.rating;

        res.json({ ...dest, services, packages, reviews, avg_rating: avgRating });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/destinations — admin only ──────────────────────────
router.post('/', auth(['admin']), async (req, res) => {
    const { name, location, district, state, category, price, rating, image, gallery, description,
            season, budget_min, budget_max, featured, nearby_attractions } = req.body;
    if (!name || !location) return res.status(400).json({ error: 'name and location required.' });
    try {
        const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        await db.query(
            `INSERT INTO destinations (id,name,location,district,state,category,price,rating,image,gallery,description,season,budget_min,budget_max,featured,nearby_attractions)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [id, name, location, district||'', state||'', category||'General', price||0, rating||4.5,
             image||'', gallery||null, description||'', season||'', budget_min||0, budget_max||0,
             featured?1:0, nearby_attractions||'']
        );
        res.json({ id, name, message: 'Destination created.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/destinations/:id — admin edit ─────────────────────
router.patch('/:id', auth(['admin']), async (req, res) => {
    const fields = ['name','location','district','state','category','price','rating','image','gallery',
                    'description','season','budget_min','budget_max','featured','nearby_attractions'];
    const updates = [];
    const params  = [];
    fields.forEach(f => {
        if (req.body[f] !== undefined) { updates.push(`${f}=?`); params.push(req.body[f]); }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update.' });
    params.push(req.params.id);
    try {
        await db.query(`UPDATE destinations SET ${updates.join(',')} WHERE id=?`, params);
        res.json({ message: 'Destination updated.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/destinations/:id — admin only ─────────────────────
router.delete('/:id', auth(['admin']), async (req, res) => {
    try {
        await db.query('DELETE FROM destinations WHERE id=?', [req.params.id]);
        res.json({ message: 'Destination deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
