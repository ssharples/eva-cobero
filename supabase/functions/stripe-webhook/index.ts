import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeKey || !endpointSecret || !supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing environment variables');
}

const stripe = new Stripe(stripeKey, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (!paymentIntent.metadata.artworkId) break;

        // Handle one-time artwork purchase
        const { error } = await supabase
          .from('purchases')
          .insert({
            user_id: paymentIntent.metadata.userId,
            artwork_id: paymentIntent.metadata.artworkId,
            amount: paymentIntent.amount,
            stripe_payment_id: paymentIntent.id,
          });

        if (error) throw error;
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        if (!userId) break;

        // Calculate expiration date based on subscription interval
        const now = new Date();
        const expiresAt = new Date(now);
        if (subscription.items.data[0].price.recurring?.interval === 'month') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        // Update or insert subscription record
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            type: subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'yearly',
            status: subscription.status === 'active' ? 'active' : 'inactive',
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        if (!userId) break;

        // Mark subscription as inactive
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) throw error;
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});