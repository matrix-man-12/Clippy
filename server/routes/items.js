import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// POST /api/items — Create a clipboard item
router.post('/', async (req, res) => {
    try {
        const { content_type, content_text, content_blob_url, expiry_at } = req.body;

        if (!content_type || !['text', 'rich_text', 'json', 'image'].includes(content_type)) {
            return res.status(400).json({ error: 'Invalid content_type. Must be: text, rich_text, json, or image' });
        }

        if (content_type !== 'image' && !content_text) {
            return res.status(400).json({ error: 'content_text is required for non-image items' });
        }

        if (content_type === 'image' && !content_blob_url) {
            return res.status(400).json({ error: 'content_blob_url is required for image items' });
        }

        // Enforce size limits
        if (content_text) {
            const sizeKb = Buffer.byteLength(content_text, 'utf8') / 1024;
            const maxKb = content_type === 'json' ? 100 : 50;
            if (sizeKb > maxKb) {
                return res.status(400).json({ error: `Content exceeds ${maxKb}KB limit` });
            }
        }

        const result = await pool.query(
            `INSERT INTO clipboard_items (owner_id, content_type, content_text, content_blob_url, expiry_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [req.userId, content_type, content_text || null, content_blob_url || null, expiry_at || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating item:', err);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// GET /api/items — List items with pagination and filters
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        let conditions = ['owner_id = $1', 'deleted_at IS NULL'];
        let params = [req.userId];
        let paramIndex = 2;

        // Filter by content type
        if (req.query.type) {
            conditions.push(`content_type = $${paramIndex}`);
            params.push(req.query.type);
            paramIndex++;
        }

        // Filter favorites
        if (req.query.favorites === 'true') {
            conditions.push('is_favorite = TRUE');
        }

        // Filter by date range
        if (req.query.from) {
            conditions.push(`created_at >= $${paramIndex}`);
            params.push(req.query.from);
            paramIndex++;
        }
        if (req.query.to) {
            conditions.push(`created_at <= $${paramIndex}`);
            params.push(req.query.to);
            paramIndex++;
        }

        const whereClause = conditions.join(' AND ');

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM clipboard_items WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get items
        const result = await pool.query(
            `SELECT * FROM clipboard_items 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            items: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// GET /api/items/:id — Get single item
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM clipboard_items WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`,
            [req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching item:', err);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// PUT /api/items/:id — Update item
router.put('/:id', async (req, res) => {
    try {
        const { content_text, expiry_at, is_favorite } = req.body;

        // Build update fields dynamically
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (content_text !== undefined) {
            updates.push(`content_text = $${paramIndex}`);
            params.push(content_text);
            paramIndex++;
        }
        if (expiry_at !== undefined) {
            updates.push(`expiry_at = $${paramIndex}`);
            params.push(expiry_at);
            paramIndex++;
        }
        if (is_favorite !== undefined) {
            updates.push(`is_favorite = $${paramIndex}`);
            params.push(is_favorite);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = NOW()');

        const result = await pool.query(
            `UPDATE clipboard_items 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} AND owner_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
            [...params, req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// DELETE /api/items/:id — Soft-delete item
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE clipboard_items 
       SET deleted_at = NOW() 
       WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
       RETURNING id`,
            [req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item deleted', id: result.rows[0].id });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

export default router;
