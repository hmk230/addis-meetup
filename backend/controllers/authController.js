const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const sanitize = (str) => (typeof str === 'string' ? str.trim() : '');
const isValidPhone = (p) => /^\+?[0-9]{7,15}$/.test(p.replace(/\s/g, ''));

const signup = async (req, res) => {
  try {
    const full_name = sanitize(req.body.full_name);
    const phone     = sanitize(req.body.phone);
    const age       = parseInt(req.body.age);
    const password  = req.body.password;

    if (!full_name || !phone || !age || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (full_name.length < 2 || full_name.length > 100)
      return res.status(400).json({ error: 'Full name must be 2-100 characters' });
    if (!isValidPhone(phone))
      return res.status(400).json({ error: 'Invalid phone number format' });
    if (isNaN(age) || age < 10 || age > 80)
      return res.status(400).json({ error: 'Age must be between 10 and 80' });
    if (typeof password !== 'string' || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const { data: existing } = await supabase
      .from('users').select('id').eq('phone', phone).single();
    if (existing) return res.status(409).json({ error: 'Phone number already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase.from('users').insert([
      { full_name, phone, age, password_hash, role: 'player' }
    ]).select('id, full_name, phone, age, role').single();

    if (error) return res.status(500).json({ error: 'Registration failed' });

    const token = jwt.sign(
      { id: data.id, role: data.role, full_name: data.full_name },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: data });
  } catch (e) {
    console.error('signup:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const phone    = sanitize(req.body.phone);
    const password = req.body.password;
    if (!phone || !password)
      return res.status(400).json({ error: 'Phone and password required' });

    const { data: user } = await supabase
      .from('users').select('*').eq('phone', phone).single();

    // Always run bcrypt to prevent timing-based user enumeration
    const dummyHash = '$2b$12$invalidhashfortimingprotectionXXXXXXXXXXXXXXXXXXXXXXXX';
    const valid = await bcrypt.compare(password, user?.password_hash || dummyHash);

    if (!user || !valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.id, full_name: user.full_name, phone: user.phone,
        age: user.age, role: user.role, must_change_password: user.must_change_password
      }
    });
  } catch (e) {
    console.error('login:', e);
    res.status(500).json({ error: 'Login failed' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (typeof new_password !== 'string' || new_password.length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.must_change_password) {
      if (!current_password) return res.status(400).json({ error: 'Current password required' });
      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await supabase.from('users').update({ password_hash, must_change_password: false }).eq('id', req.user.id);
    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    console.error('changePassword:', e);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase.from('users')
      .select('id, full_name, phone, age, role, avatar_url, created_at')
      .eq('id', req.user.id).single();
    if (error) return res.status(500).json({ error: 'Failed to load profile' });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const full_name = sanitize(req.body.full_name);
    const age = parseInt(req.body.age);
    if (full_name && (full_name.length < 2 || full_name.length > 100))
      return res.status(400).json({ error: 'Full name must be 2-100 characters' });
    if (age && (isNaN(age) || age < 10 || age > 80))
      return res.status(400).json({ error: 'Age must be between 10 and 80' });

    const { data, error } = await supabase.from('users')
      .update({ full_name, age }).eq('id', req.user.id)
      .select('id, full_name, phone, age, role').single();
    if (error) return res.status(500).json({ error: 'Update failed' });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
};

module.exports = { signup, login, changePassword, getProfile, updateProfile };
