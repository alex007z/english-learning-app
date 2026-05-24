-- ====================================================================
-- GLASSMORPHIC ENGLISH LEARNING APP - SUPABASE SCHEMA
-- ====================================================================
-- Run this script in your Supabase project's SQL Editor (https://supabase.com)
-- to instantly set up your tables, security policies, and seed data.

-- 1. Create the Profiles table (Tracks the 2 learning accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    avatar_url TEXT NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Lesson Progress table (Tracks scores per lesson per user)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    score INTEGER DEFAULT 0 NOT NULL,
    xp_earned INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, lesson_id),
    CONSTRAINT valid_lesson_id CHECK (lesson_id IN (1, 2, 3)),
    CONSTRAINT valid_score CHECK (score BETWEEN 0 AND 100)
);

-- 3. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policies for public client-side access.
-- Since this is a simple local educational app, we enable full CRUD access via the public Anon Key.
-- This ensures zero setup friction!

-- Profiles policies
DROP POLICY IF EXISTS "Allow public access to profiles" ON public.profiles;
CREATE POLICY "Allow public access to profiles" ON public.profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Lesson progress policies
DROP POLICY IF EXISTS "Allow public access to lesson progress" ON public.lesson_progress;
CREATE POLICY "Allow public access to lesson progress" ON public.lesson_progress
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Seed default profiles for Emma and Alex
INSERT INTO public.profiles (name, avatar_url, xp)
VALUES 
    ('Emma', '👩‍🎓', 0),
    ('Alex', '👨‍💻', 0)
ON CONFLICT (name) DO NOTHING;
