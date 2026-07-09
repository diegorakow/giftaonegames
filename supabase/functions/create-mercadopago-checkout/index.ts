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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return json({ error: "Mercado Pago access token not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;
    const { items, orderId } = await req.json() as { items: CartItem[]; orderId: string };

    if (!items?.length || !orderId) return json({ error: "Missing items or orderId" }, 400);

    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, user_id, status, total")
      .eq("id", orderId)
      .single();

    if (orderError || !order || order.user_id !== userId || order.status !== "pending") {
      return json({ error: "Invalid order" }, 400);
    }

    let serverTotal = 0;
    const verifiedItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      platform: string;
    }> = [];

    for (const item of items) {
      const { data: stock } = await serviceClient.rpc("get_available_stock", {
        p_product_id: item.productId,
      });
      if (!stock || stock < item.quantity) {
        return json({ error: `Estoque insuficiente para: ${item.name}` }, 400);
      }

      const { data: product, error: productError } = await serviceClient
        .from("products")
        .select("price, name, platform")
        .eq("id", item.productId)
        .eq("is_active", true)
        .single();

      if (productError || !product) {
        return json({ error: `Produto não encontrado: ${item.name}` }, 400);
      }

      verifiedItems.push({
        productId: item.productId,
        name: product.name,
        price: Number(product.price),
        quantity: item.quantity,
        platform: product.platform,
      });
      serverTotal += Number(product.price) * item.quantity;
    }

    const origin = req.headers.get("origin") || Deno.env.get("SITE_ORIGIN") || "https://giftzone.com.br";
    const webhookUrl = Deno.env.get("MERCADO_PAGO_WEBHOOK_URL");

    const preferenceBody = {
      items: verifiedItems.map((item) => ({
        id: item.productId,
        title: item.name,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: Number(item.price.toFixed(2)),
        category_id: "digital_goods",
      })),
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: `${origin}/sucesso?order_id=${orderId}`,
        pending: `${origin}/pendente?order_id=${orderId}`,
        failure: `${origin}/checkout?status=cancelled&order_id=${orderId}`,
      },
      auto_return: "approved",
      external_reference: orderId,
      metadata: {
        order_id: orderId,
        user_id: userId,
      },
      notification_url: webhookUrl || undefined,
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
    };

    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    const preference = await preferenceResponse.json();
    if (!preferenceResponse.ok) {
      await serviceClient.from("order_logs").insert({
        order_id: orderId,
        type: "payment_error",
        message: "Mercado Pago preference creation failed",
        payload: preference,
      });
      return json({ error: "Could not create Mercado Pago checkout" }, 502);
    }

    await serviceClient
      .from("orders")
      .update({
        total: serverTotal,
        amount_paid: serverTotal,
        payment_provider: "mercadopago",
        payment_status: "pending",
        delivery_status: "waiting_payment",
        payment_id: preference.id,
        payment_intent_id: preference.id,
      })
      .eq("id", orderId);

    await serviceClient.from("order_logs").insert({
      order_id: orderId,
      type: "checkout_created",
      message: "Mercado Pago checkout preference created",
      payload: { preference_id: preference.id },
    });

    return json({
      url: preference.init_point || preference.sandbox_init_point,
      preference_id: preference.id,
    });
  } catch (error) {
    console.error("Mercado Pago checkout error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
