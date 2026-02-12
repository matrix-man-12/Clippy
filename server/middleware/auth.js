import pool from '../db.js';

const hasClerk = !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);

let clerkMiddlewareFn = null;
let getAuthFn = null;

if (hasClerk) {
    try {
        const clerk = await import('@clerk/express');
        clerkMiddlewareFn = clerk.clerkMiddleware;
        getAuthFn = clerk.getAuth;
    } catch (err) {
        console.warn('Clerk SDK not available:', err.message);
    }
}

// Clerk middleware — attach auth context to request
// Passes through if Clerk is not configured
export const clerkAuth = clerkMiddlewareFn
    ? clerkMiddlewareFn()
    : (req, res, next) => next();

// Require authentication and resolve internal user ID
export async function requireAuth(req, res, next) {
    try {
        if (!hasClerk || !getAuthFn) {
            // Dev mode: create/use a default dev user
            const result = await pool.query(
                `INSERT INTO users (clerk_id)
                 VALUES ($1)
                 ON CONFLICT (clerk_id) DO UPDATE SET clerk_id = EXCLUDED.clerk_id
                 RETURNING id, email`,
                ['dev_user']
            );
            req.userId = result.rows[0].id;
            req.userEmail = result.rows[0].email;
            req.clerkId = 'dev_user';
            return next();
        }

        const auth = getAuthFn(req);

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
