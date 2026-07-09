import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  platform: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;

    const { items, orderId } = await req.json() as { items: CartItem[]; orderId: string };

    if (!items?.length || !orderId) {
      return new Response(JSON.stringify({ error: "Missing items or orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the order belongs to this user and is pending
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, status, total")
      .eq("id", orderId)
      .single();

    if (orderError || !order || order.user_id !== userId || order.status !== "pending") {
      return new Response(JSON.stringify({ error: "Invalid order" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-fetch authoritative prices from database
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify stock and fetch real prices for each item
    let serverTotal = 0;
    const verifiedItems: Array<{ productId: string; name: string; price: number; quantity: number; platform: string }> = [];

    for (const item of items) {
      const { data: stock } = await supabase.rpc("get_available_stock", {
        p_product_id: item.productId,
      });
      if (!stock || stock < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Estoque insuficiente para: ${item.name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch real price from database
      const { data: product, error: productError } = await serviceClient
        .from("products")
        .select("price, name, platform")
        .eq("id", item.productId)
        .eq("is_active", true)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: `Produto não encontrado: ${item.name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      verifiedItems.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        platform: product.platform,
      });
      serverTotal += product.price * item.quantity;
    }

    // Update order total with server-verified prices
    await serviceClient
      .from("orders")
      .update({ total: serverTotal })
      .eq("id", orderId);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://game-loot-locker.lovable.app";

    // Create Stripe Checkout session with verified server-side prices
    const lineItems = verifiedItems.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.name,
          metadata: { platform: item.platform, product_id: item.productId },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/pagamento-sucesso?order_id=${orderId}`,
      cancel_url: `${origin}/checkout?status=cancelled&order_id=${orderId}`,
      metadata: {
        order_id: orderId,
        user_id: userId,
      },
      payment_intent_data: {
        metadata: {
          order_id: orderId,
          user_id: userId,
        },
      },
    });

    // Save payment_intent reference on the order

    await serviceClient
      .from("orders")
      .update({ payment_intent_id: session.id })
      .eq("id", orderId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
