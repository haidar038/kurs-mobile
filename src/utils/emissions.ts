/**
 * Carbon Emission Factors (kg CO2e per kg of waste)
 * Formula: Saved = mass * (EF_baseline - EF_treatment)
 * 
 * Baseline: Emission if dumped in landfill (standard practice)
 * Treatment: Emission after recycling/composting via Kurs
 * 
 * References: docs/carbon-emission-formula.md
 */

export const EMISSION_FACTORS = {
    aluminium: { baseline: 12.0, treatment: 3.0 }, // Saved: 9.0
    steel: { baseline: 1.67, treatment: 0.2 },     // Saved: 1.47
    plastic: { baseline: 2.5, treatment: 0.8 },   // Saved: 1.7
    paper: { baseline: 0.8, treatment: 0.2 },     // Saved: 0.6
    organic: { baseline: 0.9, treatment: 0.05 },  // Saved: 0.85
    glass: { baseline: 0.6, treatment: 0.1 },     // Saved: 0.5 (estimated)
    electronic: { baseline: 2.0, treatment: 0.5 }, // Saved: 1.5 (estimated)
    other: { baseline: 1.0, treatment: 0.5 },      // Saved: 0.5 (fallback)
} as const;

/**
 * Maps database waste types to emission factor keys.
 */
export const WASTE_TYPE_MAP: Record<string, keyof typeof EMISSION_FACTORS> = {
    organic: "organic",
    plastic: "plastic",
    paper: "paper",
    metal: "aluminium", // Assuming aluminium/scrap focus
    glass: "glass",
    electronic: "electronic",
    hazardous: "other", // Hazardous usually has low CO2 saving, focus is safety
    other: "other",
};

/**
 * Calculates carbon emission savings in kg CO2e.
 */
export function calculateCarbonSaved(wasteType: string, weightKg: number): number {
    const key = WASTE_TYPE_MAP[wasteType] || "other";
    const factor = EMISSION_FACTORS[key];
    const saved = weightKg * (factor.baseline - factor.treatment);
    return Math.max(0, saved);
}
