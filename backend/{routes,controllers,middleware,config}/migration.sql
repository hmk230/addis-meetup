-- ============================================================
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- This adds the new columns needed for tiered pricing
-- ============================================================

alter table registrations
  add column if not exists game_count int default 1,
  add column if not exists total_amount numeric,
  add column if not exists ref_code text;
