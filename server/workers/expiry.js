import pool from '../db.js';

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const PURGE_BUFFER_MS = 24 * 60 * 60 * 1000; // 24 hours

async function cleanupExpired() {
    try {
        // Soft-delete expired items
        const softDeleted = await pool.query(
            `UPDATE clipboard_items 
       SET deleted_at = NOW() 
       WHERE expiry_at <= NOW() AND deleted_at IS NULL
       RETURNING id, content_blob_url`
        );

        if (softDeleted.rows.length > 0) {
            console.log(`[Expiry Worker] Soft-deleted ${softDeleted.rows.length} expired items`);

            // TODO: Delete associated S3 objects for image items
            // const imageItems = softDeleted.rows.filter(r => r.content_blob_url);
            // for (const item of imageItems) {
            //   await deleteFromS3(item.content_blob_url);
            // }
        }

        // Permanently purge items soft-deleted more than 24 hours ago
        const purged = await pool.query(
            `DELETE FROM clipboard_items 
       WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '24 hours'
       RETURNING id`
        );

        if (purged.rows.length > 0) {
            console.log(`[Expiry Worker] Purged ${purged.rows.length} items (24h buffer passed)`);
        }

        // Clean up expired QR tokens
        const qrCleaned = await pool.query(
            `DELETE FROM qr_tokens WHERE expires_at < NOW() RETURNING token`
        );

        if (qrCleaned.rows.length > 0) {
            console.log(`[Expiry Worker] Cleaned ${qrCleaned.rows.length} expired QR tokens`);
        }
    } catch (err) {
        console.error('[Expiry Worker] Error during cleanup:', err);
    }
}

export function startExpiryWorker() {
    console.log('[Expiry Worker] Started — running every 10 minutes');

    // Run once on startup
    cleanupExpired();

    // Then run on interval
    const intervalId = setInterval(cleanupExpired, CLEANUP_INTERVAL_MS);

    // Return interval ID so it can be cleared if needed
    return intervalId;
}
