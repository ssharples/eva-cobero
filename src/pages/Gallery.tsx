import React from 'react';
import { ArtistProfile } from '../components/ArtistProfile';
import { ArtworkGrid } from '../components/ArtworkGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useArtStore } from '../store/artStore';
import { supabase } from '../lib/supabase';

export const Gallery: React.FC = () => {
  const { artworks, artist, isLoading, setArtworks, setArtist, setLoading } = useArtStore();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Get the first artist
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .limit(1)
          .single();

        if (artistError) throw artistError;

        if (artistData) {
          setArtist({
            name: artistData.name,
            bio: artistData.bio,
            avatarUrl: artistData.avatar_url,
            socialLinks: {
              instagram: artistData.instagram_url,
              twitter: artistData.twitter_url,
              website: artistData.website_url,
            },
          });

          // Get artworks for this artist
          const { data: artworksData, error: artworksError } = await supabase
            .from('artworks')
            .select('*')
            .eq('artist_id', artistData.id)
            .order('created_at', { ascending: false });

          if (artworksError) throw artworksError;

          if (artworksData) {
            setArtworks(
              artworksData.map((item) => ({
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
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [setArtist, setArtworks, setLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {artist && <ArtistProfile artist={artist} />}
      <ArtworkGrid artworks={artworks} />
    </div>
  );
};