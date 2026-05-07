const supabase = require('../config/supabase');

const getAllMeetups = async (req, res) => {
  const { data, error } = await supabase
    .from('meetups')
    .select('*')
    .order('order_index', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const getMeetup = async (req, res) => {
  const { data, error } = await supabase
    .from('meetups').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Meetup not found' });
  res.json(data);
};

const createMeetup = async (req, res) => {
  const { title, description, location, date_time, max_players, price } = req.body;
  if (!title || !location || !date_time || !max_players || price === undefined)
    return res.status(400).json({ error: 'Missing required fields' });

  // Get max order_index
  const { data: last } = await supabase
    .from('meetups').select('order_index').order('order_index', { ascending: false }).limit(1);
  const order_index = last && last.length > 0 ? last[0].order_index + 1 : 0;

  const { data, error } = await supabase.from('meetups').insert([{
    title, description, location, date_time, max_players: parseInt(max_players),
    spots_remaining: parseInt(max_players), price: parseFloat(price),
    status: 'open', order_index, created_by: req.user.id
  }]).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

const updateMeetup = async (req, res) => {
  const { title, description, location, date_time, max_players, price } = req.body;
  const { data, error } = await supabase.from('meetups')
    .update({ title, description, location, date_time, max_players: parseInt(max_players), price: parseFloat(price) })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const deleteMeetup = async (req, res) => {
  // Cascade delete registrations first
  await supabase.from('registrations').delete().eq('meetup_id', req.params.id);
  const { error } = await supabase.from('meetups').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Meetup and all registrations deleted' });
};

const closeMeetup = async (req, res) => {
  const { data, error } = await supabase.from('meetups')
    .update({ status: 'closed' }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const reorderMeetups = async (req, res) => {
  const { order } = req.body; // array of { id, order_index }
  const updates = order.map(({ id, order_index }) =>
    supabase.from('meetups').update({ order_index }).eq('id', id)
  );
  await Promise.all(updates);
  res.json({ message: 'Order updated' });
};

const exportAttendance = async (req, res) => {
  const { data, error } = await supabase
    .from('registrations')
    .select('*, users(full_name, phone, age)')
    .eq('meetup_id', req.params.id)
    .eq('payment_status', 'approved');

  if (error) return res.status(500).json({ error: error.message });

  const { data: meetup } = await supabase.from('meetups').select('title').eq('id', req.params.id).single();

  const rows = data.map(r => ({
    Name: r.users?.full_name || '',
    Phone: r.users?.phone || '',
    Age: r.users?.age || '',
    Players: r.player_count,
    Status: r.payment_status,
    'Registered At': new Date(r.registered_at).toLocaleString()
  }));

  const headers = ['Name', 'Phone', 'Age', 'Players', 'Status', 'Registered At'];
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${meetup?.title || 'meetup'}-attendance.csv"`);
  res.send(csv);
};

module.exports = { getAllMeetups, getMeetup, createMeetup, updateMeetup, deleteMeetup, closeMeetup, reorderMeetups, exportAttendance };
