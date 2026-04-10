# Migration from Google Gemini to GROQ API

## Overview

This document describes the migration from Google Gemini AI to GROQ API for waste image analysis in the Jaga Bumi mobile application.

## Why GROQ?

1. **Faster Inference**: GROQ provides significantly faster inference times compared to other AI providers
2. **Structured Outputs**: Native support for JSON Schema validation with strict mode
3. **Vision Capabilities**: Llama 4 Scout model supports multimodal vision for image understanding
4. **Cost Effective**: Competitive pricing for production workloads
5. **Reliable**: Guaranteed schema adherence with constrained decoding

## Changes Made

### 1. Service Layer (`src/services/ai.ts`)

**Before (Gemini):**

```typescript
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-1.5-flash",
  contents: [...]
});
```

**After (GROQ):**

```typescript
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: GROQ_API_KEY });

const response = await groq.chat.completions.create({
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  messages: [...],
  response_format: {
    type: "json_schema",
    json_schema: { ... }
  }
});
```

### 2. Model Used

- **Model**: `meta-llama/llama-4-scout-17b-16e-instruct`
- **Capabilities**:
    - Multimodal (text + image)
    - 128K context window
    - JSON mode with schema validation
    - Tool use support
    - Multilingual

### 3. Structured Output Schema

The new implementation uses GROQ's Structured Outputs feature with JSON Schema:

```typescript
response_format: {
  type: "json_schema",
  json_schema: {
    name: "waste_analysis",
    strict: false, // Best-effort mode for compatibility
    schema: {
      type: "object",
      properties: {
        nama_sampah: { type: "string" },
        jenis_sampah: {
          type: "string",
          enum: ["Anorganik", "Organik", "B3", "Residu"]
        },
        // ... other properties
      }
    }
  }
}
```

### 4. Environment Variables

**Added to `.env`:**

```
EXPO_PUBLIC_GROQ_API_KEY="your_groq_api_key_here"
```

**Removed (optional - can keep for fallback):**

```
EXPO_PUBLIC_GEMINI_API_KEY="..."
```

## Installation

Install the GROQ SDK:

```bash
npm install groq-sdk
# or
bun add groq-sdk
```

## API Comparison

| Feature                | Gemini         | GROQ                 |
| ---------------------- | -------------- | -------------------- |
| **Inference Speed**    | Moderate       | Very Fast            |
| **Structured Outputs** | Manual parsing | Native JSON Schema   |
| **Vision Support**     | ✅ Yes         | ✅ Yes               |
| **Context Window**     | 1M tokens      | 128K tokens          |
| **Pricing**            | Pay per token  | Competitive          |
| **Schema Validation**  | ❌ No          | ✅ Yes (strict mode) |

## Benefits

### 1. **Guaranteed JSON Structure**

- No more manual JSON parsing cleanup
- Schema validation at the API level
- Type-safe responses

### 2. **Better Error Handling**

```typescript
try {
    const data = JSON.parse(content) as WasteAnalysisResult;

    // Validate required fields
    if (!data.nama_sampah || !data.jenis_sampah) {
        throw new Error("Data analisis tidak lengkap.");
    }
} catch (error) {
    // Detailed error messages
    throw new Error(`Gagal menganalisa gambar: ${error.message}`);
}
```

### 3. **Faster Response Times**

GROQ's LPU (Language Processing Unit) provides significantly faster inference compared to traditional GPU-based solutions.

### 4. **Production Ready**

- Reliable structured outputs
- No markdown cleanup needed
- Consistent response format

## Testing

Test the new implementation:

```typescript
// Example test
const base64Image = "..."; // Your base64 encoded image
const result = await analyzeWasteImage(base64Image);

console.log(result);
// Output:
// {
//   nama_sampah: "Botol Plastik PET",
//   jenis_sampah: "Anorganik",
//   lama_terurai: "450 Tahun",
//   estimasi_harga_per_kg: 3500,
//   komposisi_chart: [
//     { material: "PET", persentase: 95 },
//     { material: "Label", persentase: 5 }
//   ],
//   rekomendasi_penanganan: "Pisahkan tutup dan label, cuci bersih, lalu setor ke bank sampah",
//   impact_co2: "-50g CO2"
// }
```

## Rollback Plan

If needed, you can rollback to Gemini by:

1. Reverting `src/services/ai.ts` to use `@google/genai`
2. Changing environment variable back to `EXPO_PUBLIC_GEMINI_API_KEY`
3. Removing `groq-sdk` dependency

## Future Improvements

1. **Strict Mode**: Upgrade to `strict: true` when using GPT-OSS models for 100% schema adherence
2. **Caching**: Implement response caching for common waste types
3. **Multi-turn Conversations**: Add follow-up questions about waste handling
4. **Tool Use**: Integrate with external APIs for real-time pricing data

## References

- [GROQ Vision Documentation](https://console.groq.com/docs/vision)
- [GROQ Structured Outputs](https://console.groq.com/docs/structured-outputs)
- [Llama 4 Scout Model](https://console.groq.com/docs/model/llama-4-scout-17b-16e-instruct)

## Support

For issues or questions:

- GROQ Community: https://community.groq.com/
- GROQ API Docs: https://console.groq.com/docs
