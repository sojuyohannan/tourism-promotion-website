const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── GET /api/services — public (only approved, optional ?destination_id=) ──
router.get('/', async (req, res) => {
    try {
        let query = `
            SELECT s.*, pp.business_name, pp.phone AS provider_phone, u.name AS provider_name, u.email AS provider_email
            FROM services s
            LEFT JOIN users u ON u.id = s.provider_id
            LEFT JOIN provider_profiles pp ON pp.user_id = s.provider_id
            WHERE s.status = 'approved'
        `;
        const params = [];
        if (req.query.destination_id) {
            query += ' AND s.destination_id = ?';
            params.push(req.query.destination_id);
        }
        query += ' ORDER BY s.created_at DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/services/mine — provider's own services ─────────────
router.get('/mine', auth(['provider']), async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT s.*, d.name AS destination_name FROM services s
             LEFT JOIN destinations d ON d.id = s.destination_id
             WHERE s.provider_id = ? ORDER BY s.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/services/all — admin sees all ────────────────────────
router.get('/all', auth(['admin']), async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, d.name AS destination_name, u.name AS provider_name, u.email AS provider_email,
                   pp.business_name
            FROM services s
            LEFT JOIN destinations d ON d.id = s.destination_id
            LEFT JOIN users u ON u.id = s.provider_id
            LEFT JOIN provider_profiles pp ON pp.user_id = s.provider_id
            ORDER BY s.created_at DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/services — provider creates a service ──────────────
router.post('/', auth(['provider', 'admin']), async (req, res) => {
    const { name, type, destination_id, location, price, price_unit, description, capacity, images, operating_hours, cancellation_policy } = req.body;
    if (!name || !type || !price)
        return res.status(400).json({ error: 'name, type, price required.' });

    // Ensure provider profile exists and is approved (skip for admin)
    if (req.user.role === 'provider') {
        const [prof] = await db.query("SELECT status FROM provider_profiles WHERE user_id=?", [req.user.id]);
        if (!prof.length) {
            await db.query(
                `INSERT INTO provider_profiles (user_id,business_name,owner_name,phone,address,license_no,description,profile_image,status) VALUES (?,?,?,?,?,?,?,?,'approved')`,
                [req.user.id, `${req.user.name || 'Local Services'}`, req.user.name || 'Provider', req.user.phone || '9999999999', '', '', 'Verified Service Provider', '']
            );
        } else if (prof[0].status !== 'approved') {
            await db.query("UPDATE provider_profiles SET status='approved' WHERE user_id=?", [req.user.id]);
        }
    }

    try {
        const id = `svc-${Date.now()}`;
        const status = req.user.role === 'admin' ? 'approved' : 'pending';
        const unit = price_unit || (['Taxi', 'Transportation', 'Transport'].includes(type) ? 'per_km' : 'fixed');
        await db.query(
            `INSERT INTO services (id,name,type,destination_id,location,price,price_unit,description,provider_id,status,capacity,images,operating_hours,cancellation_policy)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [id, name, type, destination_id||null, location||'', price, unit, description||'', req.user.id, status, capacity||null, images||null, operating_hours||'', cancellation_policy||'']
        );

        // Notify admin of new service submission
        if (req.user.role === 'provider') {
            const [admins] = await db.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
            if (admins.length) {
                await db.query(
                    "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'new_service','New Service Submission',?)",
                    [admins[0].id, `Provider has submitted a new service: "${name}" for review.`]
                );
            }
            // Notify provider
            await db.query(
                "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'service_submitted','Service Submitted','Your service has been submitted and is pending admin approval.')",
                [req.user.id]
            );
        }

        res.json({ id, name, status, message: 'Service submitted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/services/:id/approve — admin approves ─────────────
router.patch('/:id/approve', auth(['admin']), async (req, res) => {
    try {
        const [svc] = await db.query('SELECT * FROM services WHERE id=?', [req.params.id]);
        if (!svc.length) return res.status(404).json({ error: 'Service not found.' });
        await db.query("UPDATE services SET status='approved', rejection_reason=NULL WHERE id=?", [req.params.id]);
        if (svc[0].provider_id) {
            await db.query(
                "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'service_approved','Service Approved',?)",
                [svc[0].provider_id, `Your service "${svc[0].name}" has been approved and is now visible on the platform!`]
            );
        }
        res.json({ message: 'Service approved.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/services/:id/reject — admin rejects ───────────────
router.patch('/:id/reject', auth(['admin']), async (req, res) => {
    const { reason } = req.body;
    try {
        const [svc] = await db.query('SELECT * FROM services WHERE id=?', [req.params.id]);
        if (!svc.length) return res.status(404).json({ error: 'Service not found.' });
        await db.query("UPDATE services SET status='rejected', rejection_reason=? WHERE id=?", [reason||'', req.params.id]);
        if (svc[0].provider_id) {
            await db.query(
                "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'service_rejected','Service Not Approved',?)",
                [svc[0].provider_id, `Your service "${svc[0].name}" was not approved. Reason: ${reason || 'Please contact support.'}`]
            );
        }
        res.json({ message: 'Service rejected.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/services/:id ──────────────────────────────────────
router.delete('/:id', auth(['provider', 'admin']), async (req, res) => {
    try {
        const [svc] = await db.query('SELECT provider_id FROM services WHERE id=?', [req.params.id]);
        if (!svc.length) return res.status(404).json({ error: 'Not found.' });
        if (req.user.role === 'provider' && svc[0].provider_id !== req.user.id)
            return res.status(403).json({ error: 'You can only delete your own services.' });
        await db.query('DELETE FROM services WHERE id=?', [req.params.id]);
        res.json({ message: 'Service deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/services/destination/:destinationId ──────────────────
router.get('/destination/:destinationId', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT s.*, pp.business_name, pp.phone AS provider_phone, u.name AS provider_name
             FROM services s
             LEFT JOIN users u ON u.id = s.provider_id
             LEFT JOIN provider_profiles pp ON pp.user_id = s.provider_id
             WHERE s.status = 'approved' AND s.destination_id = ?`,
            [req.params.destinationId]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
