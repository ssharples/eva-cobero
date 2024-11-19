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
  const [stripeError, setStripeError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const buttonRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Verify Stripe initialization on mount
    const checkStripe = async () => {
      try {
        const stripe = await stripePromise;
        console.log('Stripe availability check:', !!stripe);
      } catch (error) {
        console.error('Stripe initialization check failed:', error);
        setStripeError('Payment system unavailable');
      }
    };
    checkStripe();
  }, []);

  const handlePurchase = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Purchase button clicked/tapped');
    
    if (stripeError) {
      console.error('Purchase attempted with Stripe error:', stripeError);
      onError(new Error(stripeError));
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Creating payment session...');
      
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Payment system is not available');
      }

      console.log('Invoking create-payment-intent...');
      console.log('Supabase URL:', supabase.supabaseUrl);
      const { data, error: checkoutError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          artworkId,
          price,
          type: 'single'
        }
      });

      console.log('Payment intent response:', { data, error: checkoutError });

      if (checkoutError || !data?.sessionId) {
        throw new Error(checkoutError?.message || 'Failed to create payment session');
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

  // Touch event handlers
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

  if (stripeError) {
    return (
      <div className="text-red-500 text-sm">{stripeError}</div>
    );
  }

  return (
    <div 
      role="button"
      ref={buttonRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handlePurchase}
      className={`
        inline-flex items-center justify-center gap-2 
        w-full px-6 py-4 rounded-xl
        bg-purple-600 text-white text-lg font-medium
        active:bg-purple-800 select-none
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        touch-action: manipulation;
        shadow-lg
      `}
      style={{
        WebkitAppearance: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        minHeight: '56px',
      }}
      aria-disabled={isLoading}
    >
      <CreditCard className="w-6 h-6" />
      {isLoading ? 'Processing...' : `£${price.toFixed(2)}`}
    </div>
  );
};