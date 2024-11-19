import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

const appearance = {
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
};

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: Error) => void;
  price: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ clientSecret, onSuccess, onError, price }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/success',
        },
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      onError(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-4">
      <PaymentElement 
        options={{
          paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
          defaultValues: {
            billingDetails: {
              name: 'Art Collector'
            }
          },
          layout: 'tabs'
        }} 
      />
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full mt-4 bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay £{price.toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  );
};

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
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handlePurchaseClick = async () => {
    try {
      console.log('Creating payment intent...');
      const { data, error: paymentIntentError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          artworkId,
          price,
          type: 'payment_element'
        }
      });

      if (paymentIntentError || !data?.clientSecret) {
        throw new Error(paymentIntentError?.message || 'Failed to create payment');
      }

      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error('Purchase error:', error);
      onError(error instanceof Error ? error : new Error('Payment failed'));
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
      {!showPayment ? (
        <button
          ref={buttonRef}
          onClick={handlePurchaseClick}
          className="w-full bg-black text-white py-3 px-6 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors"
        >
          <CreditCard className="w-5 h-5" />
          <span>Purchase for £{price.toFixed(2)}</span>
        </button>
      ) : clientSecret ? (
        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret,
            appearance,
            loader: 'auto',
          }}
        >
          <PaymentForm 
            clientSecret={clientSecret}
            onSuccess={onSuccess}
            onError={onError}
            price={price}
          />
        </Elements>
      ) : null}
    </div>
  );
};