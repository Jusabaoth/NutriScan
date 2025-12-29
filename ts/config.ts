// ===================================
// API CONFIGURATION
// ===================================

export const API_CONFIG = {
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  MODEL_NAME: 'gemini-2.5-flash',
  MAX_TOKENS: 8192,
  TEMPERATURE: 0.7,
};

export const BPOM_LIMITS = {
  CALORIES: 2000,
  TOTAL_FAT: 67,
  SATURATED_FAT: 20,
  TRANS_FAT: 2,
  CHOLESTEROL: 300,
  SODIUM: 2000,
  TOTAL_CARBOHYDRATE: 300,
  DIETARY_FIBER: 25,
  SUGARS: 50,
  PROTEIN: 50,

  WARNING_THRESHOLD: {
    FAT: 15,
    SATURATED_FAT: 20,
    SODIUM: 20,
    SUGARS: 15,
  },

  // Red flags (high content per 100g)
  HIGH_CONTENT_PER_100G: {
    FAT: 17.5, // grams
    SATURATED_FAT: 5, // grams
    SUGARS: 22.5, // grams
    SODIUM: 600, // mg
  },
};

// ===================================
// WHO REGULATIONS (World Health Organization)

export const WHO_LIMITS = {
  // Daily limits for adults (2000 kcal diet)
  CALORIES: 2000, // kcal per day
  TOTAL_FAT: 66, // grams per day (<30% of total energy)
  SATURATED_FAT: 22, // grams per day (<10% of total energy)
  TRANS_FAT: 2.2, // grams per day (<1% of total energy)
  CHOLESTEROL: 300, // mg per day
  SODIUM: 2000, // mg per day (WHO recommends <2g sodium = 5g salt)
  TOTAL_CARBOHYDRATE: 260, // grams per day
  FREE_SUGARS: 50, // grams per day (<10% of total energy, ideally <5%)
  DIETARY_FIBER: 25, // grams per day (minimum)
  PROTEIN: 50, // grams per day

  // WHO recommendations
  RECOMMENDATIONS: {
    FRUIT_VEG_MIN: 400, // grams per day (5 portions)
    WHOLE_GRAINS: true, // Prefer whole grains
    LEGUMES: true, // Include legumes, nuts, seeds
    LIMIT_PROCESSED: true, // Limit ultra-processed foods
  },

  // Risk levels (per 100g)
  HIGH_CONTENT_PER_100G: {
    FAT: 17.5, // grams
    SATURATED_FAT: 5, // grams
    SUGARS: 22.5, // grams (free sugars)
    SODIUM: 600, // mg
  },

  // Medium risk (per 100g)
  MEDIUM_CONTENT_PER_100G: {
    FAT: 3, // grams
    SATURATED_FAT: 1.5, // grams
    SUGARS: 5, // grams
    SODIUM: 300, // mg
  },
};

// ===================================
// DISEASE-SPECIFIC NUTRITION LIMITS
// ===================================

export const DISEASE_LIMITS = {
  DIABETES: {
    SUGARS_MAX: 25, // grams per day
    CARBS_PERCENTAGE: 45, // % of total calories
    FIBER_MIN: 30, // grams per day
  },
  HYPERTENSION: {
    SODIUM_MAX: 1500, // mg per day (stricter than general)
    POTASSIUM_MIN: 3500, // mg per day
  },
  CARDIOVASCULAR: {
    SATURATED_FAT_MAX: 13, // grams per day (<7% of total energy)
    TRANS_FAT_MAX: 0, // Should be eliminated
    CHOLESTEROL_MAX: 200, // mg per day
    OMEGA3_MIN: 250, // mg per day
  },
  KIDNEY_DISEASE: {
    PROTEIN_MAX: 40, // grams per day (reduced)
    SODIUM_MAX: 1500, // mg per day
    POTASSIUM_MAX: 2000, // mg per day
    PHOSPHORUS_MAX: 800, // mg per day
  },
  OBESITY: {
    CALORIES_DEFICIT: 500, // kcal reduction from maintenance
    PROTEIN_MIN: 70, // grams per day (to preserve muscle)
    FIBER_MIN: 30, // grams per day
  },
};

