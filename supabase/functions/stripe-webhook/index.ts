import { serve } from 'https://deno.fresh.run/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature!, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.type === 'single' && session.metadata?.artworkId) {
        // Record single artwork purchase
        await supabase.from('user_purchases').insert({
          user_id: session.client_reference_id,
          artwork_id: session.metadata.artworkId,
          amount_paid: session.amount_total! / 100,
          payment_intent_id: session.payment_intent as string,
          payment_status: 'completed'
        });
      } else if (session.metadata?.type === 'lifetime') {
        // Handle lifetime access purchase
        // You might want to create a separate table for lifetime access subscriptions
        await supabase.from('lifetime_access').insert({
          user_id: session.client_reference_id,
          purchase_date: new Date().toISOString(),
          payment_intent_id: session.payment_intent as string,
          payment_status: 'completed'
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});