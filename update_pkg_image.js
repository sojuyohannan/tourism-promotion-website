const db = require('./db/connection');

async function updatePackageImage() {
    try {
        const newUrl = '/assets/munnar_package.png';
        await db.query("UPDATE packages SET image = ? WHERE id = 'pkg-munnar'", [newUrl]);
        console.log('Successfully updated package image in database.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updatePackageImage();
