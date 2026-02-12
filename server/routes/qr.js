import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db.js';

const router = Router();

// POST /api/qr/generate — Generate a QR token (authenticated)
router.post('/generate', async (req, res) => {
    try {
        const { content_text } = req.body;

        if (!content_text) {
            return res.status(400).json({ error: 'content_text is required' });
        }

        // Enforce 2KB limit for QR payload
        const sizeBytes = Buffer.byteLength(content_text, 'utf8');
        if (sizeBytes > 2048) {
            return res.status(400).json({ error: 'Content exceeds 2KB limit for QR transfer' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            `INSERT INTO qr_tokens (token, content_text, expires_at)
       VALUES ($1, $2, $3)`,
            [token, content_text, expiresAt]
        );

        res.status(201).json({
            token,
            expires_at: expiresAt.toISOString(),
            url: `/api/qr/${token}`,
        });
    } catch (err) {
        console.error('Error generating QR token:', err);
        res.status(500).json({ error: 'Failed to generate QR token' });
    }
});

// GET /api/qr/:token — Retrieve content (PUBLIC, no auth needed)
router.get('/:token', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT content_text, expires_at FROM qr_tokens WHERE token = $1`,
            [req.params.token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Token not found or expired' });
        }

        const row = result.rows[0];

        if (new Date(row.expires_at) < new Date()) {
            // Clean up expired token
            await pool.query(`DELETE FROM qr_tokens WHERE token = $1`, [req.params.token]);
            return res.status(410).json({ error: 'Token has expired' });
        }

        res.json({ content_text: row.content_text });
    } catch (err) {
        console.error('Error retrieving QR content:', err);
        res.status(500).json({ error: 'Failed to retrieve content' });
    }
});

export default router;
