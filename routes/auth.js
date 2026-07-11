const express  = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const db        = require('../db/connection');
const router    = express.Router();

const SECRET = process.env.JWT_SECRET || 'tourism_promo_secret_2026';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required.' });
    const allowedRoles = ['user', 'provider'];
    const safeRole = allowedRoles.includes(role) ? role : 'user';
    // Providers start as pending; tourists are active immediately
    const status = safeRole === 'provider' ? 'pending' : 'active';
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length) return res.status(409).json({ error: 'Email already registered.' });
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hash, safeRole, phone||null, status]
        );
        const user = { id: result.insertId, name, email, role: safeRole, phone: phone||null, status };

        // If provider, notify admin
        if (safeRole === 'provider') {
            const [admins] = await db.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
            if (admins.length) {
                await db.query(
                    "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'new_provider','New Provider Registration',?)",
                    [admins[0].id, `${name} has registered as a Service Provider and is awaiting approval.`]
                );
            }
        }

        const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
        req.session.user = user;
        res.json({ token, user,
            message: safeRole === 'provider'
                ? 'Registration successful! Your account is pending admin approval.'
                : 'Registration successful!'
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'Email, password and role required.' });
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid email or password.' });
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
        
        // Backend role validation
        if (user.role !== role) {
            return res.status(403).json({ error: 'Invalid role for this account' });
        }
        
        if (user.status === 'suspended') return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        const payload = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status };
        
        // Session-based authentication
        req.session.user = payload;
        
        const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });
        res.json({ token, user: payload });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ error: 'Failed to logout session' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Session logged out successfully' });
        });
    } else {
        res.json({ message: 'No active session' });
    }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth')(), (req, res) => {
    res.json({ user: req.user });
});

// GET /api/auth/users  (admin only)
router.get('/users', require('../middleware/auth')(['admin']), async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/auth/users/:id/status — admin suspend/activate
router.patch('/users/:id/status', require('../middleware/auth')(['admin']), async (req, res) => {
    const { status } = req.body;
    if (!['active','suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    try {
        await db.query('UPDATE users SET status=? WHERE id=?', [status, req.params.id]);
        const [[user]] = await db.query('SELECT role, name, phone FROM users WHERE id=?', [req.params.id]);
        if (user && user.role === 'provider') {
            const profStatus = status === 'active' ? 'approved' : 'rejected';
            const [prof] = await db.query('SELECT id FROM provider_profiles WHERE user_id=?', [req.params.id]);
            if (prof.length) {
                await db.query('UPDATE provider_profiles SET status=? WHERE user_id=?', [profStatus, req.params.id]);
            } else if (status === 'active') {
                await db.query(
                    `INSERT INTO provider_profiles (user_id,business_name,owner_name,phone,address,license_no,description,profile_image,status) VALUES (?,?,?,?,?,?,?,?,'approved')`,
                    [req.params.id, (user.name || 'Local Services'), (user.name || 'Provider'), (user.phone || '9999999999'), '', '', 'Verified Service Provider', '']
                );
            }
        }
        res.json({ message: `User status updated to ${status}.` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/auth/users/:id — admin deletes user or provider account
router.delete('/users/:id', require('../middleware/auth')(['admin']), async (req, res) => {
    try {
        await db.query('DELETE FROM provider_profiles WHERE user_id=?', [req.params.id]);
        await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
        res.json({ message: 'User deleted successfully.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/auth/profile — update own profile
router.patch('/profile', require('../middleware/auth')(), async (req, res) => {
    const { name, phone } = req.body;
    try {
        await db.query('UPDATE users SET name=?, phone=? WHERE id=?', [name||req.user.name, phone||null, req.user.id]);
        res.json({ message: 'Profile updated.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/wishlists
router.get('/wishlists', require('../middleware/auth')(['user']), async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT w.*, d.name, d.image, d.location, d.category, d.price, d.rating
             FROM wishlists w JOIN destinations d ON d.id = w.destination_id
             WHERE w.user_id=? ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/wishlists
router.post('/wishlists', require('../middleware/auth')(['user']), async (req, res) => {
    const { destination_id } = req.body;
    if (!destination_id) return res.status(400).json({ error: 'destination_id required.' });
    try {
        await db.query('INSERT IGNORE INTO wishlists (user_id,destination_id) VALUES (?,?)', [req.user.id, destination_id]);
        res.json({ message: 'Added to wishlist.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/auth/wishlists/:destination_id
router.delete('/wishlists/:destination_id', require('../middleware/auth')(['user']), async (req, res) => {
    try {
        await db.query('DELETE FROM wishlists WHERE user_id=? AND destination_id=?', [req.user.id, req.params.destination_id]);
        res.json({ message: 'Removed from wishlist.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
