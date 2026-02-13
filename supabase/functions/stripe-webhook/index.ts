/**
 * stripe-webhook - Supabase Edge Function
 * Handles Stripe webhook events for subscription management
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseAdmin, stripe, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseAdmin, subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseAdmin, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.supabase_user_id;
  const tier = session.metadata?.tier as 'pro' | 'max';

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  // Create or update subscription record
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: session.customer as string,
    tier,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, {
    onConflict: 'user_id',
  });

  // Update profile tier
  await supabase
    .from('profiles')
    .update({ 
      tier,
      stripe_customer_id: session.customer as string,
    })
    .eq('user_id', userId);

  console.log(`Subscription created for user ${userId}, tier: ${tier}`);
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id;
  const tier = subscription.metadata?.tier as 'pro' | 'max';

  if (!userId) {
    // Try to find user by Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (!profile) {
      console.error('Could not find user for subscription');
      return;
    }

    // Update subscription record
    await supabase.from('subscriptions').upsert({
      user_id: profile.user_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      tier: tier || 'pro',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'stripe_subscription_id',
    });

    // Update profile tier if subscription is active
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      await supabase
        .from('profiles')
        .update({ tier: tier || 'pro' })
        .eq('user_id', profile.user_id);
    }
  } else {
    // Update subscription record
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'stripe_subscription_id',
    });

    // Update profile tier if subscription is active
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      await supabase
        .from('profiles')
        .update({ tier })
        .eq('user_id', userId);
    }
  }

  console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (!profile) {
    console.error('Could not find user for deleted subscription');
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  // Downgrade to free tier
  await supabase
    .from('profiles')
    .update({ tier: 'free' })
    .eq('user_id', profile.user_id);

  console.log(`Subscription deleted for user ${profile.user_id}, downgraded to free`);
}

/**
 * Handle invoice.payment_failed
 */
async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  if (!invoice.subscription) return;

  // Update subscription status to past_due
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription);

  console.log(`Payment failed for subscription ${invoice.subscription}`);
}
