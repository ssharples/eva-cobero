import { loadStripe } from '@stripe/stripe-js';
import { log } from './debug';

const initStripe = async () => {
  try {
    log.info('Initializing Stripe with key:', import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 8) + '...');
    
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      throw new Error('Stripe public key is missing');
    }

    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY, {
      betas: ['payment_element_beta_1'],
      apiVersion: '2023-10-16',
    });

    if (!stripe) {
      throw new Error('Failed to initialize Stripe');
    }

    log.info('Stripe initialized successfully');
    return stripe;
  } catch (error) {
    log.error('Stripe initialization error:', error);
    throw error;
  }
};

export const stripePromise = initStripe();