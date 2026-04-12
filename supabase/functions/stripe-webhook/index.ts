/**
 * stripe-webhook - Supabase Edge Function
 * Handles Stripe webhook events for subscription management
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { corsHeaders, extractId, requireEnv } from '../_shared/helpers.ts';

const STRIPE_SECRET_KEY = requireEnv('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = requireEnv('STRIPE_WEBHOOK_SECRET');
const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
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
  const tier = session.metadata?.tier as 'pro' | 'max' | 'lifetime';

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const customerId = extractId(session.customer, 'session.customer');

  // Handle lifetime one-time payment separately
  if (tier === 'lifetime') {
    // Create subscription record with lifetime status (no expiry)
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_subscription_id: `lifetime_${session.payment_intent || session.id}`,
      stripe_customer_id: customerId,
      tier: 'lifetime',
      status: 'lifetime',
      current_period_start: new Date().toISOString(),
      current_period_end: null, // Never expires
      cancel_at_period_end: false,
    }, {
      onConflict: 'user_id',
    });

    // Update profile tier to lifetime (maps to max/premium features)
    await supabase
      .from('profiles')
      .update({
        tier: 'lifetime',
        stripe_customer_id: customerId,
      })
      .eq('user_id', userId);

    console.log(`Lifetime deal activated for user ${userId}`);
    return;
  }

  // Get subscription details for recurring subscriptions
  const subscriptionId = extractId(session.subscription, 'session.subscription');
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create or update subscription record
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
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
      stripe_customer_id: customerId,
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
  const customerId = extractId(subscription.customer, 'subscription.customer');

  if (!userId) {
    // Try to find user by Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error('Could not find user for subscription');
      return;
    }

    // Update subscription record
    await supabase.from('subscriptions').upsert({
      user_id: profile.user_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
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
      stripe_customer_id: customerId,
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
  const customerId = extractId(subscription.customer, 'subscription.customer');

  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, tier')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Could not find user for deleted subscription');
    return;
  }

  // Don't downgrade lifetime users — their access is permanent
  if (profile.tier === 'lifetime') {
    console.log(`Skipping downgrade for lifetime user ${profile.user_id}`);
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
  const subscriptionId = extractId(invoice.subscription, 'invoice.subscription');

  // Update subscription status to past_due
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);

  console.log(`Payment failed for subscription ${subscriptionId}`);
}
