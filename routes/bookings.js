const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── GET /api/bookings — role-filtered ────────────────────────────
router.get('/', auth(['admin', 'user', 'provider']), async (req, res) => {
    try {
        let rows;
        if (req.user.role === 'user') {
            [rows] = await db.query(
                `SELECT b.*, d.name AS dest_name, d.image AS dest_image
                 FROM bookings b LEFT JOIN destinations d ON d.id = b.destination_id
                 WHERE b.user_id = ? ORDER BY b.created_at DESC`,
                [req.user.id]
            );
        } else if (req.user.role === 'provider') {
            // Provider sees only bookings that include their services
            [rows] = await db.query(
                `SELECT DISTINCT b.*, d.name AS dest_name, d.image AS dest_image
                 FROM bookings b
                 JOIN booking_services bs ON bs.booking_id = b.id AND bs.provider_id = ?
                 LEFT JOIN destinations d ON d.id = b.destination_id
                 ORDER BY b.created_at DESC`,
                [req.user.id]
            );
        } else {
            // Admin sees all
            [rows] = await db.query(
                `SELECT b.*, u.name AS tourist_name, u.email AS tourist_email, u.phone AS tourist_phone,
                        d.name AS dest_name, d.image AS dest_image
                 FROM bookings b
                 LEFT JOIN users u ON u.id = b.user_id
                 LEFT JOIN destinations d ON d.id = b.destination_id
                 ORDER BY b.created_at DESC`
            );
        }
        // Attach booking_services to each booking
        for (const b of rows) {
            let sql = `SELECT bs.*, 
                              COALESCE(bs.service_name, s.name) AS service_name, 
                              COALESCE(bs.service_type, s.type) AS service_type, 
                              s.price AS svc_price, s.price_unit,
                              pp.business_name, pp.phone AS provider_phone, u.name AS provider_name
                       FROM booking_services bs
                       LEFT JOIN services s ON s.id = bs.service_id
                       LEFT JOIN users u ON u.id = bs.provider_id
                       LEFT JOIN provider_profiles pp ON pp.user_id = bs.provider_id
                       WHERE bs.booking_id = ?`;
            let params = [b.id];
            
            // If logged in as provider, return ONLY their own service items for this booking
            if (req.user.role === 'provider') {
                sql += ` AND bs.provider_id = ?`;
                params.push(req.user.id);
            }
            
            const [bsvc] = await db.query(sql, params);
            b.services = bsvc;
        }
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/bookings/:id — get details for success screen & receipt ──
router.get('/:id', auth(['admin', 'user', 'provider']), async (req, res) => {
    try {
        const [[booking]] = await db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!booking) return res.status(404).json({ error: 'Booking not found.' });

        if (req.user.role === 'user' && booking.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied: not your booking.' });
        }
        if (req.user.role === 'provider') {
            // Check if provider has a service in this booking
            const [rows] = await db.query(
                'SELECT id FROM booking_services WHERE booking_id = ? AND provider_id = ? LIMIT 1',
                [req.params.id, req.user.id]
            );
            if (!rows.length) return res.status(403).json({ error: 'Access denied.' });
        }

        // Fetch destination details
        const [[d]] = await db.query('SELECT name, image FROM destinations WHERE id=?', [booking.destination_id]);
        booking.dest_name = d ? d.name : booking.destination;
        booking.dest_image = d ? d.image : null;

        // Fetch associated services
        let sql = `SELECT bs.*, 
                          COALESCE(bs.service_name, s.name) AS service_name, 
                          COALESCE(bs.service_type, s.type) AS service_type, 
                          s.price AS svc_price, s.price_unit,
                          pp.business_name, pp.phone AS provider_phone, u.name AS provider_name
                   FROM booking_services bs
                   LEFT JOIN services s ON s.id = bs.service_id
                   LEFT JOIN users u ON u.id = bs.provider_id
                   LEFT JOIN provider_profiles pp ON pp.user_id = bs.provider_id
                   WHERE bs.booking_id = ?`;
        let params = [req.params.id];
        if (req.user.role === 'provider') {
            sql += ` AND bs.provider_id = ?`;
            params.push(req.user.id);
        }

        const [services] = await db.query(sql, params);
        booking.services = services;

        res.json(booking);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/bookings — tourist creates booking ──────────────────
router.post('/', auth(['user', 'admin']), async (req, res) => {
    // name/contact are optional from wizard — fall back to user profile
    const { phone, destination_id, destination, package_id, package_name,
            travel_date, guests, distance_km, notes, special_requests, service_ids,
            payment_amount, payment_status } = req.body;
    let { name, contact } = req.body;

    // Auto-fill name and contact from logged-in user if not sent
    if (!name)    name    = req.user.name    || 'Tourist';
    if (!contact) contact = req.user.email   || 'N/A';
    if (!travel_date)
        return res.status(400).json({ error: 'travel_date is required.' });
    try {
        // Resolve destination name
        let destName = destination || '';
        if (destination_id && !destName) {
            const [[d]] = await db.query('SELECT name FROM destinations WHERE id=?', [destination_id]);
            if (d) destName = d.name;
        }

        const finalPayStatus = payment_status === 'paid' ? 'paid' : 'unpaid';
        const distKm = parseFloat(distance_km) || 0;
        const guestCount = parseInt(guests) || 1;

        const [result] = await db.query(
            `INSERT INTO bookings (user_id,name,contact,phone,destination_id,destination,package_id,package_name,
             travel_date,guests,distance_km,notes,special_requests,payment_status,payment_amount,status)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Pending')`,
            [req.user.id, name, contact, phone||req.user.phone||'', destination_id||null, destName,
             package_id||null, package_name||'Custom request',
             travel_date, guestCount, distKm, notes||'', special_requests||'', finalPayStatus, payment_amount||0]
        );
        const bookingId = result.insertId;

        // Helper to check per person services
        const perPersonTypes = ['Restaurant', 'Food', 'Adventure Activities', 'Trekking', 'Cultural Experience', 'Activity Provider'];

        // Insert booking_services junction records with platform commission
        const ids = Array.isArray(service_ids) ? service_ids : [];
        for (const svcId of ids) {
            const [[svc]] = await db.query('SELECT id, name, type, provider_id, price, price_unit, commission_percentage FROM services WHERE id=?', [svcId]);
            if (svc) {
                let serviceAmount = parseFloat(svc.price) || 0;
                if (svc.price_unit === 'per_km' || ['Taxi', 'Transportation', 'Transport'].includes(svc.type)) {
                    if (distKm > 0) {
                        serviceAmount = serviceAmount * distKm;
                    }
                } else if (perPersonTypes.includes(svc.type)) {
                    serviceAmount = serviceAmount * guestCount;
                }

                const commPct = parseFloat(svc.commission_percentage) || 10.00;
                const commAmt = serviceAmount * (commPct / 100);
                const provAmt = serviceAmount - commAmt;

                await db.query(
                    `INSERT INTO booking_services (booking_id, service_id, provider_id, service_name, service_type, price, service_amount, commission_percentage, commission_amount, provider_amount)
                     VALUES (?,?,?,?,?,?,?,?,?,?)`,
                    [bookingId, svcId, svc.provider_id, svc.name, svc.type, serviceAmount, serviceAmount, commPct, commAmt, provAmt]
                );
                // Notify each provider
                if (svc.provider_id) {
                    await db.query(
                        "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'new_booking','New Booking Request',?)",
                        [svc.provider_id, `You have a new booking request for ${destName} on ${travel_date}.`]
                    );
                }
            }
        }

        // Notify admin
        const [[admin]] = await db.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
        if (admin) {
            await db.query(
                "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'new_booking','New Booking','A new booking has been submitted for " + destName + ".')",
                [admin.id]
            );
        }

        res.json({ id: bookingId, message: 'Booking submitted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/bookings/:id/status — update status ───────────────
router.patch('/:id/status', auth(['admin', 'user', 'provider']), async (req, res) => {
    const { status } = req.body;
    const allowed = ['Pending','Confirmed','Completed','Cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    try {
        const [[b]] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
        if (!b) return res.status(404).json({ error: 'Booking not found.' });

        // Tourists can only cancel their own pending bookings
        if (req.user.role === 'user') {
            if (b.user_id !== req.user.id) return res.status(403).json({ error: 'Not your booking.' });
            if (status !== 'Cancelled') return res.status(403).json({ error: 'Tourists can only cancel.' });
        }

        await db.query('UPDATE bookings SET status=? WHERE id=?', [status, req.params.id]);

        // If Confirmed or Completed, also update booking_services
        if (status === 'Confirmed' || status === 'Completed') {
            await db.query('UPDATE booking_services SET status=? WHERE booking_id=?', [status, req.params.id]);
        }

        // Notify tourist
        if (b.user_id) {
            const msgs = {
                Confirmed:  'Your booking has been confirmed! Safe travels.',
                Completed:  'Your trip is marked as completed. Please leave a review!',
                Cancelled:  'Your booking has been cancelled.',
            };
            if (msgs[status]) {
                await db.query(
                    "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'booking_update',?,?)",
                    [b.user_id, `Booking ${status}`, msgs[status]]
                );
            }
        }

        res.json({ message: `Booking marked as ${status}.` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/bookings/:id/payment — record payment ─────────────
router.patch('/:id/payment', auth(['user', 'admin']), async (req, res) => {
    const { payment_ref } = req.body;
    try {
        const [[b]] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
        if (!b) return res.status(404).json({ error: 'Booking not found.' });
        if (req.user.role === 'user' && b.user_id !== req.user.id)
            return res.status(403).json({ error: 'Not your booking.' });
        await db.query(
            "UPDATE bookings SET payment_status='paid', payment_ref=? WHERE id=?",
            [payment_ref || `PAY-${Date.now()}`, req.params.id]
        );
        res.json({ message: 'Payment recorded.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/bookings/:id ──────────────────────────────────────
router.delete('/:id', auth(['admin', 'user']), async (req, res) => {
    try {
        const [[b]] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
        if (!b) return res.status(404).json({ error: 'Not found.' });
        if (req.user.role === 'user' && b.user_id !== req.user.id)
            return res.status(403).json({ error: 'Not your booking.' });
        await db.query('DELETE FROM bookings WHERE id=?', [req.params.id]);
        res.json({ message: 'Booking deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
