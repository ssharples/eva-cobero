import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { stripePromise } from '../lib/stripe';
import { supabase } from '../lib/supabase';

interface LifetimeAccessOfferProps {
  onClose: () => void;
}

export const LifetimeAccessOffer: React.FC<LifetimeAccessOfferProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { data: { sessionId }, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
        body: { type: 'lifetime', price: 49 }
      });

      if (intentError) {
        throw intentError;
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Special Offer: Lifetime Access
          </h2>
          <p className="text-gray-600">
            Get unlimited access to all current and future artworks for just £49!
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-t border-b border-gray-200 py-4">
            <ul className="space-y-3">
              {[
                'Access all artworks instantly',
                'Download in full resolution',
                'Early access to new releases',
                'Exclusive artist insights',
              ].map((benefit, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <span className="mr-2">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium
                     hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Get Lifetime Access'}
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <p className="text-xs text-gray-500 text-center">
            One-time payment. No recurring fees.
          </p>
        </div>
      </div>
    </div>
  );
};