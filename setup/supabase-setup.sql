-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for artwork images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');

INSERT INTO storage.buckets (id, name)
VALUES ('artworks', 'artworks')
ON CONFLICT DO NOTHING;

-- Create tables
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  instagram_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  artist_id UUID NOT NULL REFERENCES artists(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  artwork_id UUID NOT NULL REFERENCES artworks(id),
  purchase_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_intent_id TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending'
);

-- Create RLS policies
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Artists policies
CREATE POLICY "Allow public read access to artists"
ON public.artists FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow service role to manage artists"
ON public.artists
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Artworks policies
CREATE POLICY "Allow public read access to artworks"
ON public.artworks FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow service role to manage artworks"
ON public.artworks
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- User purchases policies
CREATE POLICY "Users can view their own purchases"
ON public.user_purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow service role to manage purchases"
ON public.user_purchases
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON public.artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON public.user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_artwork_id ON public.user_purchases(artwork_id);