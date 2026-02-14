import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { clerkAuth, requireAuth } from './middleware/auth.js';
import itemsRouter from './routes/items.js';
import collectionsRouter from './routes/collections.js';
import qrRouter from './routes/qr.js';
import shareRouter from './routes/share.js';
import { startExpiryWorker } from './workers/expiry.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------
// Global Middleware
// ---------------------
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

// Rate limiting — 100 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Clerk auth — attach auth context to all requests
app.use(clerkAuth);

// ---------------------
// Public Routes
// ---------------------
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// QR retrieval is public (no auth)
app.get('/api/qr/:token', (req, res, next) => {
    // Forward to qr router's GET /:token handler
    req.url = `/${req.params.token}`;
    qrRouter(req, res, next);
});

// Shared notes — public (no auth)
app.use('/api/share', shareRouter);

// ---------------------
// Protected Routes
// ---------------------
app.use('/api/items', requireAuth, itemsRouter);
app.use('/api/collections', requireAuth, collectionsRouter);
app.use('/api/qr', requireAuth, qrRouter);

// ---------------------
// Error Handling
// ---------------------
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ---------------------
// Start
// ---------------------
app.listen(PORT, () => {
    console.log(`Clippy API running on http://localhost:${PORT}`);
    startExpiryWorker();
});

export default app;
