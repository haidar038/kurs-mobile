import { supabase } from "@/lib/supabase";
import Groq from "groq-sdk";

// Use GROQ API key from environment variables
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";

const groq = new Groq({ apiKey: GROQ_API_KEY });

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
    if (!GROQ_API_KEY) {
        throw new Error("API Key GROQ tidak ditemukan.");
    }

    try {
        const prompt = `Identifikasi sampah dalam gambar ini dan berikan analisis lengkap dalam format JSON.

Analisis harus mencakup:
1. Nama spesifik sampah (contoh: Botol Plastik PET, Kardus Bekas, dll)
2. Jenis sampah: Anorganik, Organik, B3, atau Residu
3. Estimasi lama terurai (contoh: "450 Tahun", "6 Bulan", "Tidak Terurai")
4. Estimasi harga per kg untuk pengepul di Indonesia (dalam Rupiah)
5. Komposisi material dengan persentase
6. Rekomendasi penanganan yang praktis
7. Estimasi dampak CO2 jika didaur ulang

Berikan respons dalam format JSON yang valid.`;

        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            temperature: 0.7,
            max_completion_tokens: 2048,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "waste_analysis",
                    strict: false, // Use best-effort mode for broader compatibility
                    schema: {
                        type: "object",
                        properties: {
                            nama_sampah: {
                                type: "string",
                                description: "Nama spesifik sampah yang teridentifikasi",
                            },
                            jenis_sampah: {
                                type: "string",
                                enum: ["Anorganik", "Organik", "B3", "Residu"],
                                description: "Kategori jenis sampah",
                            },
                            lama_terurai: {
                                type: "string",
                                description: "Estimasi waktu terurai (contoh: 450 Tahun)",
                            },
                            estimasi_harga_per_kg: {
                                type: "number",
                                description: "Harga per kg dalam Rupiah untuk pengepul Indonesia",
                            },
                            komposisi_chart: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        material: { type: "string" },
                                        persentase: { type: "number" },
                                    },
                                    required: ["material", "persentase"],
                                },
                                description: "Komposisi material dengan persentase",
                            },
                            rekomendasi_penanganan: {
                                type: "string",
                                description: "Langkah praktis untuk penanganan sampah",
                            },
                            impact_co2: {
                                type: "string",
                                description: "Estimasi dampak CO2 (contoh: -50g CO2)",
                            },
                        },
                        required: ["nama_sampah", "jenis_sampah", "lama_terurai", "estimasi_harga_per_kg", "komposisi_chart", "rekomendasi_penanganan"],
                    },
                },
            },
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error("Respons kosong dari AI.");
        }

        const data = JSON.parse(content) as WasteAnalysisResult;

        // Validate required fields
        if (!data.nama_sampah || !data.jenis_sampah || !data.komposisi_chart) {
            throw new Error("Data analisis tidak lengkap.");
        }

        return data;
    } catch (error) {
        console.error("GROQ Analysis Error:", error);
        if (error instanceof Error) {
            throw new Error(`Gagal menganalisa gambar: ${error.message}`);
        }
        throw new Error("Gagal menganalisa gambar. Coba lagi.");
    }
};

export const saveAnalysisResult = async (userId: string, imageUrl: string, result: WasteAnalysisResult) => {
    const { data, error } = await supabase
        .from("waste_analysis")
        .insert({
            user_id: userId,
            image_url: imageUrl,
            analysis_result: result as unknown as any, // Cast to any for JSON compatibility
            detected_name: result.nama_sampah,
            detected_type: result.jenis_sampah,
            estimated_value: result.estimasi_harga_per_kg,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};
