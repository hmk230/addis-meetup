require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const bookingsRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();

// ── SECURITY ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://web.telegram.org',
    /\.telegram\.org$/,
    // Allow local dev
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
}));

// ── RATE LIMITING ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again later.' },
});

app.use(limiter);
app.use(express.json());

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Addis Meetup API', timestamp: new Date().toISOString() });
});

// ── ROUTES ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── ERROR HANDLER ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── START ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Addis Meetup API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
