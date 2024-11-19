import React from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useArtStore } from '../store/artStore';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        onError(paymentError.message || 'Payment failed');
        return;
      }

      // Payment successful
      const artStore = useArtStore.getState();
      artStore.setLifetimeAccess(true);
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
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
          <span>Pay £49</span>
        )}
      </button>
    </form>
  );
};

interface LifetimeAccessOfferProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const LifetimeAccessOffer: React.FC<LifetimeAccessOfferProps> = ({
  onClose,
  onSuccess,
}) => {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const initializePayment = async () => {
      try {
        console.log('Creating lifetime access payment...');
        const { data, error: paymentError } = await supabase.functions.invoke(
          'create-payment-intent',
          {
            body: {
              type: 'lifetime',
            },
          }
        );

        console.log('Payment response:', { data, error: paymentError });

        if (paymentError || !data?.clientSecret) {
          throw new Error(paymentError?.message || 'Failed to create payment');
        }

        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Lifetime purchase error:', error);
        setError(error instanceof Error ? error.message : 'Payment initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, []);

  const handleSuccess = () => {
    console.log('Lifetime access granted');
    onSuccess();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
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
            Get unlimited access to all current and future artwork with a one-time payment.
          </p>

          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
            <li>Instant access to all artwork</li>
            <li>Future artwork automatically unlocked</li>
            <li>One-time payment of £49</li>
            <li>Support the artist directly</li>
          </ul>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {isLoading ? (
            <div className="flex justify-center">
              <svg
                className="animate-spin h-8 w-8 text-black"
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
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm onSuccess={handleSuccess} onError={handleError} />
            </Elements>
          ) : null}

          <p className="text-sm text-gray-500 text-center mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};