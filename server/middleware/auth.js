import { clerkMiddleware, getAuth } from '@clerk/express';
import pool from '../db.js';

// Clerk middleware — attach auth context to request
export const clerkAuth = clerkMiddleware();

// Require authentication and resolve internal user ID
export async function requireAuth(req, res, next) {
    try {
        const auth = getAuth(req);

        if (!auth || !auth.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const clerkId = auth.userId;

        // Upsert user — create on first request, return existing otherwise
        const result = await pool.query(
            `INSERT INTO users (clerk_id) 
       VALUES ($1) 
       ON CONFLICT (clerk_id) DO UPDATE SET clerk_id = EXCLUDED.clerk_id
       RETURNING id, email`,
            [clerkId]
        );

        req.userId = result.rows[0].id;
        req.userEmail = result.rows[0].email;
        req.clerkId = clerkId;

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({ error: 'Authentication failed' });
    }
}
