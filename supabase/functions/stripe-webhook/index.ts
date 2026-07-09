import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    const body = await req.text();

    let event: Stripe.Event;

    if (!webhookSecret || !signature) {
      return new Response(JSON.stringify({ error: "Missing webhook secret or signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Received event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only process paid sessions
      if (session.payment_status !== "paid") {
        console.log("Payment not yet completed, skipping");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const orderId = session.metadata?.order_id;
      const userId = session.metadata?.user_id;

      if (!orderId) {
        console.error("No order_id in session metadata");
        return new Response(JSON.stringify({ error: "Missing order_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Processing payment for order: ${orderId}`);

      // Use service role to bypass RLS
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Check if already processed (idempotent)
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (existingOrder?.status === "paid") {
        console.log("Order already paid, skipping");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update order status to paid
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_intent_id: session.payment_intent as string || session.id,
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw updateError;
      }

      // Assign codes to order using the secure database function
      const { data: codesAssigned, error: assignError } = await supabase.rpc(
        "assign_codes_to_order",
        { p_order_id: orderId }
      );

      if (assignError) {
        console.error("Error assigning codes:", assignError);
        // Don't throw - order is paid, codes can be assigned manually
      } else {
        console.log(`Assigned ${codesAssigned} codes to order ${orderId}`);
      }

      // Process XP (the trigger should handle this, but call explicitly as backup)
      await supabase.rpc("process_order_xp", { p_order_id: orderId });

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: "payment_confirmed_stripe",
        entity_type: "order",
        entity_id: orderId,
        details: {
          status: "paid",
          stripe_session_id: session.id,
          payment_intent: session.payment_intent,
          codes_assigned: codesAssigned,
        },
      });

      console.log(`✅ Order ${orderId} fully processed`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
