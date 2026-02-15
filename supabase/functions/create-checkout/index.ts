/**
 * Supabase Edge Function: create-checkout
 * Creates a Stripe Checkout Session for subscription purchase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  tier: 'pro' | 'max' | 'lifetime';
  interval: 'month' | 'year';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Extract JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user via auth API with explicit token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { tier, interval }: CheckoutRequest = await req.json();

    if (!tier || !interval) {
      throw new Error('Missing tier or interval');
    }

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Get price ID from environment variables
    const isLifetime = tier === 'lifetime';
    let priceId: string | undefined;
    
    if (isLifetime) {
      priceId = Deno.env.get('STRIPE_PRICE_LIFETIME');
    } else {
      const priceKey = `STRIPE_PRICE_${tier.toUpperCase()}_${interval === 'year' ? 'ANNUAL' : 'MONTHLY'}`;
      priceId = Deno.env.get(priceKey);
    }

    if (!priceId) {
      throw new Error(`Price ID not configured for ${tier}${isLifetime ? '' : ` ${interval}`}`);
    }

    // Create Checkout Session — different config for lifetime (one-time) vs subscription
    let session;
    
    if (isLifetime) {
      // One-time payment for lifetime deal
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${Deno.env.get('APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}&lifetime=true`,
        cancel_url: `${Deno.env.get('APP_URL')}/subscription/cancel`,
        metadata: {
          supabase_user_id: user.id,
          tier: 'lifetime',
        },
        payment_intent_data: {
          metadata: {
            supabase_user_id: user.id,
            tier: 'lifetime',
          },
        },
      });
    } else {
      // Recurring subscription
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${Deno.env.get('APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get('APP_URL')}/subscription/cancel`,
        metadata: {
          supabase_user_id: user.id,
          tier,
        },
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            tier,
          },
          trial_period_days: 7, // 7-day free trial
        },
      });
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
