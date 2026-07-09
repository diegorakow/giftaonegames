import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function readNotification(req: Request) {
  const url = new URL(req.url);
  const queryId = url.searchParams.get("data.id") || url.searchParams.get("id");
  const queryType = url.searchParams.get("type") || url.searchParams.get("topic");

  if (req.method === "GET") {
    return { paymentId: queryId, type: queryType };
  }

  const body = await req.json().catch(() => ({}));
  return {
    paymentId: body?.data?.id || body?.id || queryId,
    type: body?.type || body?.topic || queryType,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) return json({ error: "Mercado Pago access token not configured" }, 500);

    const { paymentId, type } = await readNotification(req);
    if (!paymentId || (type && !["payment", "merchant_order"].includes(type))) {
      return json({ received: true, ignored: true });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payment = await paymentResponse.json();

    if (!paymentResponse.ok) {
      return json({ error: "Could not verify payment" }, 502);
    }

    const orderId = payment.external_reference || payment.metadata?.order_id;
    if (!orderId) return json({ received: true, ignored: true });

    await supabase.from("order_logs").insert({
      order_id: orderId,
      type: "payment_webhook",
      message: `Mercado Pago status: ${payment.status}`,
      payload: {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
      },
    });

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, status, delivery_status")
      .eq("id", orderId)
      .single();

    if (!existingOrder) return json({ received: true, ignored: true });

    if (payment.status !== "approved") {
      const mappedStatus = payment.status === "refunded" ? "refunded" : existingOrder.status;
      await supabase
        .from("orders")
        .update({
          status: mappedStatus,
          payment_provider: "mercadopago",
          payment_status: payment.status,
          payment_id: String(payment.id),
          amount_paid: payment.transaction_amount || null,
        })
        .eq("id", orderId);

      return json({ received: true });
    }

    if (existingOrder.status === "paid" && existingOrder.delivery_status === "delivered") {
      return json({ received: true, idempotent: true });
    }

    await supabase
      .from("orders")
      .update({
        status: "paid",
        amount_paid: payment.transaction_amount || null,
        payment_provider: "mercadopago",
        payment_status: "approved",
        delivery_status: "processing",
        payment_id: String(payment.id),
        payment_intent_id: String(payment.id),
      })
      .eq("id", orderId);

    const n8nWebhookUrl = Deno.env.get("N8N_DELIVERY_WEBHOOK_URL");

    if (n8nWebhookUrl) {
      const deliveryResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          payment_id: String(payment.id),
          provider: "mercadopago",
          status: payment.status,
          amount_paid: payment.transaction_amount,
        }),
      });

      const deliveryPayload = await deliveryResponse.json().catch(() => ({}));

      await supabase.from("order_logs").insert({
        order_id: orderId,
        type: deliveryResponse.ok ? "supplier_delivery" : "supplier_error",
        message: deliveryResponse.ok ? "n8n delivery workflow accepted" : "n8n delivery workflow failed",
        payload: deliveryPayload,
      });

      await supabase
        .from("orders")
        .update({
          delivery_status: deliveryResponse.ok ? "processing" : "error",
          supplier_transaction_id: deliveryPayload?.supplier_transaction_id || null,
          supplier_response: deliveryPayload,
        })
        .eq("id", orderId);

      return json({ received: true, delivered_by: "n8n" });
    }

    const { data: codesAssigned, error: assignError } = await supabase.rpc("assign_codes_to_order", {
      p_order_id: orderId,
    });

    await supabase
      .from("orders")
      .update({
        delivery_status: assignError ? "error" : "delivered",
        supplier_response: assignError ? { error: assignError.message } : { codes_assigned: codesAssigned },
        delivered_at: assignError ? null : new Date().toISOString(),
      })
      .eq("id", orderId);

    await supabase.rpc("process_order_xp", { p_order_id: orderId });

    await supabase.from("audit_logs").insert({
      action: "payment_confirmed_mercadopago",
      entity_type: "order",
      entity_id: orderId,
      details: {
        status: "paid",
        payment_id: payment.id,
        codes_assigned: codesAssigned,
        assign_error: assignError?.message || null,
      },
    });

    return json({ received: true, codes_assigned: codesAssigned || 0 });
  } catch (error) {
    console.error("Mercado Pago webhook error:", error);
    return json({ error: "Webhook processing failed" }, 500);
  }
});
