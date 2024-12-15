import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';

const OFFER_END_TIME = new Date('2024-12-15T20:33:45Z'); // 2 hours from current time
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, onSuccess, onError, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      onSuccess();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      onError(err instanceof Error ? err : new Error('Payment failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
    </form>
  );
}

export function SubscriptionOffer() {
  const { user, subscription } = useAuth();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getTimeLeft() {
    const now = new Date();
    const diff = OFFER_END_TIME.getTime() - now.getTime();
    return Math.max(0, diff);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const handleSubscribe = async (type: 'monthly' | 'yearly') => {
    if (!user) return;
    
    try {
      setError(null);
      setSelectedPlan(type);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            subscriptionType: type,
            isDiscounted: timeLeft > 0,
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start subscription');
      setSelectedPlan(null);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    setClientSecret(null);
    // The subscription status will be updated via webhook
  };

  const handlePaymentError = (error: Error) => {
    setError(error.message);
    setSelectedPlan(null);
    setClientSecret(null);
  };

  const handleCancel = () => {
    setSelectedPlan(null);
    setClientSecret(null);
    setError(null);
  };

  if (subscription?.status === 'active') {
    return null;
  }

  if (clientSecret && selectedPlan) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">
            Complete Your {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription
          </h2>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handleCancel}
            />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto my-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">🎉 Special Offer!</h2>
        <div className="text-xl mb-4">
          Limited Time Only: 50% OFF!
        </div>
        
        {timeLeft > 0 ? (
          <div className="text-2xl font-mono bg-black bg-opacity-20 rounded-lg p-4 inline-block">
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        ) : (
          <div className="text-xl font-bold">Offer Expired!</div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500 bg-opacity-10 border border-red-200 text-white rounded-lg">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Plan */}
        <div className="bg-white text-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">Monthly Access</h3>
          <div className="mb-4">
            <span className="line-through text-gray-400">£9.99</span>
            <span className="text-3xl font-bold ml-2">£4.99</span>
            <span className="text-gray-600">/month</span>
          </div>
          <button
            onClick={() => handleSubscribe('monthly')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={timeLeft <= 0 || !user}
          >
            {user ? 'Subscribe Monthly' : 'Sign in to Subscribe'}
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="bg-white text-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">Yearly Access</h3>
          <div className="mb-4">
            <span className="line-through text-gray-400">£99</span>
            <span className="text-3xl font-bold ml-2">£49</span>
            <span className="text-gray-600">/year</span>
          </div>
          <button
            onClick={() => handleSubscribe('yearly')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={timeLeft <= 0 || !user}
          >
            {user ? 'Subscribe Yearly' : 'Sign in to Subscribe'}
          </button>
        </div>
      </div>

      {!user && (
        <div className="text-center mt-6">
          <p className="text-sm">
            Please sign in or create an account to access these special offers!
          </p>
        </div>
      )}
    </div>
  );
}
