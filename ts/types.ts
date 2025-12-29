
// ===================================
// HEALTH & DISEASE TYPES
// ===================================

export type AllergyType =
    | 'susu'
    | 'kacang_tanah'
    | 'kacang_pohon'
    | 'seafood'
    | 'gluten'
    | 'kedelai'
    | 'telur';

export type MetabolicDisease =
    | 'diabetes'
    | 'obesitas'
    | 'dislipidemia'
    | 'hipertensi'
    | 'sindrom_metabolik';

export type CardiovascularDisease =
    | 'jantung_koroner'
    | 'gagal_jantung'
    | 'stroke_iskemik'
    | 'aritmia';

export type LungDisease =
    | 'ppok'
    | 'asma_kronis'
    | 'bronkitis_kronis';

export type Cancer =
    | 'kanker_payudara'
    | 'kanker_serviks'
    | 'kanker_kolorektal'
    | 'kanker_paru'
    | 'kanker_prostat';

export type KidneyDisease =
    | 'gagal_ginjal_kronis'
    | 'batu_ginjal'
    | 'nefritis';

export interface HealthData {
    allergies: AllergyType[];
    metabolicDiseases: MetabolicDisease[];
    cardiovascularDiseases: CardiovascularDisease[];
    lungDiseases: LungDisease[];
    cancers: Cancer[];
    kidneyDiseases: KidneyDisease[];
    otherConditions: string;
    timestamp: number;
}

// ===================================
// NUTRITION TYPES
// ===================================

export interface NutritionFacts {
    servingSize: string;
    calories: number;
    totalFat: number;
    saturatedFat: number;
    transFat: number;
    cholesterol: number;
    sodium: number;
    totalCarbohydrate: number;
    dietaryFiber: number;
    sugars: number;
    protein: number;
    vitaminA?: number;
    vitaminC?: number;
    calcium?: number;
    iron?: number;
    [key: string]: string | number | undefined; // For additional nutrients
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskAssessment {
    level: RiskLevel;
    factors: string[];
    score: number; // 0-100
}

export interface Recommendation {
    category: 'avoid' | 'limit' | 'safe' | 'beneficial';
    message: string;
    reason: string;
}

export interface BPOMCompliance {
    compliant: boolean;
    violations: string[];
    warnings: string[];
}

export interface WHOCompliance {
    compliant: boolean;
    violations: string[];
    warnings: string[];
}

export interface ScanResult {
    id: string;
    productName: string;
    imageUrl: string;
    nutritionFacts: NutritionFacts;
    ingredients: string[];
    riskAssessment: RiskAssessment;
    recommendations: Recommendation[];
    bpomCompliance: BPOMCompliance;
    whoCompliance: WHOCompliance;
    healthData: HealthData;
    analysisText: string;
    timestamp: number;
}

// ===================================
// MEAL PLANNER TYPES
// ===================================

export type DietGoal =
    | 'Keto'
    | 'Atkins'
    | 'Mediterania'
    | 'Paleo'
    | 'Vegetarian/Vegan'
    | 'DASH'
    | 'Intermittent Fasting'
    | 'Mayo Diet';

export type Gender = 'Laki-laki' | 'Perempuan';

export type ActivityLevel =
    | 'Sedentary'
    | 'Light'
    | 'Moderate'
    | 'Active'
    | 'Very Active';

export type MealType = 'Sarapan' | 'Makan Siang' | 'Makan Malam' | 'Snack';

export interface PhysicalProfile {
    age: number;
    gender: Gender;
    weight: number; // kg
    height: number; // cm
    activityLevel: ActivityLevel;
}

export interface MealPlanPreferences {
    dietGoal: DietGoal;
    physicalProfile: PhysicalProfile;
    duration: number; // weeks
    budget: number; // Rupiah
    conditions: string[];
    allergies: string[];
    otherNotes: string;
}

export interface MealItem {
    id: string;
    name: string;
    description: string;
    time: string; // e.g., "07:00"
    type: MealType;
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    ingredients: string[];
    recipe?: string;
}

export interface DayMeals {
    day: number; // 1-7 for days in a week
    dayName: string; // e.g., "Senin", "Selasa"
    meals: MealItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
}

export interface WeekMeals {
    week: number; // 1-4
    days: DayMeals[];
}

export interface MealPlan {
    id: string;
    userId: string;
    preferences: MealPlanPreferences;
    weeks: WeekMeals[];
    targetDailyCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    createdAt: number;
    updatedAt: number;
}

export interface NutritionSummary {
    currentCalories: number;
    targetCalories: number;
    currentProtein: number;
    targetProtein: number;
    currentCarbs: number;
    targetCarbs: number;
    currentFat: number;
    targetFat: number;
    percentageComplete: number;
}

// ===================================
// API TYPES
// ===================================

export interface GeminiRequest {
    contents: {
        parts: {
            text?: string;
            inlineData?: {
                mimeType: string;
                data: string; // base64 encoded
            };
        }[];
    }[];
}

export interface GeminiResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
        finishReason: string;
        safetyRatings: {
            category: string;
            probability: string;
        }[];
    }[];
}

// ===================================
// UTILITY TYPES
// ===================================

export interface StorageData {
    healthData?: HealthData;
    scanResults?: ScanResult[];
    mealPlans?: MealPlan[];
    currentMealPlan?: MealPlan;
}

export interface AppConfig {
    geminiApiKey: string;
    geminiEndpoint: string;
    bpomLimits: Record<string, number>;
    whoLimits: Record<string, number>;
}
