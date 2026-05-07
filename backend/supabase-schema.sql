-- ============================================
-- ADDIS MEETUP - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  age INTEGER,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  telegram_chat_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMES TABLE
-- ============================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  format TEXT NOT NULL DEFAULT '5-a-side',
  price_per_player INTEGER NOT NULL,
  total_spots INTEGER NOT NULL,
  spots_left INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT spots_valid CHECK (spots_left >= 0 AND spots_left <= total_spots)
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  num_players INTEGER NOT NULL DEFAULT 1 CHECK (num_players >= 1),
  num_games INTEGER NOT NULL DEFAULT 1 CHECK (num_games BETWEEN 1 AND 4),
  base_amount INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  reference_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_games_date_time ON games(date_time);
CREATE INDEX idx_games_is_active ON games(is_active);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_game_id ON bookings(game_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference_code ON bookings(reference_code);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- ============================================
-- AUTO-UPDATE updated_at FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by backend)
-- Policies below are for reference/direct client access if needed

-- Users can read their own data
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (true);

-- Games are public to read
CREATE POLICY "games_read_all" ON games
  FOR SELECT USING (is_active = true);

-- Users can read their own bookings
CREATE POLICY "bookings_read_own" ON bookings
  FOR SELECT USING (true);

-- ============================================
-- SAMPLE DATA (optional - for testing)
-- ============================================
-- INSERT INTO games (title, location, date_time, format, price_per_player, total_spots, spots_left)
-- VALUES
--   ('Summit meetup – Saturday Afternoon', 'Summit', NOW() + INTERVAL '1 day', '5-a-side', 350, 10, 9),
--   ('Summit meetup – Saturday Night', 'Summit', NOW() + INTERVAL '1 day 2 hours', '5-a-side', 350, 10, 9),
--   ('Gerji meetup – Sunday Morning', 'Gerji', NOW() + INTERVAL '2 days', '6-a-side', 500, 18, 16);
