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
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handlePurchase = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Purchase button clicked/tapped');
    
    try {
      setIsLoading(true);
      console.log('Setting loading state...');
      
      const stripe = await stripePromise;
      console.log('Stripe loaded:', !!stripe);
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      console.log('Creating checkout session...');
      const { data, error: checkoutError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          artworkId,
          price,
          type: 'single'
        }
      });

      console.log('Checkout session response:', { data, error: checkoutError });

      if (checkoutError || !data?.sessionId) {
        throw new Error(checkoutError?.message || 'Failed to create checkout session');
      }

      console.log('Redirecting to checkout...');
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (stripeError) {
        throw stripeError;
      }

    } catch (error) {
      console.error('Purchase error:', error);
      setIsLoading(false);
      onError(error instanceof Error ? error : new Error('Payment failed'));
    }
  };

  // Add touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('Touch start event triggered');
    if (buttonRef.current) {
      buttonRef.current.style.opacity = '0.8';
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    console.log('Touch end event triggered');
    if (buttonRef.current) {
      buttonRef.current.style.opacity = '1';
    }
    handlePurchase(e);
  };

  return (
    <div 
      role="button"
      ref={buttonRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handlePurchase}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-3
        bg-purple-600 text-white rounded-lg
        active:bg-purple-800 select-none
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        touch-action: manipulation;
      `}
      style={{
        WebkitAppearance: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        minHeight: '44px', // iOS minimum touch target size
      }}
    >
      <CreditCard className="w-5 h-5" />
      {isLoading ? 'Processing...' : `£${price.toFixed(2)}`}
    </div>
  );
};