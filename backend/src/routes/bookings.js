const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateReferenceCode, calculatePrice } = require('../utils/helpers');
const { sendPaymentConfirmed } = require('../lib/telegram');

const router = express.Router();

// ── CREATE BOOKING ───────────────────────────────────────
router.post(
  '/',
  authenticate,
  [
    body('game_id').isUUID().withMessage('Valid game_id is required'),
    body('num_players').isInt({ min: 1 }).withMessage('num_players must be at least 1'),
    body('num_games').isInt({ min: 1, max: 4 }).withMessage('num_games must be 1-4'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { game_id, num_players, num_games } = req.body;

      // Get game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', game_id)
        .eq('is_active', true)
        .single();

      if (gameError || !game) {
        return res.status(404).json({ error: 'Game not found or inactive' });
      }

      // Check spots
      if (game.spots_left < num_players) {
        return res.status(400).json({
          error: `Only ${game.spots_left} spot(s) left`,
        });
      }

      // Check if user already booked this game
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('game_id', game_id)
        .neq('status', 'cancelled')
        .single();

      if (existingBooking) {
        return res.status(409).json({ error: 'You already have a booking for this game' });
      }

      // Calculate price
      const { baseAmount, discountPercent, discountAmount, totalAmount } = calculatePrice(
        game.price_per_player,
        num_players,
        num_games
      );

      const reference_code = generateReferenceCode();

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: req.user.id,
          game_id,
          num_players,
          num_games,
          base_amount: baseAmount,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          reference_code,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Reserve spots (decrement spots_left)
      await supabase
        .from('games')
        .update({ spots_left: game.spots_left - num_players })
        .eq('id', game_id);

      res.status(201).json({ booking, game });
    } catch (err) {
      console.error('Create booking error:', err);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
);

// ── GET MY BOOKINGS ──────────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        games (
          id, title, location, date_time, format, price_per_player
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ── GET SINGLE BOOKING ───────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        games (
          id, title, location, date_time, format, price_per_player
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only allow owner or admin
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// ── CANCEL BOOKING ───────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ error: 'Confirmed bookings cannot be cancelled' });
    }

    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id);

    // Restore spots
    await supabase.rpc('increment_spots', {
      game_id: booking.game_id,
      amount: booking.num_players,
    });

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ── ADMIN: GET ALL BOOKINGS ──────────────────────────────
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, game_id } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        users (id, full_name, phone, telegram_chat_id),
        games (id, title, location, date_time, format)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (game_id) query = query.eq('game_id', game_id);

    const { data: bookings, error } = await query;
    if (error) throw error;

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ── ADMIN: CONFIRM PAYMENT ───────────────────────────────
router.patch('/:id/confirm', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        users (id, full_name, telegram_chat_id),
        games (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ error: 'Already confirmed' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_by: req.user.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send Telegram notification to user
    if (booking.users?.telegram_chat_id) {
      await sendPaymentConfirmed(
        booking.users.telegram_chat_id,
        booking,
        booking.games
      );
    }

    res.json({ booking: updated });
  } catch (err) {
    console.error('Confirm booking error:', err);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

module.exports = router;
