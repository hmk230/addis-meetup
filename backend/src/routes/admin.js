const express = require('express');
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── DASHBOARD STATS ──────────────────────────────────────
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [gamesRes, bookingsRes, usersRes, pendingRes] = await Promise.all([
      supabase.from('games').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('bookings').select('id, total_amount, status', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'user'),
      supabase.from('bookings').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);

    const confirmedBookings = bookingsRes.data?.filter((b) => b.status === 'confirmed') || [];
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

    res.json({
      stats: {
        active_games: gamesRes.count || 0,
        total_bookings: bookingsRes.count || 0,
        total_users: usersRes.count || 0,
        pending_payments: pendingRes.count || 0,
        total_revenue: totalRevenue,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── GET ALL USERS ────────────────────────────────────────
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, phone, age, role, telegram_chat_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── PROMOTE USER TO ADMIN ────────────────────────────────
router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, full_name, role')
      .single();

    if (error) throw error;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

module.exports = router;
