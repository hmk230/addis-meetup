-- ============================================================
-- Addis Meetup — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text unique not null,
  age int not null,
  password_hash text not null,
  role text default 'player',
  avatar_url text,
  must_change_password boolean default false,
  created_at timestamptz default now()
);

create table meetups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text not null,
  date_time timestamptz not null,
  max_players int not null,
  spots_remaining int not null,
  price numeric not null,
  status text default 'open',
  order_index int default 0,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid references meetups(id),
  user_id uuid references users(id),
  player_count int default 1,
  game_count int default 1,
  total_amount numeric,
  ref_code text,
  payment_screenshot_url text,
  payment_status text default 'pending',
  registered_at timestamptz default now()
);

create table settings (
  id uuid primary key default gen_random_uuid(),
  bank_name text,
  bank_account text,
  telebirr_number text,
  telegram_username text,
  updated_at timestamptz default now()
);
