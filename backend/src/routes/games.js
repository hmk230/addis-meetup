const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── GET ALL UPCOMING GAMES (public) ─────────────────────
router.get('/', async (req, res) => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true });

    if (error) throw error;
    res.json({ games });
  } catch (err) {
    console.error('Get games error:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// ── GET SINGLE GAME ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// ── CREATE GAME (admin only) ─────────────────────────────
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('date_time').isISO8601().withMessage('Valid date_time is required'),
    body('format').trim().notEmpty().withMessage('Format is required'),
    body('price_per_player').isInt({ min: 1 }).withMessage('Price must be positive'),
    body('total_spots').isInt({ min: 2 }).withMessage('Total spots must be at least 2'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, location, date_time, format, price_per_player, total_spots } = req.body;

      const { data: game, error } = await supabase
        .from('games')
        .insert({
          title,
          location,
          date_time,
          format,
          price_per_player,
          total_spots,
          spots_left: total_spots,
          created_by: req.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ game });
    } catch (err) {
      console.error('Create game error:', err);
      res.status(500).json({ error: 'Failed to create game' });
    }
  }
);

// ── UPDATE GAME (admin only) ─────────────────────────────
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const allowed = ['title', 'location', 'date_time', 'format', 'price_per_player', 'total_spots', 'is_active'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const { data: game, error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// ── DELETE GAME (admin only) ─────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await supabase
      .from('games')
      .update({ is_active: false })
      .eq('id', req.params.id);

    res.json({ message: 'Game deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

module.exports = router;
