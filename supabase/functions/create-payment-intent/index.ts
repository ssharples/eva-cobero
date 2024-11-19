import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Stripe
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
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
  throw new Error('Supabase environment variables are required');
}

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

    // Validate input
    if (!artworkId || !price) {
      throw new Error('Missing required parameters: artworkId and price are required');
    }

    // Always verify the artwork exists first
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .single();

    if (artworkError) {
      console.error('Artwork lookup error:', artworkError);
      throw new Error('Failed to verify artwork');
    }

    if (!artwork) {
      throw new Error(`Artwork not found with ID: ${artworkId}`);
    }

    // Verify the price matches
    if (Math.abs(artwork.price - price) > 0.01) {
      throw new Error('Price mismatch');
    }

    if (type === 'payment_element') {
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
    } else if (type === 'lifetime') {
      // Create a Checkout Session for lifetime access
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'apple_pay'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Lifetime Access',
              description: 'Unlimited access to all current and future artworks',
            },
            unit_amount: 4900, // £49.00
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/`,
        metadata: {
          type: 'lifetime',
        },
      });

      return new Response(
        JSON.stringify({ 
          sessionId: session.id,
          checkoutUrl: session.url,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    throw new Error('Invalid payment type');
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});