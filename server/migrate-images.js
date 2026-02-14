import pool from './db.js';

/**
 * Migration 002: Add bytea image storage columns to clipboard_items
 */
async function migrateImages() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Add content_image (bytea) for binary image data
        await client.query(`
            ALTER TABLE clipboard_items
            ADD COLUMN IF NOT EXISTS content_image BYTEA;
        `);

        // Add content_image_mime to store the MIME type (e.g., image/png)
        await client.query(`
            ALTER TABLE clipboard_items
            ADD COLUMN IF NOT EXISTS content_image_mime VARCHAR(50);
        `);

        // Add content_image_name to store original filename
        await client.query(`
            ALTER TABLE clipboard_items
            ADD COLUMN IF NOT EXISTS content_image_name VARCHAR(255);
        `);

        // Add share_token for public sharing URLs
        await client.query(`
            ALTER TABLE clipboard_items
            ADD COLUMN IF NOT EXISTS share_token VARCHAR(32) UNIQUE;
        `);

        await client.query('COMMIT');
        console.log('Image migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Image migration failed:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

migrateImages();
