const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── POST /api/payments — save payment & update booking ──────────────────
router.post('/', auth(['user', 'admin']), async (req, res) => {
    const { booking_id, amount, card_holder } = req.body;
    if (!booking_id || !amount || !card_holder) {
        return res.status(400).json({ error: 'booking_id, amount, and card_holder are required.' });
    }
    try {
        // Check if booking exists and belongs to the user
        const [[b]] = await db.query('SELECT * FROM bookings WHERE id = ?', [booking_id]);
        if (!b) return res.status(404).json({ error: 'Booking not found.' });
        if (req.user.role === 'user' && b.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied: not your booking.' });
        }

        const paymentRef = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Start transaction
        const conn = await db.getConnection();
        await conn.beginTransaction();

        try {
            // Save payment
            await conn.query(
                `INSERT INTO payments (booking_id, amount, card_holder, payment_ref, status)
                 VALUES (?, ?, ?, ?, 'success')`,
                [booking_id, amount, card_holder, paymentRef]
            );

            // Update booking
            await conn.query(
                `UPDATE bookings 
                 SET payment_status = 'paid', payment_ref = ?, status = 'Confirmed'
                 WHERE id = ?`,
                [paymentRef, booking_id]
            );

            // Update booking services
            await conn.query(
                `UPDATE booking_services 
                 SET status = 'Confirmed'
                 WHERE booking_id = ?`,
                [booking_id]
            );

            // Notify provider(s)
            const [services] = await conn.query('SELECT provider_id FROM booking_services WHERE booking_id = ?', [booking_id]);
            for (const s of services) {
                if (s.provider_id) {
                    await conn.query(
                        "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'payment_received','Payment Received',?)",
                        [s.provider_id, `Payment for booking #${booking_id} has been received. Status: Confirmed.`]
                    );
                }
            }

            // Notify admin
            const [[admin]] = await conn.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
            if (admin) {
                await conn.query(
                    "INSERT INTO notifications (user_id,type,title,message) VALUES (?,'payment_received','Payment Received','Payment of " + amount + " received for booking #" + booking_id + ".')",
                    [admin.id]
                );
            }

            await conn.commit();
            conn.release();

            res.json({
                success: true,
                booking_id: booking_id,
                payment_ref: paymentRef,
                booking_ref: `BK-${booking_id}`,
                message: 'Payment processed and booking confirmed.'
            });

        } catch (err) {
            await conn.rollback();
            conn.release();
            throw err;
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/payments — admin sees all, user sees own ──────────────────
router.get('/', auth(['admin', 'user']), async (req, res) => {
    try {
        let rows;
        if (req.user.role === 'admin') {
            [rows] = await db.query(
                `SELECT p.*, b.destination, u.name AS user_name
                 FROM payments p
                 JOIN bookings b ON b.id = p.booking_id
                 JOIN users u ON u.id = b.user_id
                 ORDER BY p.created_at DESC`
            );
        } else {
            [rows] = await db.query(
                `SELECT p.*, b.destination
                 FROM payments p
                 JOIN bookings b ON b.id = p.booking_id
                 WHERE b.user_id = ?
                 ORDER BY p.created_at DESC`,
                [req.user.id]
            );
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
