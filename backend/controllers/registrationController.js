const supabase = require(’../config/supabase’);

const ALLOWED_MIME_TYPES = [‘image/jpeg’, ‘image/png’, ‘image/webp’, ‘image/gif’];
const MAX_PLAYERS_PER_REG = 10;
const MAX_GAMES_PER_REG = 4;

function calcTotal(basePrice, games, players) {
let perPlayerTotal;
if (games === 1)      perPlayerTotal = basePrice;
else if (games === 2) perPlayerTotal = basePrice * 2 - basePrice * 0.25;
else if (games === 3) perPlayerTotal = basePrice * 3 - basePrice * 0.50;
else if (games === 4) perPlayerTotal = basePrice * 4 - basePrice * 0.50;
else                  perPlayerTotal = basePrice * games;
return Math.round(perPlayerTotal * players * 100) / 100;
}

const register = async (req, res) => {
try {
const meetup_id    = req.body.meetup_id;
const player_count = parseInt(req.body.player_count);
const game_count   = parseInt(req.body.game_count) || 1;

```
if (!meetup_id || isNaN(player_count))
  return res.status(400).json({ error: 'Missing or invalid fields' });
if (player_count < 1 || player_count > MAX_PLAYERS_PER_REG)
  return res.status(400).json({ error: `Player count must be 1–${MAX_PLAYERS_PER_REG}` });
if (game_count < 1 || game_count > MAX_GAMES_PER_REG)
  return res.status(400).json({ error: `Game count must be 1–${MAX_GAMES_PER_REG}` });

// No UUID regex check — Supabase handles invalid IDs gracefully
const { data: meetup } = await supabase.from('meetups').select('*').eq('id', meetup_id).single();
if (!meetup) return res.status(404).json({ error: 'Meetup not found' });
if (meetup.status === 'closed') return res.status(400).json({ error: 'Meetup is closed' });
if (meetup.spots_remaining < player_count)
  return res.status(400).json({ error: 'Not enough spots remaining' });

const { data: existing } = await supabase.from('registrations')
  .select('id').eq('meetup_id', meetup_id).eq('user_id', req.user.id).single();
if (existing) return res.status(409).json({ error: 'You are already registered for this meetup' });

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
let ref_code = 'AFM-';
for (let i = 0; i < 4; i++) ref_code += chars[Math.floor(Math.random() * chars.length)];

const total_amount = calcTotal(meetup.price, game_count, player_count);

const { data, error } = await supabase.from('registrations').insert([{
  meetup_id,
  user_id: req.user.id,
  player_count,
  game_count,
  total_amount,
  ref_code,
  payment_status: 'pending'
}]).select().single();

if (error) return res.status(500).json({ error: 'Registration failed' });

const newSpots = meetup.spots_remaining - player_count;
await supabase.from('meetups').update({
  spots_remaining: newSpots,
  ...(newSpots <= 0 ? { status: 'closed' } : {})
}).eq('id', meetup_id);

const { data: settings } = await supabase.from('settings').select('*').limit(1).single();
res.status(201).json({ registration: data, payment_info: settings });
```

} catch (e) {
console.error(‘register:’, e);
res.status(500).json({ error: ‘Registration failed’ });
}
};

const uploadScreenshot = async (req, res) => {
try {
const { id } = req.params;
const file = req.file;
if (!file) return res.status(400).json({ error: ‘No file uploaded’ });
if (!ALLOWED_MIME_TYPES.includes(file.mimetype))
return res.status(400).json({ error: ‘Only image files are allowed (jpg, png, webp)’ });

```
const { data: reg } = await supabase.from('registrations')
  .select('id').eq('id', id).eq('user_id', req.user.id).single();
if (!reg) return res.status(403).json({ error: 'Registration not found or access denied' });

const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
const fileName = `screenshots/${req.user.id}_${id}_${Date.now()}.${ext}`;

const { error: uploadError } = await supabase.storage
  .from('payments').upload(fileName, file.buffer, { contentType: file.mimetype });
if (uploadError) return res.status(500).json({ error: 'Upload failed' });

const { data: urlData } = supabase.storage.from('payments').getPublicUrl(fileName);
await supabase.from('registrations')
  .update({ payment_screenshot_url: urlData.publicUrl })
  .eq('id', id).eq('user_id', req.user.id);

res.json({ url: urlData.publicUrl });
```

} catch (e) {
console.error(‘uploadScreenshot:’, e);
res.status(500).json({ error: ‘Upload failed’ });
}
};

const getMyRegistrations = async (req, res) => {
try {
const { data, error } = await supabase
.from(‘registrations’)
.select(’*, meetups(title, location, date_time, price)’)
.eq(‘user_id’, req.user.id)
.order(‘registered_at’, { ascending: false });
if (error) return res.status(500).json({ error: ‘Failed to load registrations’ });
const { data: settings } = await supabase.from(‘settings’).select(’*’).limit(1).single();
res.json({ registrations: data, payment_info: settings });
} catch {
res.status(500).json({ error: ‘Failed to load registrations’ });
}
};

const getMeetupRegistrations = async (req, res) => {
try {
const { meetup_id } = req.params;
const { data, error } = await supabase
.from(‘registrations’)
.select(’*, users(full_name, phone, age)’)
.eq(‘meetup_id’, meetup_id)
.order(‘registered_at’, { ascending: false });
if (error) return res.status(500).json({ error: ‘Failed to load registrations’ });
res.json(data);
} catch {
res.status(500).json({ error: ‘Failed to load registrations’ });
}
};

const updateStatus = async (req, res) => {
try {
const { payment_status } = req.body;
const { id } = req.params;
if (![‘pending’, ‘approved’, ‘rejected’].includes(payment_status))
return res.status(400).json({ error: ‘Invalid status value’ });
const { data, error } = await supabase.from(‘registrations’)
.update({ payment_status }).eq(‘id’, id).select().single();
if (error || !data) return res.status(404).json({ error: ‘Registration not found’ });
res.json(data);
} catch {
res.status(500).json({ error: ‘Update failed’ });
}
};

module.exports = { register, uploadScreenshot, getMyRegistrations, getMeetupRegistrations, updateStatus };