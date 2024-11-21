import React from 'react';
import { useArtStore } from '../store/artStore';
import { ArtistProfile } from '../components/ArtistProfile';
import { ArtworkGrid } from '../components/ArtworkGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';

// Eva's artist ID
const ARTIST_ID = '26ad1700-852f-43f2-9abe-46e8aa8596e3';

export function Gallery() {
  const { artworks, artist, isLoading, setArtworks, setArtist, setLoading } = useArtStore();
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the artist using proper filter syntax
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', ARTIST_ID)
        .maybeSingle();

      if (artistError) {
        console.error('Error fetching artist:', artistError);
        setError('Failed to fetch artist data');
        return;
      }

      if (!artistData) {
        console.error('No artist found with ID:', ARTIST_ID);
        setError('Artist not found');
        return;
      }

      setArtist(artistData);

      // Fetch artworks for this artist
      const { data: artworksData, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('artist_id', ARTIST_ID)
        .order('created_at', { ascending: false });

      if (artworksError) {
        console.error('Error fetching artworks:', artworksError);
        setError('Failed to fetch artwork data');
        return;
      }

      if (artworksData) {
        const processedArtworks = artworksData.map((artwork) => ({
          id: artwork.id,
          title: artwork.title,
          description: artwork.description,
          imageUrl: artwork.image_url,
          price: artwork.price,
          createdAt: artwork.created_at,
          isBlurred: true,
        }));
        setArtworks(processedArtworks);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [setArtist, setArtworks, setLoading]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {artist && <ArtistProfile artist={artist} />}
      
      <div className="container mx-auto px-4">
        <div className="text-right mb-4">
          <span className="text-sm text-gray-400">
            Total posts: {artworks.length}
          </span>
        </div>
        <ArtworkGrid artworks={artworks} />
      </div>
    </div>
  );
}