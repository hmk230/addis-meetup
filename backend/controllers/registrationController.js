const supabase = require('../config/supabase');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_PLAYERS_PER_REG = 10;
const MAX_GAMES_PER_REG = 4;

// Tiered discount pricing:
// 1 game  = full price
// 2 games = save 25% of 1 game price
// 3 games = save 50% of 1 game price
// 4 games = save 50% of 1 game price
// Then multiply by player count
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
    // 1. Get the ID and remove any accidental spaces/hidden characters 
    const meetup_id = req.body.meetup_id?.toString().trim(); 
    const player_count = parseInt(req.body.player_count);
    const game_count   = parseInt(req.body.game_count) || 1;

    // 2. Simple check: Is there an ID and a player count? 
    if (!meetup_id || isNaN(player_count)) {
      return res.status(400).json({ error: 'Please provide a valid Meetup ID and Player Count' });
    }

    // 3. Just try to find the meetup in Supabase 
    const { data: meetup, error: fetchError } = await supabase
      .from('meetups')
      .select('*')
      .eq('id', meetup_id)
      .single();

    // If Supabase can't find it, it means the ID is wrong or doesn't exist
    if (fetchError || !meetup) {
      return res.status(404).json({ error: 'Meetup not found. Double-check the ID in Supabase.' });
    }

    // 4. Continue with your logic (check if full, calculate price, etc.) 
    if (meetup.status === 'closed' || meetup.spots_remaining < player_count) {
      return res.status(400).json({ error: 'This meetup is full or closed.' });
    }

    // ... rest of your insert logic remains the same ...
    const total_amount = calcTotal(meetup.price, game_count, player_count);
    const { data: reg, error: regErr } = await supabase.from('registrations').insert([{
      meetup_id,
      user_id: req.user.id,
      player_count,
      game_count,
      total_amount,
      payment_status: 'pending'
    }]).select().single();

    if (regErr) throw regErr;
    res.status(201).json(reg);

  } catch (e) {
    console.error('Registration Error:', e.message);
    res.status(500).json({ error: 'Could not complete registration.' });
  }
};

const uploadScreenshot = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/.test(id))
      return res.status(400).json({ error: 'Invalid registration ID' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype))
      return res.status(400).json({ error: 'Only image files are allowed (jpg, png, webp)' });

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
  } catch (e) {
    console.error('uploadScreenshot:', e);
    res.status(500).json({ error: 'Upload failed' });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, meetups(title, location, date_time, price)')
      .eq('user_id', req.user.id)
      .order('registered_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to load registrations' });
    const { data: settings } = await supabase.from('settings').select('*').limit(1).single();
    res.json({ registrations: data, payment_info: settings });
  } catch {
    res.status(500).json({ error: 'Failed to load registrations' });
  }
};

const getMeetupRegistrations = async (req, res) => {
  try {
    // 1. Try to find the ID in all possible places (url params or query string)
    const meetup_id = (req.params.meetup_id || req.params.id || req.query.meetup_id)?.toString().trim();

    if (!meetup_id || meetup_id === 'undefined' || meetup_id.startsWith(':')) {
      return res.status(400).json({ 
        error: "No ID detected in the URL.",
        details: "The backend expected an ID but received: " + meetup_id 
      });
    }

    // 2. Fetch from Supabase
    const { data, error } = await supabase
      .from('registrations')
      .select('*, users(full_name, phone, age)')
      .eq('meetup_id', meetup_id)
      .order('registered_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { payment_status } = req.body;
    const { id } = req.params;
    if (!['pending', 'approved', 'rejected'].includes(payment_status))
      return res.status(400).json({ error: 'Invalid status value' });
    if (!/^[0-9a-f-]{36}$/.test(id))
      return res.status(400).json({ error: 'Invalid registration ID' });
    const { data, error } = await supabase.from('registrations')
      .update({ payment_status }).eq('id', id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Registration not found' });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
};

module.exports = { register, uploadScreenshot, getMyRegistrations, getMeetupRegistrations, updateStatus };
