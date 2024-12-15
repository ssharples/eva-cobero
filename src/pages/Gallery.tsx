import React, { useState, useEffect } from 'react';
import { useArtStore } from '../store/artStore';
import { ArtistProfile } from '../components/ArtistProfile';
import { ArtworkGrid } from '../components/ArtworkGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { AuthModal } from '../components/AuthModal';
import { SubscriptionOffer } from '../components/SubscriptionOffer';
import { AccountMenu } from '../components/AccountMenu';

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

  // Show subscription offer after 30 seconds
  useEffect(() => {
    if (!user && !subscription) {
      const timer = setTimeout(() => {
        setShowSubscriptionModal(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [user, subscription]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Account Menu */}
        <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
          <AccountMenu
            onShowAuth={() => setShowAuthModal(true)}
            onShowSubscription={() => setShowSubscriptionModal(true)}
          />
        </div>

        {/* Artist Profile */}
        {artist && (
          <div className="backdrop-blur-lg bg-white/5 rounded-2xl p-6 mb-8 shadow-xl">
            <ArtistProfile artist={artist} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="backdrop-blur-lg bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl my-4">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <LoadingSpinner />
          </div>
        ) : (
          /* Artwork Grid */
          artworks && (
            <div className="backdrop-blur-lg bg-white/5 rounded-2xl p-4 md:p-6">
              <ArtworkGrid artworks={artworks} />
            </div>
          )
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          if (showSubscriptionModal) {
            setShowSubscriptionModal(true);
          }
        }}
      />

      {/* Subscription Modal */}
      <SubscriptionOffer
        show={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
}