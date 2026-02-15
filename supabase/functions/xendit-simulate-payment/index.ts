import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const xenditSecret = Deno.env.get("XENDIT_SECRET_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !xenditSecret) {
      throw new Error("Server configuration missing");
    }

    // Authenticate user
    const reqAuthHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: reqAuthHeader! } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const body = await req.json();
    const { external_id, qr_code_id, amount } = body;

    if (!external_id && !qr_code_id) {
        throw new Error("Missing external_id or qr_code_id");
    }

    // Call Xendit Simulate API
    const authHeader = btoa(`${xenditSecret}:`);

    const idToSimulate = qr_code_id || external_id;
    const url = `https://api.xendit.co/qr_codes/${idToSimulate}/payments/simulate`;

    const xenditResponse = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/json",
            "api-version": "2022-07-31",
        },
        body: JSON.stringify({
             amount: Number(amount)
        })
    });
    
    const xenditData = await xenditResponse.json();
    
    if (!xenditResponse.ok) {
        console.error("Xendit Simulation Error:", xenditData);
        throw new Error(xenditData.message || "Failed to simulate payment");
    }

    return new Response(JSON.stringify(xenditData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Simulation Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