// ===================================
// AI PROMPT TEMPLATES
// ===================================

export const PROMPTS = {
  // Scanner AI Analysis Prompt
  SCANNER_ANALYSIS: `Anda adalah ahli nutrisi yang menganalisis label nutrisi produk makanan.

INFORMASI PENGGUNA:
{USER_HEALTH_DATA}

TUGAS ANDA:
1. Ekstrak informasi nutrisi dari gambar label
2. Identifikasi semua bahan/ingredients
3. Analisis risiko berdasarkan kondisi kesehatan pengguna
4. Berikan rekomendasi personal yang spesifik
5. Evaluasi compliance dengan regulasi BPOM dan WHO

FORMAT OUTPUT (JSON):
{
  "productName": "nama produk",
  "nutritionFacts": {
    "servingSize": "takaran saji",
    "calories": angka,
    "totalFat": angka,
    "saturatedFat": angka,
    "transFat": angka,
    "cholesterol": angka,
    "sodium": angka,
    "totalCarbohydrate": angka,
    "dietaryFiber": angka,
    "sugars": angka,
    "protein": angka
  },
  "ingredients": ["bahan1", "bahan2"],
  "riskAssessment": {
    "level": "low/medium/high",
    "factors": ["faktor risiko 1", "faktor risiko 2"],
    "score": 0-100
  },
  "recommendations": [
    {
      "category": "avoid/limit/safe/beneficial",
      "message": "pesan singkat",
      "reason": "alasan detail"
    }
  ],
  "bpomCompliance": {
    "compliant": true/false,
    "violations": ["pelanggaran jika ada"],
    "warnings": ["peringatan jika ada"]
  },
  "whoCompliance": {
    "compliant": true/false,
    "violations": ["pelanggaran jika ada"],
    "warnings": ["peringatan jika ada"]
  },
  "analysisText": "penjelasan lengkap dalam bahasa Indonesia"
}

REGULASI BPOM (per hari):
- Lemak: max 67g, Lemak Jenuh: max 20g, Kolesterol: max 300mg
- Sodium: max 2000mg, Gula: max 50g, Serat: min 25g

REGULASI WHO (per hari):
- Lemak: max 66g, Lemak Jenuh: max 22g (10% energi)
- Sodium: max 2000mg, Gula Bebas: max 50g (10% energi, ideal <5%)
- Serat: min 25g, Hindari lemak trans

PERTIMBANGAN KHUSUS BERDASARKAN PENYAKIT:
- Diabetes: batasi gula <25g/hari, tingkatkan serat >30g/hari
- Hipertensi: batasi sodium <1500mg/hari
- Jantung: batasi lemak jenuh <13g/hari, hindari lemak trans
- Ginjal: batasi protein <40g/hari, sodium <1500mg/hari

Berikan analisis yang DETAIL dan PERSONAL!`,

  // Meal Planner AI Generation Prompt
  MEAL_PLANNER: `Anda adalah ahli nutrisi dan meal planner yang membuat rencana makan personal.

PREFERENSI PENGGUNA:
{USER_PREFERENCES}

TUGAS ANDA:
Buat rencana makan untuk {DURATION} minggu dengan detail:
1. Menu untuk setiap hari (Sarapan, Makan Siang, Makan Malam, Snack)
2. Resep lengkap dengan bahan dan cara masak
3. Perhitungan nutrisi akurat (kalori, protein, karbohidrat, lemak)
4. Sesuai budget maksimal Rp {BUDGET}
5. Hindari alergi: {ALLERGIES}
6. Pertimbangkan kondisi: {CONDITIONS}

FORMAT OUTPUT (JSON):
{
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "dayName": "Senin",
          "meals": [
            {
              "name": "Nama makanan",
              "description": "Deskripsi singkat",
              "time": "07:00",
              "type": "Sarapan",
              "calories": angka,
              "protein": angka,
              "carbs": angka,
              "fat": angka,
              "ingredients": ["bahan1", "bahan2"],
              "recipe": "Cara memasak detail"
            }
          ],
          "totalCalories": angka,
          "totalProtein": angka,
          "totalCarbs": angka,
          "totalFat": angka
        }
      ]
    }
  ],
  "targetDailyCalories": angka,
  "targetProtein": angka,
  "targetCarbs": angka,
  "targetFat": angka
}

PRINSIP DIET {DIET_GOAL}:
{DIET_PRINCIPLES}

PERHITUNGAN TARGET NUTRISI:
- Gunakan rumus Harris-Benedict untuk BMR
- Sesuaikan dengan activity level
- Distribusi makro sesuai diet goal

Buat menu yang BERVARIASI, ENAK, dan MUDAH dibuat!`,

  // Diet Principles
  DIET_PRINCIPLES: {
    'Keto': 'Tinggi lemak (70-75%), protein sedang (20-25%), sangat rendah karbohidrat (5-10%). Fokus: daging, ikan, telur, sayuran rendah karbo, alpukat, nuts.',
    'Atkins': 'Fase bertahap rendah karbo. Fase 1: <20g karbo/hari, tingkatkan bertahap. Fokus: protein tinggi, lemak sehat.',
    'Mediterania': 'Tinggi buah, sayur, whole grains, ikan, minyak zaitun. Rendah daging merah. Fokus: makanan segar, lemak sehat.',
    'Paleo': 'Makanan alami seperti era paleolitik. Fokus: daging, ikan, telur, sayur, buah, nuts. Hindari: grains, dairy, processed food.',
    'Vegetarian/Vegan': 'Tanpa daging (vegetarian) atau tanpa produk hewani (vegan). Fokus: tahu, tempe, kacang-kacangan, sayuran, buah.',
    'DASH': 'Untuk hipertensi. Rendah sodium (<1500mg), tinggi kalium, kalsium, magnesium. Fokus: sayur, buah, whole grains, low-fat dairy.',
    'Intermittent Fasting': 'Pola makan berselang (16:8, 18:6, dll). Fokus: nutrisi seimbang dalam eating window.',
    'Mayo Diet': 'Diet seimbang Mayo Clinic. Fokus: sayur, buah, whole grains, lean protein, lemak sehat. Porsi terkontrol.',
  },
};

