const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext  = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                   allowed.test(file.mimetype);
        if (ok) cb(null, true);
        else cb(new Error('Only image files are allowed.'));
    }
});

// POST /api/upload — returns public URL of uploaded file
router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, message: 'Upload successful.' });
});

module.exports = router;
