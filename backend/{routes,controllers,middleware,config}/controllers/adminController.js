const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const getAllUsers = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, phone, age, role, created_at, must_change_password')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const resetUserPassword = async (req, res) => {
  const { new_password } = req.body;
  if (!new_password) return res.status(400).json({ error: 'New password required' });

  const password_hash = await bcrypt.hash(new_password, 10);
  const { error } = await supabase.from('users')
    .update({ password_hash, must_change_password: true })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Password reset. User must change on next login.' });
};

const getSettings = async (req, res) => {
  const { data } = await supabase.from('settings').select('*').limit(1).single();
  res.json(data || {});
};

const updateSettings = async (req, res) => {
  const { bank_name, bank_account, telebirr_number, telegram_username } = req.body;
  const { data: existing } = await supabase.from('settings').select('id').limit(1).single();

  let result;
  if (existing) {
    const { data } = await supabase.from('settings')
      .update({ bank_name, bank_account, telebirr_number, telegram_username, updated_at: new Date() })
      .eq('id', existing.id).select().single();
    result = data;
  } else {
    const { data } = await supabase.from('settings')
      .insert([{ bank_name, bank_account, telebirr_number, telegram_username }]).select().single();
    result = data;
  }
  res.json(result);
};

module.exports = { getAllUsers, resetUserPassword, getSettings, updateSettings };
