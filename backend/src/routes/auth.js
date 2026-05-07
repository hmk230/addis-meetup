const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');
const { formatPhone } = require('../utils/helpers');
const { sendPasswordResetToken, sendWelcomeMessage } = require('../lib/telegram');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── SIGN UP ──────────────────────────────────────────────
router.post(
  '/signup',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('age').optional().isInt({ min: 10, max: 100 }).withMessage('Invalid age'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { full_name, phone, age, password, telegram_chat_id } = req.body;
      const formattedPhone = formatPhone(phone);

      // Check if phone already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Phone number already registered' });
      }

      const password_hash = await bcrypt.hash(password, 12);

      // Check if this phone is the designated admin
      const isAdmin = formattedPhone === process.env.ADMIN_PHONE;

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          full_name,
          phone: formattedPhone,
          age: age || null,
          password_hash,
          role: isAdmin ? 'admin' : 'user',
          telegram_chat_id: telegram_chat_id || null,
        })
        .select('id, full_name, phone, age, role, telegram_chat_id')
        .single();

      if (error) throw error;

      // Send welcome message on Telegram if chat_id provided
      if (telegram_chat_id) {
        await sendWelcomeMessage(telegram_chat_id, full_name);
      }

      const token = signToken(user.id);
      res.status(201).json({ token, user });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Server error during signup' });
    }
  }
);

// ── LOG IN ───────────────────────────────────────────────
router.post(
  '/login',
  [
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { phone, password, telegram_chat_id } = req.body;
      const formattedPhone = formatPhone(phone);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', formattedPhone)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid phone or password' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid phone or password' });
      }

      // Update telegram_chat_id if provided (user opened via Telegram)
      if (telegram_chat_id && user.telegram_chat_id !== telegram_chat_id) {
        await supabase
          .from('users')
          .update({ telegram_chat_id })
          .eq('id', user.id);
      }

      const token = signToken(user.id);
      const { password_hash, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login' });
    }
  }
);

// ── ME (get current user) ────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// ── FORGOT PASSWORD ──────────────────────────────────────
router.post(
  '/forgot-password',
  [body('phone').trim().notEmpty().withMessage('Phone is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { phone } = req.body;
      const formattedPhone = formatPhone(phone);

      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, telegram_chat_id')
        .eq('phone', formattedPhone)
        .single();

      // Always return success to prevent phone enumeration
      if (!user) {
        return res.json({
          message: 'If that number exists, a reset code has been sent on Telegram.',
        });
      }

      if (!user.telegram_chat_id) {
        return res.status(400).json({
          error: 'No Telegram account linked. Please open the app via the Telegram bot first.',
        });
      }

      // Invalidate old tokens
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('user_id', user.id)
        .eq('used', false);

      // Generate 6-digit code
      const token = crypto.randomInt(100000, 999999).toString();
      const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

      await supabase.from('password_reset_tokens').insert({
        user_id: user.id,
        token,
        expires_at,
      });

      await sendPasswordResetToken(user.telegram_chat_id, token);

      res.json({
        message: 'If that number exists, a reset code has been sent on Telegram.',
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ── RESET PASSWORD ───────────────────────────────────────
router.post(
  '/reset-password',
  [
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('token').trim().notEmpty().withMessage('Reset code is required'),
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { phone, token, new_password } = req.body;
      const formattedPhone = formatPhone(phone);

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      if (!user) {
        return res.status(400).json({ error: 'Invalid reset code' });
      }

      const { data: resetToken } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired reset code' });
      }

      const password_hash = await bcrypt.hash(new_password, 12);

      await supabase
        .from('users')
        .update({ password_hash })
        .eq('id', user.id);

      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', resetToken.id);

      res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ── UPDATE TELEGRAM CHAT ID ──────────────────────────────
router.patch('/telegram-chat-id', authenticate, async (req, res) => {
  try {
    const { telegram_chat_id } = req.body;
    if (!telegram_chat_id) {
      return res.status(400).json({ error: 'telegram_chat_id is required' });
    }

    await supabase
      .from('users')
      .update({ telegram_chat_id })
      .eq('id', req.user.id);

    res.json({ message: 'Telegram linked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
