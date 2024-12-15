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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: artistData } = await supabase
          .from('artists')
          .select('*')
          .eq('id', ARTIST_ID)
          .single();

        const { data: artworksData } = await supabase
          .from('artworks')
          .select('*')
          .eq('artist_id', ARTIST_ID);

        setArtist(artistData);
        setArtworks(artworksData);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setArtworks, setArtist, setLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none" />

      <header className="relative container mx-auto px-4 py-8 flex flex-col items-center text-center">
        {artist && (
          <div className="backdrop-blur-lg bg-white/5 rounded-2xl p-6 mb-8 shadow-xl w-full max-w-2xl">
            <img src={artist.profilePicture} alt={artist.name} className="w-24 h-24 rounded-full mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">{artist.name}</h1>
            <p className="text-gray-300 mb-4">{artist.bio}</p>
            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                Follow
              </button>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Subscribe
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative container mx-auto px-4 py-8">
        {/* Account Menu */}
        <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
          <AccountMenu
            onShowAuth={() => setShowAuthModal(true)}
            onShowSubscription={() => setShowSubscriptionModal(true)}
          />
        </div>

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
      </main>

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