// ===================================
// APP CONSTANTS
// ===================================

export const APP_CONSTANTS = {
  STORAGE_KEYS: {
    HEALTH_DATA: 'nutriscan_health_data',
    SCAN_RESULTS: 'nutriscan_scan_results',
    MEAL_PLANS: 'nutriscan_meal_plans',
    CURRENT_MEAL_PLAN: 'nutriscan_current_meal_plan',
    USER_PROFILE: 'nutriscan_user_profile',
  },

  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],

  ACTIVITY_MULTIPLIERS: {
    'Sedentary': 1.2,
    'Light': 1.375,
    'Moderate': 1.55,
    'Active': 1.725,
    'Very Active': 1.9,
  },

  BMR_FORMULA: {
    // Harris-Benedict equation
    MALE: (weight: number, height: number, age: number) =>
      88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age),
    FEMALE: (weight: number, height: number, age: number) =>
      447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age),
  },
};

// ===================================
// INDONESIAN TRANSLATIONS
// ===================================

export const TRANSLATIONS = {
  DAYS: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  MEAL_TYPES: {
    'Sarapan': 'Breakfast',
    'Makan Siang': 'Lunch',
    'Makan Malam': 'Dinner',
    'Snack': 'Snack',
  },
  RISK_LEVELS: {
    'low': 'Rendah',
    'medium': 'Sedang',
    'high': 'Tinggi',
  },
};
