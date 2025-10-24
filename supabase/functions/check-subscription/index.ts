import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      
      // Check manual access
      const { data: activityData } = await supabaseClient
        .from('user_activity')
        .select('manual_access')
        .eq('user_id', user.id)
        .single();

      return new Response(JSON.stringify({ 
        subscribed: activityData?.manual_access || false,
        manual_access: activityData?.manual_access || false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
      expand: ["data.latest_invoice"],
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionId = null;
    let lastPaymentDate = null;

    const toIsoIfValid = (epochSeconds: number | null | undefined) => {
      if (!epochSeconds) return null;
      const date = new Date(epochSeconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionId = subscription.id;
      subscriptionEnd = toIsoIfValid(subscription.current_period_end);
      lastPaymentDate = toIsoIfValid(subscription.current_period_start);

      if (!lastPaymentDate && subscription.latest_invoice && typeof subscription.latest_invoice !== "string") {
        lastPaymentDate = toIsoIfValid(subscription.latest_invoice.created);
      }

      productId = subscription.items.data[0].price.product;
      logStep("Active subscription found", { subscriptionId, productId, endDate: subscriptionEnd, lastPaymentDate });

      // Update user_activity table
      await supabaseClient
        .from('user_activity')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          subscription_product_id: productId as string,
          subscription_end_date: subscriptionEnd,
          last_payment_date: lastPaymentDate,
        }, { onConflict: 'user_id' });
    } else {
      logStep("No active subscription found");

      // Check manual access
      const { data: activityData } = await supabaseClient
        .from('user_activity')
        .select('manual_access')
        .eq('user_id', user.id)
        .single();

      return new Response(JSON.stringify({ 
        subscribed: activityData?.manual_access || false,
        manual_access: activityData?.manual_access || false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      last_payment_date: lastPaymentDate,
      manual_access: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
