const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'tourism_promo_secret_2026';

module.exports = function requireAuth(roles = []) {
    return (req, res, next) => {
        const header = req.headers.authorization || '';
        if (!header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        const token = header.split(' ')[1];
        try {
            const payload = jwt.verify(token, SECRET);
            if (roles.length && !roles.includes(payload.role)) {
                return res.status(403).json({ error: 'Access denied for this role.' });
            }
            req.user = payload;
            next();
        } catch {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
    };
};
