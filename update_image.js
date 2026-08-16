const db = require('./db/connection');

async function updateImage() {
    try {
        const newUrl = 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=85';
        await db.query("UPDATE destinations SET image = ? WHERE id = 'munnar'", [newUrl]);
        console.log('Successfully updated image in database.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateImage();
