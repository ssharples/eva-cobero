import React from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useArtStore } from '../store/artStore';

interface LifetimeAccessOfferProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const LifetimeAccessOffer: React.FC<LifetimeAccessOfferProps> = ({
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const updateAllArtworks = useArtStore((state) => state.updateAllArtworks);

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: paymentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            type: 'lifetime',
            price: 49,
          },
        }
      );

      if (paymentError || !data?.sessionId) {
        throw new Error(paymentError?.message || 'Failed to create payment');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Lifetime purchase error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4">🎨 Unlock All Artwork</h2>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Congratulations on your purchase! Would you like unlimited access to all
            current and future artwork?
          </p>

          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Instant access to all artwork</li>
            <li>Future artwork automatically unlocked</li>
            <li>One-time payment of £49</li>
            <li>Support the artist directly</li>
          </ul>

          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <span>Get Lifetime Access - £49</span>
            )}
          </button>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <p className="text-sm text-gray-500 text-center">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};