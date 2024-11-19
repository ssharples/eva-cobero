import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Artist, Artwork } from '../types';

export function useArtist(artistId: string) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchArtist() {
      try {
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artistId)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (data) {
          setArtist({
            name: data.name,
            bio: data.bio,
            avatarUrl: data.avatar_url,
            socialLinks: {
              instagram: data.instagram_url,
              twitter: data.twitter_url,
              website: data.website_url,
            },
          });
        }
      } catch (err) {
        console.error('Error fetching artist:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch artist'));
      } finally {
        setLoading(false);
      }
    }

    fetchArtist();
  }, [artistId]);

  return { artist, loading, error };
}

export function useArtworks(artistId: string) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchArtworks() {
      try {
        const { data, error } = await supabase
          .from('artworks')
          .select('*')
          .eq('artist_id', artistId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (data) {
          setArtworks(
            data.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              imageUrl: item.image_url,
              price: item.price,
              createdAt: item.created_at,
              isBlurred: true,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching artworks:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch artworks'));
      } finally {
        setLoading(false);
      }
    }

    fetchArtworks();
  }, [artistId]);

  return { artworks, loading, error };
}