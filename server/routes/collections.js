import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// POST /api/collections — Create a shared collection
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Collection name is required' });
        }

        const result = await pool.query(
            `INSERT INTO shared_collections (name, owner_id)
       VALUES ($1, $2)
       RETURNING *`,
            [name.trim(), req.userId]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating collection:', err);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

// GET /api/collections — List collections (owned + member of)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT sc.*, 
        CASE WHEN sc.owner_id = $1 THEN 'owner' ELSE cm.permission_level END AS role
       FROM shared_collections sc
       LEFT JOIN collection_members cm ON cm.collection_id = sc.id AND cm.user_id = $1
       WHERE sc.owner_id = $1 OR cm.user_id = $1
       ORDER BY sc.created_at DESC`,
            [req.userId]
        );

        res.json({ collections: result.rows });
    } catch (err) {
        console.error('Error fetching collections:', err);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

// POST /api/collections/:id/members — Invite member by email
router.post('/:id/members', async (req, res) => {
    try {
        const { email, permission_level } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const perm = permission_level || 'view';
        if (!['view', 'upload'].includes(perm)) {
            return res.status(400).json({ error: 'permission_level must be view or upload' });
        }

        // Verify requester is the collection owner
        const collection = await pool.query(
            `SELECT * FROM shared_collections WHERE id = $1 AND owner_id = $2`,
            [req.params.id, req.userId]
        );

        if (collection.rows.length === 0) {
            return res.status(403).json({ error: 'Only the collection owner can invite members' });
        }

        // Find user by email
        const user = await pool.query(
            `SELECT id FROM users WHERE email = $1`,
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found with that email' });
        }

        const memberId = user.rows[0].id;

        if (memberId === req.userId) {
            return res.status(400).json({ error: 'Cannot invite yourself' });
        }

        // Upsert member
        const result = await pool.query(
            `INSERT INTO collection_members (collection_id, user_id, permission_level)
       VALUES ($1, $2, $3)
       ON CONFLICT (collection_id, user_id) DO UPDATE SET permission_level = EXCLUDED.permission_level
       RETURNING *`,
            [req.params.id, memberId, perm]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inviting member:', err);
        res.status(500).json({ error: 'Failed to invite member' });
    }
});

// DELETE /api/collections/:id/members/:userId — Remove member
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        // Verify requester is the owner
        const collection = await pool.query(
            `SELECT * FROM shared_collections WHERE id = $1 AND owner_id = $2`,
            [req.params.id, req.userId]
        );

        if (collection.rows.length === 0) {
            return res.status(403).json({ error: 'Only the collection owner can remove members' });
        }

        const result = await pool.query(
            `DELETE FROM collection_members 
       WHERE collection_id = $1 AND user_id = $2
       RETURNING *`,
            [req.params.id, req.params.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json({ message: 'Member removed' });
    } catch (err) {
        console.error('Error removing member:', err);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// POST /api/collections/:id/items — Add item to collection
router.post('/:id/items', async (req, res) => {
    try {
        const { item_id } = req.body;

        if (!item_id) {
            return res.status(400).json({ error: 'item_id is required' });
        }

        // Check collection access (owner or member with upload permission)
        const access = await pool.query(
            `SELECT 'owner' AS role FROM shared_collections WHERE id = $1 AND owner_id = $2
       UNION
       SELECT permission_level AS role FROM collection_members WHERE collection_id = $1 AND user_id = $2`,
            [req.params.id, req.userId]
        );

        if (access.rows.length === 0) {
            return res.status(403).json({ error: 'No access to this collection' });
        }

        const hasUpload = access.rows.some(r => r.role === 'owner' || r.role === 'upload');
        if (!hasUpload) {
            return res.status(403).json({ error: 'View-only members cannot add items' });
        }

        // Verify item belongs to the requester
        const item = await pool.query(
            `SELECT id FROM clipboard_items WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`,
            [item_id, req.userId]
        );

        if (item.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const result = await pool.query(
            `INSERT INTO collection_items (collection_id, item_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING *`,
            [req.params.id, item_id]
        );

        res.status(201).json({ message: 'Item added to collection', collection_id: req.params.id, item_id });
    } catch (err) {
        console.error('Error adding item to collection:', err);
        res.status(500).json({ error: 'Failed to add item to collection' });
    }
});

// GET /api/collections/:id/items — List items in a collection
router.get('/:id/items', async (req, res) => {
    try {
        // Check collection access
        const access = await pool.query(
            `SELECT 'owner' AS role FROM shared_collections WHERE id = $1 AND owner_id = $2
       UNION
       SELECT permission_level AS role FROM collection_members WHERE collection_id = $1 AND user_id = $2`,
            [req.params.id, req.userId]
        );

        if (access.rows.length === 0) {
            return res.status(403).json({ error: 'No access to this collection' });
        }

        const result = await pool.query(
            `SELECT ci.* FROM clipboard_items ci
       INNER JOIN collection_items cit ON cit.item_id = ci.id
       WHERE cit.collection_id = $1 AND ci.deleted_at IS NULL
       ORDER BY ci.created_at DESC`,
            [req.params.id]
        );

        res.json({ items: result.rows });
    } catch (err) {
        console.error('Error fetching collection items:', err);
        res.status(500).json({ error: 'Failed to fetch collection items' });
    }
});

export default router;
