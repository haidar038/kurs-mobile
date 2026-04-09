import { supabase } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";

// Use the API key from environment variables
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface WasteAnalysisResult {
  nama_sampah: string;
  jenis_sampah: "Anorganik" | "Organik" | "B3" | "Residu";
  lama_terurai: string;
  estimasi_harga_per_kg: number;
  komposisi_chart: { material: string; persentase: number }[];
  rekomendasi_penanganan: string;
  impact_co2?: string;
}

export const analyzeWasteImage = async (base64Image: string): Promise<WasteAnalysisResult> => {
  if (!API_KEY) {
    throw new Error("API Key Gemini tidak ditemukan.");
  }

  try {
    const prompt = `
      Identifikasi sampah dalam gambar ini. Berikan respons HANYA dalam format JSON valid tanpa markdown block.
      Struktur JSON harus seperti ini:
      {
        "nama_sampah": "string (contoh: Botol Plastik PET)",
        "jenis_sampah": "Anorganik" | "Organik" | "B3" | "Residu",
        "lama_terurai": "string (contoh: 450 Tahun)",
        "estimasi_harga_per_kg": number (dalam Rupiah, contoh: 3500),
        "komposisi_chart": [
          {"material": "nama material", "persentase": number}
        ],
        "rekomendasi_penanganan": "string (langkah singkat untuk daur ulang/buang)",
        "impact_co2": "string (contoh: -50g CO2)"
      }
      Pastikan estimasi harga relevan untuk pengepul di Indonesia.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          ],
        },
      ],
    });

    const text = response.text;
    
    // Clean up potential markdown formatting if Gemini adds it
    const jsonString = text?.replace(/```json/g, "").replace(/```/g, "").trim();
    
    if (!jsonString) {
      throw new Error("Respons kosong dari AI.");
    }

    const data = JSON.parse(jsonString) as WasteAnalysisResult;

    return data;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Gagal menganalisa gambar. Coba lagi.");
  }
};

export const saveAnalysisResult = async (userId: string, imageUrl: string, result: WasteAnalysisResult) => {
  // @ts-ignore
  const { data, error } = await supabase.from("waste_analysis").insert({
    user_id: userId,
    image_url: imageUrl,
    analysis_result: result,
    detected_name: result.nama_sampah,
    detected_type: result.jenis_sampah,
    estimated_value: result.estimasi_harga_per_kg,
  }).select().single();

  if (error) throw error;
  return data;
};
