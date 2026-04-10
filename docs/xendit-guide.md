That is a solid, modern stack! Since you are using **Supabase**, you have a significant advantage: you can handle the "Backend" part of the Xendit integration using **Supabase Edge Functions**.

This keeps your Secret Key secure (not in the app) and allows you to listen for payment webhooks without setting up a separate Express server.

---

## 1. The "Secure" Step: Supabase Edge Function

Instead of a traditional backend, create a Supabase Edge Function to communicate with Xendit.

### Create the Function

```bash
supabase functions new xendit-qris

```

### Logic inside `index.ts`

Use this function to generate the QR string and return it to your React Native app.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
    const { amount, external_id } = await req.json();

    // Get your Xendit Secret Key from Supabase Secrets
    const XENDIT_SECRET = Deno.env.get("XENDIT_SECRET_KEY")!;
    const authHeader = btoa(`${XENDIT_SECRET}:`);

    const response = await fetch("https://api.xendit.co/qr_codes", {
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
            amount: amount,
        }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});
```

---

## 2. React Native (TypeScript) Integration

In your app, call this Edge Function to get the `qr_string` and render it.

### Required Libraries

```bash
npm install react-native-qrcode-svg react-native-svg

```

### The Officer QR Component

```tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "./supabaseClient"; // Your Supabase config

const QRISGenerator = ({ amount }: { amount: number }) => {
    const [qrString, setQrString] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke("xendit-qris", {
            body: { amount, external_id: `POS-${Date.now()}` },
        });

        if (data) setQrString(data.qr_string);
        setLoading(false);
    };

    return (
        <View style={{ alignItems: "center", padding: 20 }}>
            {qrString ? (
                <View style={{ backgroundColor: "white", padding: 15, borderRadius: 10 }}>
                    <QRCode value={qrString} size={200} />
                    <Text style={{ marginTop: 10, fontWeight: "bold" }}>Scan to Pay Rp {amount}</Text>
                </View>
            ) : (
                <TouchableOpacity onPress={handleGenerate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#000" /> : <Text>Generate QRIS</Text>}
                </TouchableOpacity>
            )}
        </View>
    );
};
```

---

## 3. Real-time Payment Updates

Since you are using Supabase, you don't need to manually poll the Xendit API to see if the customer paid.

1. **Webhook:** Set your Xendit Webhook URL to a **second** Supabase Edge Function (e.g., `xendit-webhook`).
2. **Database Update:** When that function receives a success signal from Xendit, have it update a `transactions` table in your Supabase DB (e.g., set `status` to `'COMPLETED'`).
3. **Real-time Subscription:** In your React Native app, subscribe to that specific row:

```typescript
useEffect(() => {
    const channel = supabase
        .channel("schema-db-changes")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions", filter: `id=eq.${currentTxId}` }, (payload) => {
            if (payload.new.status === "COMPLETED") {
                alert("Payment Received by Officer!");
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}, [currentTxId]);
```

---

## Summary of Workflow

- **Security:** Secret Key stays in **Supabase Secrets**.
- **QR Generation:** Handled by **Supabase Edge Functions**.
- **QR Display:** Rendered via **`react-native-qrcode-svg`**.
- **Confirmation:** **Xendit Webhook** updates DB **Supabase Real-time** notifies Officer app.

Would you like me to write the code for the **Webhook Edge Function** that updates your Supabase database automatically?
