import React from 'react';
import { CreditCard } from 'lucide-react';
import { stripePromise } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface PurchaseButtonProps {
  artworkId: string;
  price: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export const PurchaseButton: React.FC<PurchaseButtonProps> = ({
  artworkId,
  price,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Create Checkout Session
      const { data, error: checkoutError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          artworkId,
          price,
          type: 'single'
        }
      });

      if (checkoutError || !data?.sessionId) {
        throw new Error(checkoutError?.message || 'Failed to create checkout session');
      }

      // Redirect to Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (stripeError) {
        throw stripeError;
      }

      // Note: onSuccess will not be called here as the user is redirected
      // Success handling happens in the SuccessPage component after redirect

    } catch (error) {
      setIsLoading(false);
      onError(error instanceof Error ? error : new Error('Payment failed'));
    }
  };

  return (
    <button
      onClick={handlePurchase}
      onTouchStart={() => {}} // Add empty touch handler to ensure iOS recognizes it as interactive
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 
        bg-purple-600 text-white rounded-lg
        hover:bg-purple-700 active:bg-purple-800 
        transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        touch-manipulation tap-highlight-transparent
        -webkit-touch-callout-none
      `}
      style={{
        WebkitAppearance: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none'
      }}
    >
      <CreditCard className="w-5 h-5" />
      {isLoading ? 'Processing...' : `£${price.toFixed(2)}`}
    </button>
  );
};