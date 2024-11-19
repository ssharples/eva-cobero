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
        // Insert default artist if none exists
        const { data: existingArtist, error: checkError } = await supabase
          .from('artists')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (checkError) throw checkError;

        let artistData = existingArtist;

        if (!existingArtist) {
          const { data: newArtist, error: insertError } = await supabase
            .from('artists')
            .insert([
              {
                name: 'Sarah Mitchell',
                bio: 'Contemporary artist exploring the intersection of nature and urban life through vibrant, abstract compositions.',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
                instagram_url: 'https://instagram.com/sarahmitchellart',
                twitter_url: 'https://twitter.com/sarahmitchellart',
                website_url: 'https://sarahmitchellart.com'
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          artistData = newArtist;

          // Insert sample artworks for the new artist
          const { error: artworksError } = await supabase
            .from('artworks')
            .insert([
              {
                title: 'Urban Jungle',
                description: 'A vibrant exploration of city life intertwined with natural elements.',
                image_url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&q=80&w=800',
                price: 1.99,
                artist_id: artistData.id
              },
              {
                title: 'Neon Dreams',
                description: 'Abstract interpretation of nightlife through a prism of neon colors.',
                image_url: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=800',
                price: 1.99,
                artist_id: artistData.id
              },
              {
                title: 'Serenity',
                description: 'Calming blue tones merge with organic shapes to create a peaceful atmosphere.',
                image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=800',
                price: 1.99,
                artist_id: artistData.id
              }
            ]);

          if (artworksError) throw artworksError;
        }

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