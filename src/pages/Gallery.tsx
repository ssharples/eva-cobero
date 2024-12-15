import React, { useState } from 'react';
import { useArtStore } from '../store/artStore';
import { ArtistProfile } from '../components/ArtistProfile';
import { ArtworkGrid } from '../components/ArtworkGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { AuthModal } from '../components/AuthModal';
import { SubscriptionOffer } from '../components/SubscriptionOffer';
import { Crown } from 'lucide-react';

// Eva's artist ID
const ARTIST_ID = '26ad1700-852f-43f2-9abe-46e8aa8596e3';

export function Gallery() {
  const { artworks, artist, isLoading, setArtworks, setArtist, setLoading } = useArtStore();
  const [error, setError] = React.useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { user, subscription } = useAuth();

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
          isBlurred: !user || subscription?.status !== 'active',
        }));
        setArtworks(processedArtworks);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [setArtist, setArtworks, setLoading, user, subscription]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => user ? setShowSubscriptionModal(true) : setShowAuthModal(true)}
          className="p-2 rounded-full bg-primary hover:bg-primary/90 transition-colors"
          title={user ? 'Manage Subscription' : 'Sign up for Premium'}
        >
          <Crown className={`w-6 h-6 ${subscription ? 'text-yellow-400' : 'text-white'}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex justify-end p-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Sign In
          </button>
        )}
      </div>

      {artist && <ArtistProfile artist={artist} />}
      
      <SubscriptionOffer />

      <div className="container mx-auto px-4">
        <div className="text-right mb-4">
          <span className="text-sm text-gray-400">
            Total posts: {artworks.length}
          </span>
        </div>
        <ArtworkGrid artworks={artworks} />
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showSubscriptionModal && (
        <SubscriptionOffer onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  );
}