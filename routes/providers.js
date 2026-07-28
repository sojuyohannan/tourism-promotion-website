const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── GET /api/providers/profile (own profile) ─────────────────────
router.get('/profile', auth(['provider']), async (req, res) => {
    try {
        let [rows] = await db.query('SELECT * FROM provider_profiles WHERE user_id = ?', [req.user.id]);
        if (!rows.length) {
            // Auto-create approved profile for new provider
            const bizName = `${req.user.name || 'Local Services'}`;
            const ownerName = req.user.name || 'Provider';
            const phone = req.user.phone || '9999999999';
            await db.query(
                `INSERT INTO provider_profiles (user_id,business_name,owner_name,phone,address,license_no,description,profile_image,status) VALUES (?,?,?,?,?,?,?,?,'approved')`,
                [req.user.id, bizName, ownerName, phone, '', '', 'Verified Service Provider', '']
            );
            [rows] = await db.query('SELECT * FROM provider_profiles WHERE user_id = ?', [req.user.id]);
        } else if (rows[0].status === 'pending') {
            await db.query("UPDATE provider_profiles SET status='approved' WHERE user_id=?", [req.user.id]);
            rows[0].status = 'approved';
        }
        res.json(rows[0] || null);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/providers/profile (create or update) ───────────────
router.post('/profile', auth(['provider']), async (req, res) => {
    const { business_name, owner_name, phone, address, license_no, description, profile_image } = req.body;
    if (!business_name || !owner_name || !phone)
        return res.status(400).json({ error: 'business_name, owner_name, phone required.' });
    try {
        const [existing] = await db.query('SELECT id FROM provider_profiles WHERE user_id = ?', [req.user.id]);
        if (existing.length) {
            await db.query(
                `UPDATE provider_profiles SET business_name=?,owner_name=?,phone=?,address=?,license_no=?,description=?,profile_image=?,status='approved' WHERE user_id=?`,
                [business_name, owner_name, phone, address||'', license_no||'', description||'', profile_image||'', req.user.id]
            );
        } else {
            await db.query(
                `INSERT INTO provider_profiles (user_id,business_name,owner_name,phone,address,license_no,description,profile_image,status) VALUES (?,?,?,?,?,?,?,?,'approved')`,
                [req.user.id, business_name, owner_name, phone, address||'', license_no||'', description||'', profile_image||'']
            );
        }
        // Update phone and status on users table too
        await db.query("UPDATE users SET phone=?, status='active' WHERE id=?", [phone, req.user.id]);
        const [profile] = await db.query('SELECT * FROM provider_profiles WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'Profile saved.', profile: profile[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/providers (admin — list all providers) ───────────────
router.get('/', auth(['admin']), async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
                   pp.business_name, pp.owner_name, pp.phone AS biz_phone,
                   pp.description, pp.profile_image, pp.status AS profile_status
            FROM users u
            LEFT JOIN provider_profiles pp ON pp.user_id = u.id
            WHERE u.role = 'provider'
            ORDER BY u.created_at DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/providers/:id/approve (admin) ──────────────────────
router.patch('/:id/approve', auth(['admin']), async (req, res) => {
    try {
        await db.query("UPDATE users SET status='active' WHERE id=?", [req.params.id]);
        const [prof] = await db.query('SELECT id FROM provider_profiles WHERE user_id = ?', [req.params.id]);
        if (prof.length) {
            await db.query("UPDATE provider_profiles SET status='approved' WHERE user_id=?", [req.params.id]);
        } else {
            const [[user]] = await db.query('SELECT name, phone FROM users WHERE id=?', [req.params.id]);
            await db.query(
                `INSERT INTO provider_profiles (user_id,business_name,owner_name,phone,address,license_no,description,profile_image,status) VALUES (?,?,?,?,?,?,?,?,'approved')`,
                [req.params.id, (user?.name || 'Local Services'), (user?.name || 'Provider'), (user?.phone || '9999999999'), '', '', 'Verified Service Provider', '']
            );
        }
        // Notify provider
        await db.query(
            "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'account_approved','Account Approved','Your service provider account has been approved! You can now add services.')",
            [req.params.id]
        );
        res.json({ message: 'Provider approved.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/providers/:id/reject (admin) ───────────────────────
router.patch('/:id/reject', auth(['admin']), async (req, res) => {
    const { reason } = req.body;
    try {
        await db.query("UPDATE users SET status='suspended' WHERE id=?", [req.params.id]);
        const [prof] = await db.query('SELECT id FROM provider_profiles WHERE user_id = ?', [req.params.id]);
        if (prof.length) {
            await db.query("UPDATE provider_profiles SET status='rejected' WHERE user_id=?", [req.params.id]);
        }
        await db.query(
            "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'account_rejected','Account Not Approved',?)",
            [req.params.id, reason || 'Your account was not approved at this time.']
        );
        res.json({ message: 'Provider rejected.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/providers/:id/suspend (admin) ─────────────────────
router.patch('/:id/suspend', auth(['admin']), async (req, res) => {
    try {
        await db.query("UPDATE users SET status='suspended' WHERE id=?", [req.params.id]);
        res.json({ message: 'Provider suspended.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
