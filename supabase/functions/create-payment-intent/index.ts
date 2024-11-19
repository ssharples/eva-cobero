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

    console.log('Creating checkout session:', { artworkId, price, type });

    // Validate input
    if (!artworkId || !price) {
      throw new Error('Missing required parameters');
    }

    let paymentIntent;

    if (type === 'payment_element') {
      // Create a PaymentIntent for the Payment Element
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Convert to cents
        currency: 'gbp',
        payment_method_types: ['card', 'apple_pay', 'google_pay'],
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          artworkId,
        },
      });

      return new Response(
        JSON.stringify({ 
          clientSecret: paymentIntent.client_secret,
          publishableKey: Deno.env.get('STRIPE_PUBLIC_KEY')
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
      // Create a Checkout Session for redirect flow
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'apple_pay'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Lifetime Access',
              description: 'Unlimited access to all artworks',
            },
            unit_amount: 4900,
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
        JSON.stringify({ sessionId: session.id }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    } else {
      // Verify the artwork exists
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', artworkId)
        .single();

      if (artworkError || !artwork) {
        throw new Error('Artwork not found');
      }

      // Create a Checkout Session for redirect flow
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'apple_pay'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: artwork.title,
                description: artwork.description,
                images: [artwork.image_url],
              },
              unit_amount: Math.round(price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/`,
        metadata: {
          artworkId,
          type: 'single',
        },
      });

      return new Response(
        JSON.stringify({ sessionId: session.id }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
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