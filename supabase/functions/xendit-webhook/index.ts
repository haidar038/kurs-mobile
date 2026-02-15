import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook received payload:", JSON.stringify(body, null, 2));

    // Xendit payload can be flat or inside a 'data' object
    const data = body.data || body;
    const referenceId = data.reference_id || data.external_id;
    const status = data.status;

    console.log(`Processing webhook: reference_id=${referenceId}, status=${status}`);

    // Check if this is a successful payment
    // QR Code payments use "SUCCEEDED", Invoices use "PAID", some others use "COMPLETED"
    if (status === "SUCCEEDED" || status === "COMPLETED" || status === "PAID") {
        if (!referenceId) {
            console.error("Webhook Error: reference_id/external_id not found in payload.");
            return new Response(JSON.stringify({ error: "Reference ID missing" }), { status: 400 });
        }

        // Update database using Service Role key
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        console.log(`Updating database for external_id: ${referenceId}`);
        const { error } = await supabaseAdmin
            .from("payments")
            .update({ status: "completed" })
            .eq("external_id", referenceId);

        if (error) {
            console.error("Failed to update payment status in DB:", error);
            throw error;
        }

        console.log(`SUCCESS: Payment ${referenceId} marked as completed in database.`);
    } else {
        console.log(`Skipping update: Status ${status} is not a completion status.`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
