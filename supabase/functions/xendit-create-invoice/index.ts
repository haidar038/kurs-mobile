import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const xenditSecret = Deno.env.get("XENDIT_SECRET_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !xenditSecret) {
      console.error("Missing configuration:", { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey, supabaseServiceKey: !!supabaseServiceKey, xenditSecret: !!xenditSecret });
      throw new Error("Server configuration missing");
    }

    // 1. Authenticate user
    const reqAuthHeader = req.headers.get("Authorization");
    console.log("Auth Header present:", !!reqAuthHeader);

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: reqAuthHeader! },
      },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) {
        console.error("Auth Error details:", authError);
    }

    if (!user) {
      console.error("User is null. Auth failed.");
      throw new Error("Unauthorized: User verification failed");
    }

    const body = await req.json();
    console.log("Request body:", body);

    const { amount, pickup_id } = body;
    if (!amount || !pickup_id) throw new Error("Missing amount or pickup_id");

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) throw new Error("Invalid amount");

    // 2. Generate External ID
    const external_id = `PICKUP-${pickup_id}-${Date.now()}`;

    // 3. Call Xendit API
    const authHeader = btoa(`${xenditSecret}:`);

    console.log("Calling Xendit with:", { reference_id: external_id, amount: numericAmount });

    const xenditResponse = await fetch("https://api.xendit.co/qr_codes", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
        "api-version": "2022-07-31",
      },
      body: JSON.stringify({
        reference_id: external_id,
        type: "DYNAMIC",
        currency: "IDR",
        amount: numericAmount,
      }),
    });

    const xenditData = await xenditResponse.json();
    console.log("Xendit API Response:", JSON.stringify(xenditData, null, 2));

    if (!xenditResponse.ok) {
      console.error("Xendit API Error Response:", xenditData);
      throw new Error(xenditData.message || "Xendit API error");
    }

    // 4. Save to Database
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabaseAdmin.from("payments").insert({
        pickup_request_id: pickup_id,
        amount: numericAmount,
        method: "wallet",
        status: "pending",
        external_id: xenditData.reference_id || external_id,
        qr_string: xenditData.qr_string,
        qr_id: xenditData.id,
    });

    if (dbError) {
        console.error("Database Insert Error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
    }

    return new Response(JSON.stringify({ 
      qr_string: xenditData.qr_string, 
      external_id: xenditData.reference_id || external_id,
      id: xenditData.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
