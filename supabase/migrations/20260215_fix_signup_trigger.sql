-- ============================================================================
-- Migration: 20260214_fix_signup_trigger.sql
-- Description: Fix "Database error saving new user" bug
--
-- ROOT CAUSE: Migration 013 created handle_new_user() trigger that inserts
-- tier='free' into subscriptions. Migration 022 recreated the subscriptions
-- table with CHECK (tier IN ('pro', 'max')) — 'free' is no longer valid.
-- The old trigger fires on signup and hits the constraint violation.
--
-- FIX: Update handle_new_user() to only create user_profiles row (remove
-- the subscriptions insert). The profiles table + handle_new_user_profile()
-- from migration 022 already handles tier tracking for new users.
-- ============================================================================

-- Fix the handle_new_user function: remove the subscriptions insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, country)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        'US'
    )
    ON CONFLICT (id) DO NOTHING;

    -- NOTE: We no longer insert into subscriptions here.
    -- Migration 022 changed subscriptions to only allow tier IN ('pro', 'max').
    -- Free tier is now tracked via the profiles table (handle_new_user_profile trigger).

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
