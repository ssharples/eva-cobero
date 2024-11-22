import React from 'react';
import { useInView } from 'react-intersection-observer';
import { Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Artwork } from '../types';
import { LifetimeAccessOffer } from './LifetimeAccessOffer';
import { useArtStore } from '../store/artStore';
import { supabase } from '../lib/supabase';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

interface PaymentFormProps {
  clientSecret: string;
  artwork: {
    id: string;
    title: string;
    price: number;
  };
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  artwork,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        onSuccess();
      } else {
        throw new Error('Payment failed or was cancelled');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
      onError(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <PaymentElement
        options={{
          paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
          layout: 'tabs',
        }}
      />
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg 
                 font-medium shadow-md hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <span>Processing...</span>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span>Unblur me</span>
          </>
        )}
      </button>
    </form>
  );
};

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
  const [isLoading, setIsLoading] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [showPayment, setShowPayment] = React.useState(false);
  const [paymentArtwork, setPaymentArtwork] = React.useState<{
    id: string;
    title: string;
    price: number;
  } | null>(null);
  const updateArtwork = useArtStore((state) => state.updateArtwork);

  const handlePurchaseClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating payment intent for artwork:', artwork.id);
      const { data, error: paymentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            artworkId: artwork.id,
            price: artwork.price,
            type: 'payment_element',
          },
        }
      );

      console.log('Payment intent response:', { data, error: paymentError });

      if (paymentError) {
        throw new Error(paymentError.message || 'Failed to create payment');
      }

      if (!data?.clientSecret || !data?.artwork) {
        console.error('Invalid response:', data);
        throw new Error('Invalid response from server');
      }

      setClientSecret(data.clientSecret);
      setPaymentArtwork(data.artwork);
      setShowPayment(true);
    } catch (error) {
      console.error('Purchase error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('Payment success, updating artwork:', artwork.id);
    const artStore = useArtStore.getState();
    artStore.addPurchasedArtwork(artwork.id);
    setShowPayment(false);
    
    // Show success message or feedback
    setError(null);
    
    // Always show lifetime offer after 5 seconds for single purchases
    const purchasedCount = artStore.purchasedArtworkIds.length;
    console.log('Total purchased artworks:', purchasedCount);
    
    setTimeout(() => {
      // Only show if user hasn't purchased lifetime access
      if (!artStore.hasLifetimeAccess) {
        console.log('Showing lifetime offer popup');
        setShowLifetimeOffer(true);
      }
    }, 5000); // 5 seconds delay
  };

  const handlePaymentError = (error: Error) => {
    setError(error.message);
    setShowPayment(false);
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
          {artwork.isBlurred && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 p-4"
              style={{ touchAction: 'manipulation' }}
            >
              <Lock className="w-8 h-8 text-white mb-4" />
              <div className="w-full max-w-md">
                {showPayment && clientSecret && paymentArtwork ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#000000',
                          colorBackground: '#ffffff',
                          colorText: '#000000',
                          colorDanger: '#df1b41',
                          fontFamily: 'system-ui, sans-serif',
                          spacingUnit: '4px',
                          borderRadius: '8px',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      clientSecret={clientSecret}
                      artwork={paymentArtwork}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                ) : (
                  <button
                    onClick={handlePurchaseClick}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg 
                             font-medium shadow-md hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                        <span>Unblur me</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              {error && (
                <p className="mt-2 text-red-400 text-sm text-center">{error}</p>
              )}
            </div>
          )}
        </div>
        <div className="mt-2 space-y-1">
          <h3 className="text-lg font-medium text-gray-900">{artwork.title}</h3>
          <p className="text-sm text-gray-500">£{artwork.price.toFixed(2)}</p>
        </div>
      </div>

      {showLifetimeOffer && (
        <LifetimeAccessOffer
          onClose={() => setShowLifetimeOffer(false)}
          onSuccess={() => {
            setShowLifetimeOffer(false);
          }}
        />
      )}
    </>
  );
};