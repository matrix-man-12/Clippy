import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/share/:token — Public: get shared note metadata + text
router.get('/:token', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, content_type, content_text, content_image_mime, content_image_name,
                    created_at, updated_at, expiry_at
             FROM clipboard_items
             WHERE share_token = $1 AND deleted_at IS NULL`,
            [req.params.token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shared note not found' });
        }

        const item = result.rows[0];

        // Check expiry
        if (item.expiry_at && new Date(item.expiry_at) < new Date()) {
            return res.status(410).json({ error: 'This note has expired' });
        }

        res.json(item);
    } catch (err) {
        console.error('Error fetching shared note:', err);
        res.status(500).json({ error: 'Failed to fetch shared note' });
    }
});

// GET /api/share/:token/image — Public: serve shared image binary
router.get('/:token/image', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT content_image, content_image_mime, content_image_name
             FROM clipboard_items
             WHERE share_token = $1 AND content_type = 'image' AND deleted_at IS NULL`,
            [req.params.token]
        );

        if (result.rows.length === 0 || !result.rows[0].content_image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const { content_image, content_image_mime, content_image_name } = result.rows[0];

        res.set('Content-Type', content_image_mime);
        res.set('Content-Disposition', `inline; filename="${content_image_name || 'image'}"`);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(content_image);
    } catch (err) {
        console.error('Error fetching shared image:', err);
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});

export default router;
