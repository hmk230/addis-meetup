const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ── Security headers (hides Express, sets CSP, etc.) ──────────────────────────
app.use(helmet());

// ── CORS: only allow your frontend ────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : [];

// Change lines 20-21 in index.js
app.use(cors({
  origin: (origin, cb) => {
    // Allow browsers and local testing to see the API
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body size limit ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Global rate limiter: 100 req / 15 min per IP ──────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Auth routes get a tighter limiter: 10 attempts / 15 min ──────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetups', require('./routes/meetups'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/admin', require('./routes/admin'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── Global error handler (never leak stack traces) ────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Addis Meetup API running on port ${PORT}`));
