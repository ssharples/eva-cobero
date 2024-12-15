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
import { X, Sparkles } from 'lucide-react';

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

interface SubscriptionOfferProps {
  show: boolean;
  onClose: () => void;
}

export function SubscriptionOffer({ show, onClose }: SubscriptionOfferProps) {
  const { user, subscription, createSubscription } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Handle animation
  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show && !isVisible) return null;

  const handleSubscribe = async (type: 'monthly' | 'yearly') => {
    if (!user) return;
    
    try {
      setError(null);
      setIsLoading(true);
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
            isDiscounted: true,
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
    } finally {
      setIsLoading(false);
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
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          show ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
        onClick={onClose}
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        
        <div
          className={`relative w-full max-w-md transform rounded-2xl bg-gray-900/90 backdrop-blur-xl border border-white/10 p-6 shadow-2xl ${
            show ? 'scale-100' : 'scale-95'
          } transition-transform duration-300`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-fuchsia-500/20 animate-gradient-xy" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Special Launch Offer!
            </h2>
            <p className="text-gray-300 mt-2">
              Subscribe now and get exclusive access to Eva's premium content
            </p>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handleCancel}
            />
          </Elements>

          <p className="mt-6 text-xs text-gray-500 text-center">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    );
  }

  // Calculate time remaining for the offer
  const endTime = new Date('2024-12-15T20:33:45Z');
  const now = new Date();
  const timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0 ${
        show ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300`}
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div
        className={`relative w-full max-w-md transform rounded-2xl bg-gray-900/90 backdrop-blur-xl border border-white/10 p-6 shadow-2xl ${
          show ? 'scale-100' : 'scale-95'
        } transition-transform duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-fuchsia-500/20 animate-gradient-xy" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Special Launch Offer!
          </h2>
          <p className="text-gray-300 mt-2">
            Subscribe now and get exclusive access to Eva's premium content
          </p>
          {timeRemaining > 0 && (
            <div className="mt-4 inline-block bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm font-medium">
              Offer ends in: {hours}h {minutes}m
            </div>
          )}
        </div>

        <div className="relative space-y-4">
          <div className="group relative overflow-hidden rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-lg font-semibold text-white">Monthly Subscription</h3>
            <p className="text-gray-400 mb-4">Perfect for exploring Eva's art</p>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Processing...' : '£4.99/month'}
            </button>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -top-1 -right-1">
              <div className="relative">
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs px-2 py-1 rounded-full">
              Best Value
            </div>
            <h3 className="text-lg font-semibold text-white">Yearly Subscription</h3>
            <p className="text-gray-400 mb-4">Save 18% with annual billing</p>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Processing...' : '£49/year'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">
            {error}
          </div>
        )}

        <p className="relative mt-6 text-xs text-gray-400 text-center">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
