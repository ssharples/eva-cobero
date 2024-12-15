import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Starting Subscription Edge Function...');

// Initialize Stripe
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY is missing');
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(stripeKey, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase environment variables are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Subscription prices (in pence)
const PRICES = {
  monthly: {
    regular: 999, // £9.99
    discounted: 499, // £4.99
  },
  yearly: {
    regular: 9900, // £99
    discounted: 4900, // £49
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, subscriptionType, isDiscounted } = await req.json();
    const origin = req.headers.get('origin') || 'https://www.evacobero.pro';

    console.log('Creating subscription:', { userId, subscriptionType, isDiscounted });

    // Validate input
    if (!userId || !subscriptionType || !['monthly', 'yearly'].includes(subscriptionType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get or create customer
    let customerId: string;
    const { data: customers } = await stripe.customers.search({
      query: `email:'${user.user.email}'`,
    });

    if (customers && customers.length > 0) {
      customerId = customers[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.user.email,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
    }

    // Create subscription price
    const priceAmount = isDiscounted 
      ? PRICES[subscriptionType].discounted 
      : PRICES[subscriptionType].regular;

    const price = await stripe.prices.create({
      unit_amount: priceAmount,
      currency: 'gbp',
      recurring: {
        interval: subscriptionType === 'monthly' ? 'month' : 'year',
      },
      product_data: {
        name: `Eva Cobero ${subscriptionType === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
      },
    });

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId,
        subscriptionType: subscriptionType,
      },
    });

    // Get the client secret from the subscription
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
