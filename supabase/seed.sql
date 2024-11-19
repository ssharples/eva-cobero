-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create artists table
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

-- Create artworks table
CREATE TABLE IF NOT EXISTS public.artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    artist_id UUID NOT NULL REFERENCES artists(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_purchases table
CREATE TABLE IF NOT EXISTS public.user_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    artwork_id UUID NOT NULL REFERENCES artworks(id),
    purchase_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL
);

-- Enable RLS
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to artists"
ON public.artists FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access to artworks"
ON public.artworks FOR SELECT
TO public
USING (true);

-- Insert sample artist with UUID
DO $$
DECLARE
    artist_uuid UUID;
BEGIN
    INSERT INTO public.artists (name, bio, avatar_url, instagram_url, twitter_url, website_url)
    VALUES (
        'Sarah Mitchell',
        'Contemporary artist exploring the intersection of nature and urban life through vibrant, abstract compositions.',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
        'https://instagram.com/sarahmitchellart',
        'https://twitter.com/sarahmitchellart',
        'https://sarahmitchellart.com'
    )
    RETURNING id INTO artist_uuid;

    -- Insert sample artworks with the new artist UUID
    INSERT INTO public.artworks (title, description, image_url, price, artist_id)
    VALUES
        (
            'Urban Jungle',
            'A vibrant exploration of city life intertwined with natural elements.',
            'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&q=80&w=800',
            1.99,
            artist_uuid
        ),
        (
            'Neon Dreams',
            'Abstract interpretation of nightlife through a prism of neon colors.',
            'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=800',
            1.99,
            artist_uuid
        ),
        (
            'Serenity',
            'Calming blue tones merge with organic shapes to create a peaceful atmosphere.',
            'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=800',
            1.99,
            artist_uuid
        );
END $$;