import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RedeemRequest {
  order_item_id: string;
  code_id: string;
}

interface GetCodeIdsRequest {
  order_item_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check email confirmation
    if (!user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ error: "Email não confirmado. Verifique seu e-mail antes de continuar." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ACTION 1: Get code IDs for an order item (safe - only returns IDs)
    if (action === "get-code-ids" && req.method === "POST") {
      const body: GetCodeIdsRequest = await req.json();
      
      if (!body.order_item_id) {
        return new Response(
          JSON.stringify({ error: "Missing order_item_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Call secure database function
      const { data, error } = await supabase.rpc("get_code_ids_for_order_item", {
        p_order_item_id: body.order_item_id,
      });

      if (error) {
        console.error("Error getting code IDs:", error);
        return new Response(
          JSON.stringify({ error: "Failed to get code IDs" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ code_ids: data || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION 2: Redeem/reveal a specific code
    if (action === "reveal" && req.method === "POST") {
      const body: RedeemRequest = await req.json();
      
      if (!body.order_item_id || !body.code_id) {
        return new Response(
          JSON.stringify({ error: "Missing order_item_id or code_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the reveal attempt (for audit)
      await supabase.from("code_reveal_attempts").insert({
        user_id: user.id,
        order_item_id: body.order_item_id,
      });

      // Call secure database function to get the code
      const { data, error } = await supabase.rpc("get_code_for_order_item", {
        p_order_item_id: body.order_item_id,
        p_code_id: body.code_id,
      });

      if (error) {
        console.error("Error revealing code:", error);
        
        // Check for specific errors
        if (error.message.includes("Rate limit")) {
          return new Response(
            JSON.stringify({ error: "Muitas tentativas. Aguarde 1 hora." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (error.message.includes("Unauthorized")) {
          return new Response(
            JSON.stringify({ error: "Você não tem permissão para ver este código." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (error.message.includes("not paid")) {
          return new Response(
            JSON.stringify({ error: "O pedido ainda não foi pago." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: "Não foi possível revelar o código." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ error: "Código não encontrado." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log audit - successful reveal
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "code_revealed",
        entity_type: "code",
        entity_id: body.code_id,
        details: { order_item_id: body.order_item_id },
      });

      return new Response(
        JSON.stringify({ 
          code: data[0].code,
          product_name: data[0].product_name 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use ?action=get-code-ids or ?action=reveal" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
