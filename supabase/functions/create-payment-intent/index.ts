import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Starting Edge Function...');

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
  console.error('Missing Supabase environment variables:', { 
    supabaseUrl: !!supabaseUrl, 
    supabaseServiceKey: !!supabaseServiceKey,
    availableEnvVars: Object.keys(Deno.env.toObject())
  });
  throw new Error('Supabase environment variables are required');
}

console.log('Initializing Supabase client with:', { 
  supabaseUrl: supabaseUrl.substring(0, 10) + '...',
  serviceKeyLength: supabaseServiceKey.length
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { artworkId, price, type } = await req.json();
    const origin = req.headers.get('origin') || 'https://www.evacobero.pro';

    console.log('Creating payment intent:', { artworkId, price, type });

    // Validate input based on type
    if (type === 'payment_element') {
      if (!artworkId || !price) {
        console.error('Missing required parameters:', { artworkId, price });
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: artworkId and price are required for single artwork purchase' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Always verify the artwork exists first
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', artworkId)
        .single();

      if (artworkError) {
        console.error('Artwork lookup error:', artworkError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify artwork', details: artworkError }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!artwork) {
        console.error('Artwork not found:', artworkId);
        return new Response(
          JSON.stringify({ error: `Artwork not found with ID: ${artworkId}` }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verify the price matches (allow for small floating point differences)
      if (Math.abs(artwork.price - price) > 0.01) {
        console.error('Price mismatch:', { expected: artwork.price, received: price });
        return new Response(
          JSON.stringify({ error: 'Price mismatch', details: { expected: artwork.price, received: price } }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      try {
        // Create a PaymentIntent for the Payment Element
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(price * 100), // Convert to cents
          currency: 'gbp',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            artworkId,
            title: artwork.title,
          },
        });

        return new Response(
          JSON.stringify({
            clientSecret: paymentIntent.client_secret,
            artwork: {
              id: artwork.id,
              title: artwork.title,
              price: artwork.price,
            },
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: 200,
          }
        );
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        return new Response(
          JSON.stringify({ error: 'Payment processing failed', details: stripeError }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else if (type === 'lifetime') {
      try {
        // Create a PaymentIntent for lifetime access
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 4900, // £49.00
          currency: 'gbp',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            type: 'lifetime',
          },
        });

        return new Response(
          JSON.stringify({ 
            clientSecret: paymentIntent.client_secret,
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: 200,
          }
        );
      } catch (stripeError) {
        console.error('Stripe lifetime access error:', stripeError);
        return new Response(
          JSON.stringify({ error: 'Lifetime access payment failed', details: stripeError }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    throw new Error('Invalid payment type');
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});