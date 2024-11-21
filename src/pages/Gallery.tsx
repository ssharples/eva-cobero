import React from 'react';
import { useArtStore } from '../store/artStore';
import { ArtistProfile } from '../components/ArtistProfile';
import { ArtworkGrid } from '../components/ArtworkGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';

// Eva's artist ID
const ARTIST_ID = 'd9037f21-cf78-4e57-a6bd-f9df2c829b3d';

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Total Posts: {artworks.length}</h2>
        </div>

        {artist && <ArtistProfile artist={artist} />}
        <ArtworkGrid artworks={artworks} />
      </div>
    </div>
  );
}