const express = require(‘express’);
const cors = require(‘cors’);
const helmet = require(‘helmet’);
const rateLimit = require(‘express-rate-limit’);
require(‘dotenv’).config();

const app = express();

// Security headers
app.use(helmet());

// CORS — allow all origins if FRONTEND_URL not set, otherwise restrict
const FRONTEND_URL = process.env.FRONTEND_URL || ‘’;
app.use(cors({
origin: FRONTEND_URL ? FRONTEND_URL.split(’,’).map(o => o.trim()) : ‘*’,
credentials: true,
}));

// Body limit
app.use(express.json({ limit: ‘10kb’ }));

// Rate limiter — global
app.use(rateLimit({
windowMs: 15 * 60 * 1000,
max: 100,
standardHeaders: true,
legacyHeaders: false,
message: { error: ‘Too many requests, please try again later.’ },
}));

// Tighter limiter for auth
const authLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 20,
message: { error: ‘Too many login attempts, please try again in 15 minutes.’ },
});
app.use(’/api/auth/login’, authLimiter);
app.use(’/api/auth/signup’, authLimiter);

// Routes
app.use(’/api/auth’, require(’./routes/auth’));
app.use(’/api/meetups’, require(’./routes/meetups’));
app.use(’/api/registrations’, require(’./routes/registrations’));
app.use(’/api/admin’, require(’./routes/admin’));

app.get(’/health’, (_, res) => res.json({ status: ‘ok’ }));

// Global error handler
app.use((err, req, res, _next) => {
console.error(err.message);
res.status(err.status || 500).json({ error: ‘Something went wrong.’ });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Addis Meetup API running on port ${PORT}`));