const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const auth    = require('../middleware/auth');

// ── GET /api/analytics/overview — admin ───────────────────────────
router.get('/overview', auth(['admin']), async (req, res) => {
    try {
        const [[users]]        = await db.query("SELECT COUNT(*) as n FROM users WHERE role='user'");
        const [[providers]]    = await db.query("SELECT COUNT(*) as n FROM users WHERE role='provider'");
        const [[destinations]] = await db.query("SELECT COUNT(*) as n FROM destinations");
        const [[services]]     = await db.query("SELECT COUNT(*) as n FROM services WHERE status='approved'");
        const [[pendSvc]]      = await db.query("SELECT COUNT(*) as n FROM services WHERE status='pending'");
        const [[bookings]]     = await db.query("SELECT COUNT(*) as n FROM bookings");
        const [[pending]]      = await db.query("SELECT COUNT(*) as n FROM bookings WHERE status='Pending'");
        const [[revenue]]      = await db.query("SELECT COALESCE(SUM(payment_amount),0) as total FROM bookings WHERE payment_status='paid'");
        const [[pendProviders]]= await db.query("SELECT COUNT(*) as n FROM provider_profiles WHERE status='pending'");

        const [topDests] = await db.query(`
            SELECT d.name, d.image, COUNT(b.id) as booking_count
            FROM destinations d
            LEFT JOIN bookings b ON b.destination_id = d.id
            GROUP BY d.id ORDER BY booking_count DESC LIMIT 5
        `);
        const [recentBookings] = await db.query(`
            SELECT b.id, b.destination, b.travel_date, b.status, b.payment_status,
                   u.name AS tourist_name
            FROM bookings b LEFT JOIN users u ON u.id = b.user_id
            ORDER BY b.created_at DESC LIMIT 5
        `);
        const [monthlyBookings] = await db.query(`
            SELECT DATE_FORMAT(created_at,'%Y-%m') as month, COUNT(*) as count
            FROM bookings
            GROUP BY month ORDER BY month DESC LIMIT 6
        `);

        res.json({
            stats: {
                tourists:          users.n,
                providers:         providers.n,
                destinations:      destinations.n,
                approved_services: services.n,
                pending_services:  pendSvc.n,
                total_bookings:    bookings.n,
                pending_bookings:  pending.n,
                total_revenue:     Number(revenue.total),
                pending_providers: pendProviders.n,
            },
            top_destinations:  topDests,
            recent_bookings:   recentBookings,
            monthly_bookings:  monthlyBookings,
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/analytics/public — public landing page ─────────────────
router.get('/public', async (req, res) => {
    try {
        // 1. Stats
        const [[users]]        = await db.query("SELECT COUNT(*) as n FROM users WHERE role='user'");
        const [[destinations]] = await db.query("SELECT COUNT(*) as n FROM destinations");
        const [[services]]     = await db.query("SELECT COUNT(*) as n FROM services WHERE status='approved'");
        const [[events]]       = await db.query("SELECT COUNT(*) as n FROM events");
        
        // 2. Featured Destinations (top 6 by rating or featured flag)
        const [featuredDestinations] = await db.query(`
            SELECT * FROM destinations 
            ORDER BY featured DESC, rating DESC 
            LIMIT 6
        `);
        
        // 3. Top Providers (businesses with most approved services)
        const [topProviders] = await db.query(`
            SELECT p.id, p.business_name, p.description, u.name as owner, p.profile_image as logo, COUNT(s.id) as service_count
            FROM provider_profiles p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN services s ON s.provider_id = u.id AND s.status='approved'
            WHERE p.status = 'approved'
            GROUP BY p.id
            ORDER BY service_count DESC
            LIMIT 3
        `);
        
        // 4. Testimonials (Random 3 reviews >= 4 stars)
        const [testimonials] = await db.query(`
            SELECT r.*, d.name as destination_name 
            FROM reviews r
            JOIN destinations d ON d.id = r.destination_id
            WHERE r.rating >= 4
            ORDER BY RAND()
            LIMIT 3
        `);
        
        res.json({
            stats: {
                tourists: users.n,
                destinations: destinations.n,
                services: services.n,
                events: events.n
            },
            destinations: featuredDestinations,
            providers: topProviders,
            testimonials: testimonials
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
