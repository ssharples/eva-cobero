import React from 'react';
import { useInView } from 'react-intersection-observer';
import { Lock } from 'lucide-react';
import { Artwork } from '../types';
import { PurchaseButton } from './PurchaseButton';
import { LifetimeAccessOffer } from './LifetimeAccessOffer';
import { useArtStore } from '../store/artStore';

interface ArtworkCardProps {
  artwork: Artwork;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [error, setError] = React.useState<string | null>(null);
  const [showLifetimeOffer, setShowLifetimeOffer] = React.useState(false);
  const updateArtwork = useArtStore((state) => state.updateArtwork);

  const handlePurchaseSuccess = () => {
    updateArtwork(artwork.id, { isBlurred: false });
    // Show lifetime offer after successful single purchase
    setShowLifetimeOffer(true);
  };

  const handlePurchaseError = (error: Error) => {
    setError(error.message);
    console.error('Purchase error:', error);
  };

  return (
    <>
      <div
        ref={ref}
        className={`relative group transition-opacity duration-700 ${
          inView ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative aspect-w-3 aspect-h-4 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className={`w-full h-full object-cover transition-all duration-300 ${
              artwork.isBlurred ? 'blur-lg scale-110' : ''
            }`}
          />
          <div 
            className={`absolute inset-0 flex flex-col items-center justify-center p-4 transition-opacity duration-300 ${
              artwork.isBlurred ? 'bg-black bg-opacity-40' : 'bg-black bg-opacity-0 group-hover:bg-opacity-30'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {artwork.isBlurred && <Lock className="w-8 h-8 text-white mb-4" />}
            <div className={`w-full max-w-[200px] ${artwork.isBlurred ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300'}`}>
              <PurchaseButton
                artworkId={artwork.id}
                price={artwork.price}
                onSuccess={handlePurchaseSuccess}
                onError={handlePurchaseError}
              />
            </div>
            {error && (
              <p className="mt-2 text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      </div>

      {showLifetimeOffer && (
        <LifetimeAccessOffer onClose={() => setShowLifetimeOffer(false)} />
      )}
    </>
  );
};