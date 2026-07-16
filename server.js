require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const app      = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET || 'tourism_session_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Route-level protection for dashboard directories
app.use((req, res, next) => {
    const url = req.originalUrl;
    const isDashboard = url.startsWith('/admin') || url.startsWith('/user') || url.startsWith('/provider');
    if (isDashboard) {
        if (!req.session || !req.session.user) {
            return res.redirect('/login.html?session_expired=true');
        }
        const role = req.session.user.role;
        const rolePaths = {
            admin: '/admin',
            user: '/user',
            provider: '/provider'
        };
        
        const expectedPrefix = rolePaths[role];
        if (!expectedPrefix || !url.startsWith(expectedPrefix)) {
            return res.redirect(rolePaths[role] + '/');
        }
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/destinations',  require('./routes/destinations'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/services',      require('./routes/services'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/packages',      require('./routes/packages'));
app.use('/api/providers',     require('./routes/providers'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/upload',        require('./routes/uploads'));
app.use('/api/wishlists',     require('./routes/wishlists'));
app.use('/api/wishlist',      require('./routes/wishlists'));
app.use('/api/payments',      require('./routes/payments'));

// ── Seed default admin on startup ─────────────────────────────
async function seedAdmin() {
    try {
        const db = require('./db/connection');
        const [rows] = await db.query("SELECT id FROM users WHERE email = 'admin@tourism.com'");
        if (!rows.length) {
            const hash = await bcrypt.hash('Admin@123', 10);
            await db.query(
                "INSERT INTO users (name,email,password,role,status) VALUES (?,?,?,?,?)",
                ['Administrator', 'admin@tourism.com', hash, 'admin', 'active']
            );
            console.log('✅  Default admin created  →  admin@tourism.com / Admin@123');
        }
        // Mark first munnar destination as featured
        await db.query("UPDATE destinations SET featured=1 WHERE id='munnar' LIMIT 1");
    } catch (e) { /* DB not ready yet */ }
}
setTimeout(seedAdmin, 1500);

// ── SPA fallback ──────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🌍  Tourism Marketplace  →  http://localhost:${PORT}`);
    console.log(`📦  API              →  http://localhost:${PORT}/api\n`);
});
