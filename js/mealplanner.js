let currentMealPlan = null;
let currentWeek = 1;
let currentDay = 1;
let isCreating = false;
let isCancelled = false; // Flag to prevent fallback after cancel

const STORAGE_KEY_CURRENT_USER = 'nutriscan_current_user';
const STORAGE_KEY_USER_DATA = 'nutriscan_user_data_';

// INITIALIZATION

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
    loadExistingMealPlan();
});

function initializeApp() {
    // Check if meal plan exists
    const existingPlan = localStorage.getItem('nutriscan_current_meal_plan');
    if (existingPlan) {
        currentMealPlan = JSON.parse(existingPlan);
        showMealPlanView();
    } else {
        showBeforeView();
    }
}

// AUTHENTICATION

function checkAuthStatus() {
    const currentUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (currentUser) {
        const userData = getUserData(currentUser);
        if (userData) {
            loadUserProfile();
            initializeApp();
        } else {
            logout();
        }
    } else {
        logout();
    }
}

function getUserData(email) {
    const userDataJson = localStorage.getItem(STORAGE_KEY_USER_DATA + email);
    return userDataJson ? JSON.parse(userDataJson) : null;
}

function loadUserProfile() {
    const currentUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (currentUser) {
        const userData = getUserData(currentUser);
        if (userData && userData.name) {
            document.getElementById('userName').textContent = userData.name;
            document.getElementById('userAvatar').textContent = userData.name.charAt(0).toUpperCase();
        }
    }
}


// EVENT LISTENERS


function setupEventListeners() {

    const ctaButton = document.getElementById('ctaButton');
    if (ctaButton) {
        ctaButton.addEventListener('click', scrollToForm);
    }
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', resetMealPlan);
    }
    setupFormValidation();
}

function scrollToForm() {
    const formSection = document.getElementById('formSection');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// FORM HANDLING

function setupFormValidation() {
    // ===== WEIGHT SYNC & HEIGHT SYNC removed =====
    // Inputs are now handled in Dashboard/Index.html

    const goalRadios = document.querySelectorAll('input[name="goal"]');
    const customGoalBox = document.getElementById('customGoalBox');

    if (goalRadios && customGoalBox) {
        goalRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'Custom') {
                    customGoalBox.style.display = 'block';
                } else {
                    customGoalBox.style.display = 'none';
                }
            });
        });
    }

    // ===== DURATION CARDS =====
    const durationCards = document.querySelectorAll('.duration-card');
    durationCards.forEach(card => {
        card.addEventListener('click', () => {
            durationCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });

    // ===== BUDGET =====
    const budgetRange = document.getElementById('budgetRange');
    const budgetValue = document.getElementById('budgetValue');

    if (budgetRange && budgetValue) {
        budgetRange.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const budgetTexts = ['Ekonomis (< Rp 30k)', 'Standar (30-75k)', 'Premium (> 75k)'];
            budgetValue.textContent = budgetTexts[value - 1] || 'Standar';
        });
    }

    const otherConditionTile = document.getElementById('otherConditionTile');
    const otherConditionBox = document.getElementById('otherConditionBox');

    if (otherConditionTile && otherConditionBox) {
        const otherCheckbox = otherConditionTile.querySelector('input[type="checkbox"]');
        if (otherCheckbox) {
            otherCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    otherConditionBox.style.display = 'block';
                } else {
                    otherConditionBox.style.display = 'none';
                }
            });
        }
    }

    // ===== ALLERGIES =====
    const tagInput = document.getElementById('tagInput');
    const tagContainer = document.getElementById('tagContainer');
    let allergies = [];

    if (tagInput && tagContainer) {
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = tagInput.value.trim();
                if (value && !allergies.includes(value)) {
                    allergies.push(value);
                    renderTags();
                    tagInput.value = '';
                }
            }
        });
    }

    function renderTags() {
        if (!tagContainer) return;
        tagContainer.innerHTML = allergies.map(allergy => `
            <div class="chip">
                ${allergy}
                <div class="remove" onclick="removeTag('${allergy}')">×</div>
            </div>
        `).join('');
    }

    // ===== ANALYZE BUTTON =====
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', generateMealPlan);
    }
}

function collectFormData() {
    // Diet Goal
    const goalRadio = document.querySelector('input[name="goal"]:checked');
    if (!goalRadio) {
        throw new Error('Pilih tujuan diet Anda');
    }
    let dietGoal = goalRadio.value;

    // Handle custom goal
    if (dietGoal === 'Custom') {
        const customGoal = document.getElementById('customGoal')?.value;
        if (!customGoal || customGoal.trim() === '') {
            throw new Error('Tuliskan tujuan diet custom Anda');
        }
        dietGoal = customGoal;
    }

    // Retrieve Health Profile from LocalStorage
    const healthDataStr = localStorage.getItem('nutriscan_health_data');
    if (!healthDataStr) {
        throw new Error('Profil kesehatan belum diatur. Silakan atur di Dashboard terlebih dahulu.');
    }

    let healthData;
    try {
        healthData = JSON.parse(healthDataStr);
    } catch (e) {
        throw new Error('Data profil kesehatan rusak. Silakan atur ulang di Dashboard.');
    }

    const { physical, healthConditions, allergies: allergiesStr } = healthData;

    if (!physical || !physical.age || !physical.weight || !physical.height) {
        throw new Error('Profil fisik tidak lengkap. Silakan perbarui di Dashboard.');
    }

    // Physical Profile
    const age = parseInt(physical.age);
    const gender = physical.gender === 'male' ? 'Pria' : 'Wanita';
    const weight = parseFloat(physical.weight);
    const height = parseFloat(physical.height);
    const activityLevel = physical.activity;

    // Normalize Activity Level
    const activityMap = {
        'sedentary': 'Sedentary',
        'light': 'Light',
        'moderate': 'Moderate',
        'active': 'Active'
    };
    const normalizedActivity = activityMap[activityLevel] || 'Moderate';

    // Duration
    const durationCard = document.querySelector('.duration-card.active');
    if (!durationCard) {
        throw new Error('Pilih durasi meal plan');
    }
    const durationText = durationCard.dataset.duration;

    // Convert duration text to weeks
    let duration = 1;
    if (durationText === 'Seminggu') duration = 1;
    else if (durationText === 'Sebulan') duration = 4;
    else if (durationText === '3 Bulan') duration = 12;
    else if (durationText === 'Setahun') duration = 52;

    // Budget
    const budgetRange = document.getElementById('budgetRange')?.value || '2';
    const budgetValues = { 1: 25000, 2: 50000, 3: 100000 };
    const budget = budgetValues[parseInt(budgetRange)] || 50000;

    // Conditions
    let conditions = [];
    if (healthData.conditions && Array.isArray(healthData.conditions)) {
        // New array format
        conditions = [...healthData.conditions];
    } else if (healthData.healthConditions) {
        // Legacy or string format
        conditions = healthData.healthConditions.split(',').map(c => c.trim()).filter(c => c);
    }

    if (healthData.otherConditions) {
        const others = healthData.otherConditions.split(',').map(c => c.trim()).filter(c => c);
        conditions.push(...others);
    }

    // Allergies
    let allergies = [];
    if (healthData.allergies) {
        if (Array.isArray(healthData.allergies)) {
            allergies = [...healthData.allergies];
        } else {
            allergies = healthData.allergies.split(',').map(a => a.trim()).filter(a => a);
        }
    }

    const otherNotes = '';

    return {
        dietGoal,
        physicalProfile: {
            age,
            gender,
            weight,
            height,
            activityLevel: normalizedActivity
        },
        duration,
        budget,
        conditions,
        allergies,
        otherNotes
    };
}

// MEAL PLAN GENERATION

async function generateMealPlan() {
    if (isCreating) return;

    try {
        // Collect form data
        const preferences = collectFormData();
        console.log('📋 Preferences collected:', preferences);

        // Show loading
        isCreating = true;
        isCancelled = false; // Reset cancel flag for new generation
        showLoadingState();

        // Set 1-minute timeout warning
        window._loadingTimeoutId = setTimeout(() => {
            if (isCreating) {
                showLoadingTimeoutWarning();
            }
        }, 60000); // 60 seconds = 1 minute

        // Calculate nutritional targets
        const targets = calculateNutritionTargets(preferences);
        console.log('🎯 Nutrition targets calculated:', targets);

        // Generate meal recommendations (LOW TOKEN)
        console.log('🤖 Calling Gemini API for meal recommendations...');
        const mealRecommendations = await generateMealRecommendations(preferences, targets);
        console.log('✅ Meal recommendations generated:', mealRecommendations);

        // Create initial meal plan structure with recommendations
        const mealPlan = createMealPlanFromRecommendations(preferences, targets, mealRecommendations);
        console.log('✅ Meal plan structure created:', mealPlan);

        // Save meal plan
        currentMealPlan = {
            id: Date.now().toString(),
            userId: 'user1',
            preferences,
            ...mealPlan,
            // Add target nutrition for summary display
            targetDailyCalories: targets.targetDailyCalories,
            targetProtein: targets.targetProtein,
            targetCarbs: targets.targetCarbs,
            targetFat: targets.targetFat,
            recommendations: mealRecommendations,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        localStorage.setItem('nutriscan_current_meal_plan', JSON.stringify(currentMealPlan));

        // Hide loading and clear timeout
        clearTimeout(window._loadingTimeoutId);
        hideLoadingState();
        isCreating = false;

        // Show meal plan view
        showMealPlanView();

        // Display diet tips from AI
        if (mealPlan.dietTips && mealPlan.dietTips.length > 0) {
            displayDietTips(mealPlan.dietTips);
        }

    } catch (error) {
        console.error('❌ Error generating meal plan:', error);
        clearTimeout(window._loadingTimeoutId);
        hideLoadingState();
        isCreating = false;

        // Check if it's a server overload error
        const errorMessage = error.message?.toLowerCase() || '';
        if (errorMessage.includes('server') || errorMessage.includes('overload') ||
            errorMessage.includes('503') || errorMessage.includes('429') ||
            errorMessage.includes('exhausted') || errorMessage.includes('rate')) {
            showServerOverloadModal();
        } else {
            alert('Gagal membuat meal plan: ' + error.message);
        }
    }
}

function calculateNutritionTargets(preferences) {
    const { physicalProfile, dietGoal } = preferences;
    const { age, gender, weight, height, activityLevel } = physicalProfile;

    // Calculate BMR using Harris-Benedict equation
    let bmr;
    if (gender === 'Laki-laki') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Activity multipliers
    const multipliers = {
        'Sedentary': 1.2,
        'Light': 1.375,
        'Moderate': 1.55,
        'Active': 1.725,
        'Very Active': 1.9
    };

    // Calculate TDEE
    const tdee = bmr * (multipliers[activityLevel] || 1.55);

    // Adjust based on diet goal
    let targetCalories = tdee;
    let proteinPercent = 20;
    let carbsPercent = 50;
    let fatPercent = 30;

    // Diet-specific macros
    switch (dietGoal) {
        case 'Keto':
            proteinPercent = 20;
            carbsPercent = 5;
            fatPercent = 75;
            break;
        case 'Atkins':
            proteinPercent = 30;
            carbsPercent = 10;
            fatPercent = 60;
            break;
        case 'Mediterania':
            proteinPercent = 20;
            carbsPercent = 45;
            fatPercent = 35;
            break;
        case 'Paleo':
            proteinPercent = 30;
            carbsPercent = 30;
            fatPercent = 40;
            break;
        case 'Vegetarian/Vegan':
            proteinPercent = 15;
            carbsPercent = 55;
            fatPercent = 30;
            break;
        case 'DASH':
            proteinPercent = 18;
            carbsPercent = 55;
            fatPercent = 27;
            break;
        case 'Mayo Diet':
            proteinPercent = 20;
            carbsPercent = 50;
            fatPercent = 30;
            break;
    }

    // Calculate macro targets (in grams)
    const targetProtein = Math.round((targetCalories * proteinPercent / 100) / 4);
    const targetCarbs = Math.round((targetCalories * carbsPercent / 100) / 4);
    const targetFat = Math.round((targetCalories * fatPercent / 100) / 9);

    return {
        targetDailyCalories: Math.round(targetCalories),
        targetProtein,
        targetCarbs,
        targetFat
    };
}

async function generateMealRecommendations(preferences, targets) {
    const { dietGoal, physicalProfile, budget, conditions, allergies } = preferences;

    // 2-Template Strategy: Generate only 2 unique plans (A & B)
    // Then map A->C and B->D to create variety without extra API calls
    const templateLabels = ['A', 'B'];
    const templateContexts = [
        'Regular/Active Day (Mon-Wed-Fri)',
        'Light/Variety Day (Tue-Thu-Sat-Sun)'
    ];

    const templates = {};

    for (let i = 0; i < 2; i++) {
        const label = templateLabels[i];
        const context = templateContexts[i];

        try {
            updateLoadingProgress(i + 1, 2, `Generating Plan ${label}...`);

            const dayPlan = await generateSingleDayPlan(
                label,
                context,
                preferences,
                targets
            );

            templates[label] = dayPlan;
            console.log(`✅ Plan ${label} generated successfully`);

            // Short delay between calls
            if (i < 1) await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
            console.error(`❌ Failed to generate Plan ${label}:`, error);

            // Retry once
            try {
                console.log(`🔄 Retrying Plan ${label}...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retryPlan = await generateSingleDayPlan(label, context, preferences, targets);
                templates[label] = retryPlan;
                console.log(`✅ Plan ${label} retry successful`);
            } catch (retryError) {
                console.error(`❌ Retry failed for Plan ${label}:`, retryError);
                // Only use fallback if not cancelled
                if (isCancelled) {
                    throw new Error('Dibatalkan oleh pengguna');
                }
                templates[label] = getBasicDayPlan(targets, label);
            }
        }
    }

    // If Plan B failed, use Plan A as backup
    if (!templates['B'] && templates['A']) {
        templates['B'] = JSON.parse(JSON.stringify(templates['A']));
    }

    // Map 2 templates to 4 days: A, B, C(=A copy), D(=B copy)
    const plans = {
        'A': templates['A'],
        'B': templates['B'],
        'C': JSON.parse(JSON.stringify(templates['A'] || getBasicDayPlan(targets, 'C'))),
        'D': JSON.parse(JSON.stringify(templates['B'] || getBasicDayPlan(targets, 'D')))
    };

    return { plans };
}

// Generate a single day's meal plan
async function generateSingleDayPlan(dayLabel, dayContext, preferences, targets) {
    const { dietGoal, physicalProfile, budget, conditions, allergies } = preferences;

    // Get diet-specific rules
    const dietRules = getDietRules(dietGoal, targets);

    // Very compact prompt to prevent truncation
    const prompt = `Meal plan ${dietGoal} (${targets.targetDailyCalories}kcal):
${dietRules}

JSON only:
{"meals":[{"time":"12:00","type":"Siang","dish":"Nama Masakan Lengkap","items":[{"name":"Bahan","g":100,"cal":200,"p":10,"c":20,"f":5}]}],"tips":["tip1"]}

dish = nama masakan deskriptif (contoh: "Nasi Goreng Ayam Telur", "Soto Ayam Lamongan")`;

    console.log('📤 Prompt length:', prompt.length, 'chars');

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
            topP: 0.95,
            topK: 40
        }
    };

    const data = await callGeminiAPI(requestBody, 'meal-plan');
    let responseText = data.candidates[0].content.parts[0].text;

    // Extract JSON
    let jsonStr = responseText;
    if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
    } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
    } else {
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) jsonStr = match[0];
    }

    // Clean and repair JSON
    jsonStr = jsonStr.trim()
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']'); // Remove trailing commas before ]

    // Try to repair truncated JSON
    if (!jsonStr.endsWith('}')) {
        // Try to close unclosed structures
        const openBraces = (jsonStr.match(/{/g) || []).length;
        const closeBraces = (jsonStr.match(/}/g) || []).length;
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/\]/g) || []).length;

        // Add missing closing brackets/braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';
    }

    try {
        const dayPlan = JSON.parse(jsonStr);

        // Normalize to new format if old format detected
        if (dayPlan.breakfast && !dayPlan.meals) {
            dayPlan.meals = [
                { time: '07:00', type: 'Sarapan', items: dayPlan.breakfast },
                { time: '12:00', type: 'Makan Siang', items: dayPlan.lunch },
                { time: '19:00', type: 'Makan Malam', items: dayPlan.dinner }
            ];
            dayPlan.diet_tips = dayPlan.diet_tips || [];
        }

        // Normalize short field names to full names
        // Check for tips field and transfer to diet_tips if diet_tips is empty/missing
        if (dayPlan.tips && Array.isArray(dayPlan.tips) && dayPlan.tips.length > 0) {
            dayPlan.diet_tips = dayPlan.tips;
        }
        // Ensure diet_tips exists
        if (!dayPlan.diet_tips) {
            dayPlan.diet_tips = [];
        }

        // Normalize item fields
        if (dayPlan.meals) {
            dayPlan.meals.forEach(meal => {
                // Normalize dish name - use dish field if available, else combine item names
                if (!meal.dish && meal.items && Array.isArray(meal.items) && meal.items.length > 0) {
                    meal.dish = meal.items.map(i => i.name).slice(0, 2).join(' + ');
                }

                if (meal.items && Array.isArray(meal.items)) {
                    meal.items = meal.items.map(item => ({
                        name: item.name || 'Bahan',
                        portion_grams: item.portion_grams || item.g || 100,
                        calories: item.calories || item.cal || 200,
                        protein: item.protein || item.p || 10,
                        carbs: item.carbs || item.c || 30,
                        fat: item.fat || item.f || 8,
                        ingredients: item.ingredients || []
                    }));
                }
            });
        }

        console.log('✅ Parsed meal plan:', dayPlan.meals?.length, 'meals,', dayPlan.diet_tips?.length, 'tips');
        return dayPlan;
    } catch (parseError) {
        console.error('❌ JSON parse failed, using fallback:', parseError.message);
        // Fallback with realistic Indonesian dishes
        return {
            meals: [
                {
                    time: '07:00', type: 'Sarapan', items: [
                        { name: 'Bubur Ayam', portion_grams: 300, calories: 280, protein: 15, carbs: 35, fat: 8, ingredients: ['Nasi 150g', 'Ayam suwir 50g', 'Kecap', 'Bawang goreng'] },
                        { name: 'Telur Rebus', portion_grams: 60, calories: 80, protein: 7, carbs: 1, fat: 5, ingredients: ['Telur ayam 1 butir'] }
                    ]
                },
                {
                    time: '12:30', type: 'Makan Siang', items: [
                        { name: 'Nasi + Ikan Bakar + Sayur', portion_grams: 400, calories: 550, protein: 35, carbs: 55, fat: 18, ingredients: ['Nasi putih 200g', 'Ikan kembung 150g', 'Kangkung tumis 100g', 'Sambal'] }
                    ]
                },
                {
                    time: '19:00', type: 'Makan Malam', items: [
                        { name: 'Soto Ayam', portion_grams: 350, calories: 380, protein: 25, carbs: 40, fat: 12, ingredients: ['Kuah soto 250ml', 'Ayam 100g', 'Bihun 50g', 'Tauge', 'Seledri'] }
                    ]
                }
            ],
            diet_tips: [
                'Minum air putih minimal 8 gelas (2 liter) per hari',
                'Makan perlahan (20-30 menit) untuk pencernaan optimal',
                'Hindari makan berat setelah jam 8 malam'
            ]
        };
    }
}

// Get diet-specific rules and instructions
function getDietRules(dietGoal, targets) {
    const rules = {
        'Intermittent Fasting': `
ATURAN DIET INTERMITTENT FASTING (WAJIB):
- Hanya 2 waktu makan dalam 8 jam eating window (contoh: 12:00-20:00)
- TIDAK ADA sarapan pagi - skip sarapan
- Fokus makan siang dan makan malam saja
- Target kalori: ${Math.round(targets.targetDailyCalories)} kcal
- Tips: puasa 16 jam, makan 8 jam`,

        'Keto': `
ATURAN DIET KETO (WAJIB):
- MAKSIMAL 50g karbohidrat per hari
- Tinggi lemak (70% kalori dari lemak)
- Protein sedang (25%)
- DILARANG: nasi, roti, mie, buah manis, sayur bertepung
- FOKUS: daging, ikan, telur, keju, alpukat, kacang, sayuran hijau`,

        'Atkins': `
ATURAN DIET ATKINS (WAJIB):
- MAKSIMAL 20g karbohidrat per hari
- TANPA biji-bijian, gula, buah di awal
- FOKUS: daging, ikan, telur, keju, sayuran rendah karbo
- Tinggi protein, tinggi lemak`,

        'Mediterania': `
ATURAN DIET MEDITERANIA (WAJIB):
- Gunakan minyak zaitun sebagai lemak utama
- Ikan 2-3x seminggu
- Biji-bijian utuh, sayuran, buah-buahan
- BATASI: daging merah (1-2x/bulan saja)
- TANPA makanan olahan`,

        'Mediterranean': `
ATURAN DIET MEDITERANIA (WAJIB):
- Gunakan minyak zaitun sebagai lemak utama
- Ikan 2-3x seminggu
- Biji-bijian utuh, sayuran, buah-buahan
- BATASI: daging merah (1-2x/bulan saja)
- TANPA makanan olahan`,

        'Paleo': `
ATURAN DIET PALEO (WAJIB):
- TANPA biji-bijian (nasi, gandum, jagung)
- TANPA produk susu
- TANPA kacang-kacangan
- TANPA gula olahan
- FOKUS: daging, ikan, telur, sayuran, buah, kacang pohon`,

        'Vegetarian/Vegan': `
ATURAN DIET VEGAN (WAJIB):
- TIDAK BOLEH ada produk hewani sama sekali (tanpa daging, susu, telur, madu)
- FOKUS: tahu, tempe, kacang-kacangan, sayuran, biji-bijian
- Pastikan protein cukup dari sumber nabati`,

        'Vegetarian': `
ATURAN DIET VEGETARIAN (WAJIB):
- TANPA daging atau ikan
- Boleh telur dan susu
- FOKUS: tahu, tempe, telur, susu, kacang-kacangan, sayuran`,

        'Vegan': `
ATURAN DIET VEGAN (WAJIB):
- TIDAK BOLEH ada produk hewani sama sekali
- FOKUS: tahu, tempe, kacang-kacangan, sayuran, biji-bijian
- Pastikan protein dan B12 cukup`,

        'DASH': `
ATURAN DIET DASH (WAJIB):
- Rendah natrium (MAKS 2300mg/hari)
- Tinggi kalium, kalsium, magnesium
- FOKUS: buah, sayuran, biji-bijian utuh, protein rendah lemak
- Batasi lemak jenuh dan makanan manis`,

        'Mayo Diet': `
ATURAN DIET MAYO (WAJIB):
- Piramida makanan: dasar adalah buah/sayuran
- Biji-bijian utuh lebih baik dari olahan
- Sumber protein rendah lemak
- Lemak sehat dalam jumlah sedang
- Kontrol porsi penting`,

        'Mayo Clinic Diet': `
ATURAN DIET MAYO (WAJIB):
- Piramida makanan: dasar adalah buah/sayuran
- Biji-bijian utuh lebih baik dari olahan
- Sumber protein rendah lemak
- Lemak sehat dalam jumlah sedang
- Kontrol porsi penting`,

        'Custom': `
ATURAN CUSTOM (WAJIB):
- Target kalori: ${targets.targetDailyCalories} kcal
- Protein: ${targets.targetProtein}g, Karbo: ${targets.targetCarbs}g, Lemak: ${targets.targetFat}g
- Hormati semua alergi dan kondisi kesehatan
- Makanan seimbang dan bergizi`
    };

    const result = rules[dietGoal] || rules['Custom'];
    console.log(`🎯 Diet goal: "${dietGoal}" - Rules found: ${result ? 'YES' : 'NO (using Custom)'}`);
    return result;
}

// Get basic fallback for a single day
function getBasicDayPlan(targets, dayLabel) {
    const cal = targets.targetDailyCalories;
    const b = Math.round(cal * 0.35);
    const l = Math.round(cal * 0.40);
    const d = Math.round(cal * 0.25);

    const meals = {
        A: { breakfast: 'Nasi Merah + Telur', lunch: 'Ayam Bakar + Sayur', dinner: 'Ikan Panggang' },
        B: { breakfast: 'Roti Gandum + Alpukat', lunch: 'Gado-gado', dinner: 'Tempe Bacem' },
        C: { breakfast: 'Oatmeal + Pisang', lunch: 'Soto Ayam', dinner: 'Pepes Ikan' },
        D: { breakfast: 'Nasi Uduk', lunch: 'Steak Tempe', dinner: 'Sup Ayam' }
    };

    const m = meals[dayLabel] || meals.A;

    return {
        breakfast: [{ name: m.breakfast, portion: '1 porsi', calories: b, protein: Math.round(b * 0.15 / 4), carbs: Math.round(b * 0.55 / 4), fat: Math.round(b * 0.30 / 9) }],
        lunch: [{ name: m.lunch, portion: '1 porsi', calories: l, protein: Math.round(l * 0.15 / 4), carbs: Math.round(l * 0.55 / 4), fat: Math.round(l * 0.30 / 9) }],
        dinner: [{ name: m.dinner, portion: '1 porsi', calories: d, protein: Math.round(d * 0.15 / 4), carbs: Math.round(d * 0.55 / 4), fat: Math.round(d * 0.30 / 9) }]
    };
}

// Update loading overlay with progress
function updateLoadingProgress(current, total, message) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    const progressText = overlay.querySelector('.progress-message');
    if (progressText) {
        progressText.textContent = message;
    }

    const progressBar = overlay.querySelector('.progress-fill');
    if (progressBar) {
        const percent = (current / total) * 100;
        progressBar.style.width = percent + '%';
    }

    const progressLabel = overlay.querySelector('.progress-label');
    if (progressLabel) {
        progressLabel.textContent = `${current}/${total} days`;
    }
}

// Helper: Check if JSON string is complete
function isCompleteJSON(str) {
    if (!str || !str.trim()) return false;

    const trimmed = str.trim();
    if (!trimmed.startsWith('{')) return false;
    if (!trimmed.endsWith('}')) return false;

    // Count braces
    let openBraces = 0;
    let closeBraces = 0;
    for (let char of trimmed) {
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
    }

    return openBraces === closeBraces && openBraces > 0;
}

// Helper: Expand 2 plans to 4 plans with variations
function expandPlansTo4(twoPlans) {
    const planA = twoPlans.A || twoPlans.a;
    const planB = twoPlans.B || twoPlans.b;

    if (!planA || !planB) {
        console.warn('⚠️ Missing plans in AI response, using fallback structure');
        return twoPlans;
    }

    // Create variations by swapping meal times
    return {
        A: planA,                    // Mon, Thu
        B: planB,                    // Tue, Fri  
        C: {
            breakfast: planB.breakfast,
            lunch: planA.lunch,
            dinner: planB.dinner
        },                           // Wed, Sat (mix)
        D: {
            breakfast: planA.breakfast,
            lunch: planB.lunch,
            dinner: planA.dinner
        }                            // Sun (special mix)
    };
}

//safety if AI fails
function getFallbackRecommendations(targets) {
    // Helper to create a basic item
    const createItem = (name, cal) => [{
        name,
        portion: "1 porsi",
        calories: cal,
        protein: Math.round(cal * 0.15 / 4),
        carbs: Math.round(cal * 0.55 / 4),
        fat: Math.round(cal * 0.30 / 9),
        vitamins: ["B1", "C"]
    }];

    const target = targets.targetDailyCalories;
    const b = Math.round(target * 0.25);
    const l = Math.round(target * 0.35);
    const d = Math.round(target * 0.25);
    const s = Math.round(target * 0.15 / 2);

    return {
        plans: {
            "A": {
                breakfast: createItem("Bubur Ayam (Fallback)", b),
                snack1: createItem("Buah Potong", s),
                lunch: createItem("Nasi Campur", l),
                snack2: createItem("Yogurt", s),
                dinner: createItem("Capcay Kuah", d)
            },
            "B": {
                breakfast: createItem("Roti Gandum Telur", b),
                snack1: createItem("Kacang Rebus", s),
                lunch: createItem("Gado-gado", l),
                snack2: createItem("Puding Buah", s),
                dinner: createItem("Ikan Bakar", d)
            },
            "C": {
                breakfast: createItem("Nasi Uduk", b),
                snack1: createItem("Pisang", s),
                lunch: createItem("Soto Ayam", l),
                snack2: createItem("Jus Alpukat", s),
                dinner: createItem("Pepes Tahu", d)
            },
            "D": {
                breakfast: createItem("Pancake Oatmeal", b),
                snack1: createItem("Smoothie", s),
                lunch: createItem("Steak Tempe", l),
                snack2: createItem("Salad Buah", s),
                dinner: createItem("Sup Ayam Kampung", d)
            }
        },
        micronutrientsFocus: ["Vitamin C", "Serat"]
    };
}

function createMealPlanFromRecommendations(preferences, targets, recommendations) {
    const { duration } = preferences;
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const planMapping = ['D', 'A', 'B', 'C', 'A', 'B', 'C']; // Index 0=Minggu, 1=Senin...

    const weeks = [];

    // Create weeks structure
    for (let w = 1; w <= duration; w++) {
        const days = [];

        // Create days
        for (let d = 1; d <= 7; d++) { // 1=Senin, ..., 7=Minggu logic in original code was: day 1..7
            // Correction: Original code used d=1 as day index. Let's assume standard ISO or just simple visual index.
            // If d=1..7, and dayNames[d%7]. 1%7=1(Senin), 2%7=2(Selasa)... 7%7=0(Minggu).
            // Matches array index planMapping[d%7].

            const dayIndex = d % 7; // 1=Senin... 0=Minggu
            const planType = planMapping[dayIndex];
            const dailyPlan = recommendations.plans[planType] || recommendations.plans['A']; // Fallback

            // Use new meals array format if available, else fallback to old format
            let mealSlots;
            if (dailyPlan.meals && Array.isArray(dailyPlan.meals)) {
                // New format: use meals array directly
                mealSlots = dailyPlan.meals.map(meal => ({
                    type: meal.type || 'Makanan',
                    items: meal.items || [],
                    time: meal.time || '12:00'
                }));
            } else {
                // Old format fallback
                mealSlots = [
                    { type: 'Sarapan', items: dailyPlan.breakfast || [], time: '07:00' },
                    { type: 'Makan Siang', items: dailyPlan.lunch || [], time: '12:00' },
                    { type: 'Makan Malam', items: dailyPlan.dinner || [], time: '19:00' }
                ].filter(slot => slot.items && slot.items.length > 0);
            }

            const processedMeals = mealSlots.map((slot, idx) => {
                // Aggregates for the slot - filter out undefined/null items
                const rawItems = Array.isArray(slot.items) ? slot.items : (slot.items ? [slot.items] : []);
                const items = rawItems.filter(i => i && typeof i === 'object');

                // If no valid items, show warning and return fallback
                if (items.length === 0) {
                    console.warn(`⚠️ Menu ${slot.type} tidak tersedia - coba generate ulang`);

                    // Show alert only once per generation
                    if (!window._mealPlanWarningShown) {
                        window._mealPlanWarningShown = true;
                        setTimeout(() => {
                            alert('⚠️ Beberapa menu tidak berhasil di-generate. Silakan klik "Generate Ulang" untuk mencoba lagi.');
                            window._mealPlanWarningShown = false;
                        }, 500);
                    }

                    return {
                        id: `meal_${w}_${d}_${idx}`,
                        type: slot.type,
                        time: slot.time,
                        name: '⚠️ Gagal - Coba Ulang',
                        items: [],
                        calories: 0, protein: 0, carbs: 0, fat: 0,
                        vitamins: [],
                        description: 'Menu gagal di-generate. Silakan generate ulang.'
                    };
                }

                const totalCal = items.reduce((sum, i) => sum + (parseFloat(i.calories) || 0), 0);
                const totalProt = items.reduce((sum, i) => sum + (parseFloat(i.protein) || 0), 0);
                const totalCarbs = items.reduce((sum, i) => sum + (parseFloat(i.carbs) || 0), 0);
                const totalFat = items.reduce((sum, i) => sum + (parseFloat(i.fat) || 0), 0);
                const allVitamins = [...new Set(items.flatMap(i => i.vitamins || []))];

                return {
                    id: `meal_${w}_${d}_${idx}`,
                    type: slot.type,
                    time: slot.time,
                    name: slot.dish || (items.length > 0 ? items[0].name : 'Menu'), // Use dish name from AI
                    items: items, // Keep individual items detail
                    calories: Math.round(totalCal),
                    protein: Math.round(totalProt),
                    carbs: Math.round(totalCarbs),
                    fat: Math.round(totalFat),
                    vitamins: allVitamins,
                    description: items.map(i => `${i.name} (${i.portion_grams || i.portion || '100'}g)`).join(', ')
                };
            });

            // Filter empty slots if any
            const validMeals = processedMeals.filter(m => m.calories > 0);

            days.push({
                day: d,
                dayName: dayNames[dayIndex], // Correct name mapping
                meals: validMeals,
                totalCalories: Math.round(validMeals.reduce((sum, m) => sum + m.calories, 0)),
                totalProtein: Math.round(validMeals.reduce((sum, m) => sum + m.protein, 0)),
                totalCarbs: Math.round(validMeals.reduce((sum, m) => sum + m.carbs, 0)),
                totalFat: Math.round(validMeals.reduce((sum, m) => sum + m.fat, 0))
            });
        }

        weeks.push({
            week: w,
            days: days
        });
    }

    // Extract diet tips from first available plan
    const firstPlan = recommendations.plans?.A || recommendations.plans?.B || {};
    const dietTips = firstPlan.diet_tips || [];

    console.log('✅ Meal plan created with', weeks.length, 'weeks');
    console.log('📝 Diet tips:', dietTips);
    return { weeks, micronutrientsFocus: recommendations.micronutrientsFocus, dietTips };
}

function randomFromArray(arr) {
    return arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
}

// ===================================
// VIEW MANAGEMENT
// ===================================

function showBeforeView() {
    const beforeState = document.getElementById('beforeState');
    const afterState = document.getElementById('afterState');

    if (!beforeState || !afterState) {
        console.error('❌ DOM elements not found: beforeState or afterState');
        return;
    }

    beforeState.style.display = 'block';
    afterState.style.display = 'none';
}

function showMealPlanView() {
    const beforeState = document.getElementById('beforeState');
    const afterState = document.getElementById('afterState');

    if (!beforeState || !afterState) {
        // Just log, don't alert to avoid annoyance if elements missing during dev
        console.error('❌ DOM elements not found: beforeState or afterState');
        return;
    }

    beforeState.style.display = 'none';
    afterState.style.display = 'block';

    // Reset to week 1, day 1
    currentWeek = 1;
    currentDay = 1;

    // Render meal plan
    renderMealPlan();
}

// Display AI-generated diet tips
function displayDietTips(tips) {
    if (!tips || tips.length === 0) {
        console.log('⚠️ No diet tips to display');
        return;
    }

    // Update existing tips list in HTML
    const tipsList = document.getElementById('dietTipsList');
    if (tipsList) {
        tipsList.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');
        console.log('✅ Diet tips updated:', tips);
    } else {
        console.warn('⚠️ dietTipsList element not found');
    }
}

function renderMealPlan() {
    if (!currentMealPlan) return;

    renderWeekTabs();
    renderDayTabs();
    renderMeals();
    renderNutritionSummary();
}

function renderWeekTabs() {
    const weekTabs = document.getElementById('weekTabs');
    if (!weekTabs || !currentMealPlan) return;

    const weeks = currentMealPlan.weeks || [];
    weekTabs.innerHTML = weeks.map(week => `
        <div class="tab ${week.week === currentWeek ? 'active' : ''}" 
             onclick="switchWeek(${week.week})" 
             style="cursor:pointer;">
            Minggu ${week.week}
        </div>
    `).join('');
}

function renderDayTabs() {
    const dayTabs = document.getElementById('dayTabs');
    if (!dayTabs || !currentMealPlan) return;

    const week = currentMealPlan.weeks.find(w => w.week === currentWeek);
    if (!week) return;

    // Fixed day names mapping visually
    // In created structure: day 1 (Senin) ... day 7 (Minggu) if using d=1..7 loop
    // BUT d%7 mapping: 1%7=1(Senin), ... 7%7=0(Minggu).

    dayTabs.innerHTML = week.days.map((day) => `
        <div class="tab ${day.day === currentDay ? 'active' : ''}" 
             onclick="switchDay(${day.day})"
             style="cursor:pointer;">
            ${day.dayName}
        </div>
    `).join('');
}

function renderMeals() {
    const timeline = document.getElementById('mealTimeline');
    if (!timeline || !currentMealPlan) return;

    const week = currentMealPlan.weeks.find(w => w.week === currentWeek);
    if (!week) return;

    const day = week.days.find(d => d.day === currentDay);
    if (!day || !day.meals || !Array.isArray(day.meals)) return;

    timeline.innerHTML = day.meals.map((meal) => {
        // Handle vitamins display in badge
        const vitString = (meal.vitamins && meal.vitamins.length > 0)
            ? `<span class="badge" style="background:#e0f2f1; color:#00695c; margin-right: 0.5rem;">Vit ${meal.vitamins.join(',')}</span>`
            : '';

        return `
        <div class="meal-card" onclick="showMealDetails('${meal.id}')" style="cursor: pointer;">
            <div class="meal-time">${meal.time || '-'}</div>
            <div class="meal-info">
                <h4>${meal.name || 'Meal'}</h4>
                <p class="meta">${meal.type || 'Meal'} • ${Math.round(meal.calories || 0)} kcal</p>
                <p style="color: #666; margin-top: 0.5rem; font-size: 0.9rem;">${meal.description || ''}</p>
                <div style="margin-top: 0.5rem;">
                    ${vitString}
                    <span class="badge" style="margin-right: 0.5rem;">P: ${Math.round(meal.protein || 0)}g</span>
                    <span class="badge" style="margin-right: 0.5rem;">C: ${Math.round(meal.carbs || 0)}g</span>
                    <span class="badge">F: ${Math.round(meal.fat || 0)}g</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function renderNutritionSummary() {
    const week = currentMealPlan.weeks.find(w => w.week === currentWeek);
    if (!week) return;

    const day = week.days.find(d => d.day === currentDay);
    if (!day) return;

    const targets = currentMealPlan;

    // Safe element access
    const caloriesEl = document.getElementById('currentCalories');
    const targetCaloriesEl = document.getElementById('targetCalories');
    const proteinEl = document.getElementById('currentProtein');
    const targetProteinEl = document.getElementById('targetProtein');
    const carbsEl = document.getElementById('currentCarbs');
    const targetCarbsEl = document.getElementById('targetCarbs');
    const fatEl = document.getElementById('currentFat');
    const targetFatEl = document.getElementById('targetFat');
    const calorieProgressEl = document.getElementById('calorieProgress');

    // Only update if elements exist
    if (caloriesEl) caloriesEl.textContent = Math.round(day.totalCalories || 0);
    if (targetCaloriesEl) targetCaloriesEl.textContent = Math.round(targets.targetDailyCalories || 0);
    if (proteinEl) proteinEl.textContent = Math.round(day.totalProtein || 0);
    if (targetProteinEl) targetProteinEl.textContent = Math.round(targets.targetProtein || 0);
    if (carbsEl) carbsEl.textContent = Math.round(day.totalCarbs || 0);
    if (targetCarbsEl) targetCarbsEl.textContent = Math.round(targets.targetCarbs || 0);
    if (fatEl) fatEl.textContent = Math.round(day.totalFat || 0);
    if (targetFatEl) targetFatEl.textContent = Math.round(targets.targetFat || 0);

    // Update progress bars
    const caloriePercent = Math.min((day.totalCalories / (targets.targetDailyCalories || 1)) * 100, 100);
    if (calorieProgressEl) calorieProgressEl.style.width = caloriePercent + '%';
}

// ===================================
// NAVIGATION
// ===================================

function switchWeek(week) {
    currentWeek = week;
    currentDay = 1; // Reset to day 1
    renderMealPlan();
}

function switchDay(day) {
    currentDay = day;
    renderMeals();
    renderNutritionSummary();
    renderDayTabs();
}

// ===================================
// MEAL DETAILS
// ===================================

function showMealDetails(mealId) {
    const week = currentMealPlan.weeks.find(w => w.week === currentWeek);
    if (!week) return;

    const day = week.days.find(d => d.day === currentDay);
    if (!day) return;

    const meal = day.meals.find(m => m.id === mealId);
    if (!meal) return;

    // Get first item name as main dish name
    const mainDishName = meal.items && meal.items.length > 0
        ? meal.items[0].name
        : meal.name;

    // Generate single recipe link for main dish
    const searchQuery = encodeURIComponent(`resep ${mainDishName} Indonesia`);
    const recipeLink = `https://www.google.com/search?q=${searchQuery}`;
    const recipeLinksHtml = `
        <a href="${recipeLink}" target="_blank" 
           style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #00c853, #00e676); color: white; 
                  border-radius: 25px; text-decoration: none; font-size: 1rem; font-weight: 600; box-shadow: 0 4px 15px rgba(0,200,83,0.3);">
            🔍 Cari Resep "${mainDishName}"
        </a>
    `;

    // Generate ingredients table
    const ingredientsTableHtml = meal.items && meal.items.length > 0
        ? `<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="background: #f0f0f0;">
                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ddd;">Bahan</th>
                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #ddd;">Gram</th>
                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #ddd;">Kal</th>
                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #ddd;">P</th>
                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #ddd;">C</th>
                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #ddd;">F</th>
                </tr>
            </thead>
            <tbody>
                ${meal.items.map(item => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.75rem; color: #1b5e20; font-weight: 600;">${item.name || 'Item'}</td>
                        <td style="padding: 0.75rem; text-align: center;">${item.portion_grams || 100}g</td>
                        <td style="padding: 0.75rem; text-align: center;">${Math.round(item.calories || 0)}</td>
                        <td style="padding: 0.75rem; text-align: center;">${Math.round(item.protein || 0)}g</td>
                        <td style="padding: 0.75rem; text-align: center;">${Math.round(item.carbs || 0)}g</td>
                        <td style="padding: 0.75rem; text-align: center;">${Math.round(item.fat || 0)}g</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`
        : '<p style="color: #666;">Tidak ada informasi bahan</p>';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 2rem;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="color: #00c853; margin: 0;">${mainDishName}</h2>
                <button class="close-modal-btn" style="background: #ff5252; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 1.2rem;">×</button>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <span class="badge">${meal.type}</span>
                <span class="badge" style="margin-left: 0.5rem;">${meal.time}</span>
            </div>

            <!-- Total Nutrition Summary -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;">
                <div style="padding: 0.75rem; background: #e8f5e9; border-radius: 10px; text-align: center;">
                    <div style="color: #666; font-size: 0.8rem;">Total Kalori</div>
                    <div style="color: #00c853; font-size: 1.2rem; font-weight: 700;">${Math.round(meal.calories || 0)}</div>
                </div>
                <div style="padding: 0.75rem; background: #e3f2fd; border-radius: 10px; text-align: center;">
                    <div style="color: #666; font-size: 0.8rem;">Protein</div>
                    <div style="color: #1976d2; font-size: 1.2rem; font-weight: 700;">${Math.round(meal.protein || 0)}g</div>
                </div>
                <div style="padding: 0.75rem; background: #fff3e0; border-radius: 10px; text-align: center;">
                    <div style="color: #666; font-size: 0.8rem;">Karbo</div>
                    <div style="color: #f57c00; font-size: 1.2rem; font-weight: 700;">${Math.round(meal.carbs || 0)}g</div>
                </div>
                <div style="padding: 0.75rem; background: #fce4ec; border-radius: 10px; text-align: center;">
                    <div style="color: #666; font-size: 0.8rem;">Lemak</div>
                    <div style="color: #c2185b; font-size: 1.2rem; font-weight: 700;">${Math.round(meal.fat || 0)}g</div>
                </div>
            </div>
            
            <!-- Recipe Links Section -->
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #1b5e20; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                    📖 Cari Resep
                </h3>
                <div style="display: flex; flex-wrap: wrap;">
                    ${recipeLinksHtml}
                </div>
            </div>
            
            <!-- Ingredients Table Section -->
            <div>
                <h3 style="color: #1b5e20; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                    🥗 Bahan Makanan
                </h3>
                ${ingredientsTableHtml}
            </div>
        </div>
    `;

    // Add close button functionality
    const closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

// ===================================
// SERVER OVERLOAD MODAL
// ===================================

function showServerOverloadModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'server-overload-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 2rem;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 450px; width: 100%; padding: 2.5rem; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
            <h2 style="color: #f57c00; margin-bottom: 1rem;">Server AI Sedang Sibuk</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem;">
                Maaf! Server AI kami sedang mengalami <strong>overload</strong> karena banyaknya permintaan.
            </p>
            <div style="background: #fff3e0; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <p style="color: #e65100; margin: 0; font-weight: 600;">
                    ⏳ Tunggu 1-2 menit lalu coba lagi
                </p>
            </div>
            <p style="color: #888; font-size: 0.9rem; margin-bottom: 1.5rem;">
                Tips: Coba generate di waktu yang tidak sibuk (pagi/siang) untuk hasil lebih cepat.
            </p>
            <button onclick="this.closest('.server-overload-modal').remove()" 
                    style="background: linear-gradient(135deg, #f57c00, #ff9800); color: white; border: none; 
                           padding: 0.75rem 2rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                           cursor: pointer; box-shadow: 0 4px 15px rgba(245,124,0,0.3);">
                OK, Saya Mengerti
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto close after 10 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 10000);
}

// ===================================
// LOADING TIMEOUT WARNING
// ===================================

function showLoadingTimeoutWarning() {
    // Remove existing warning if any
    const existing = document.querySelector('.loading-timeout-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'loading-timeout-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        padding: 2rem;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 450px; width: 100%; padding: 2.5rem; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">⏳</div>
            <h2 style="color: #f57c00; margin-bottom: 1rem;">Proses Terlalu Lama</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem;">
                Analisis meal plan sudah berjalan lebih dari <strong>1 menit</strong>.
                Server AI mungkin sedang mengalami <strong>overload</strong>.
            </p>
            <div style="background: #fff3e0; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <p style="color: #e65100; margin: 0; font-size: 0.95rem;">
                    Apakah Anda ingin <strong>batalkan</strong> dan coba lagi nanti,<br>
                    atau <strong>lanjutkan</strong> menunggu?
                </p>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button id="cancelLoadingBtn"
                        style="background: #ff5252; color: white; border: none; 
                               padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                               cursor: pointer; box-shadow: 0 4px 15px rgba(255,82,82,0.3);">
                    ❌ Batalkan
                </button>
                <button id="continueLoadingBtn"
                        style="background: linear-gradient(135deg, #00c853, #00e676); color: white; border: none; 
                               padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                               cursor: pointer; box-shadow: 0 4px 15px rgba(0,200,83,0.3);">
                    ✅ Lanjutkan Menunggu
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Cancel button - stop loading and return to form
    document.getElementById('cancelLoadingBtn').addEventListener('click', () => {
        modal.remove();
        clearTimeout(window._loadingTimeoutId);
        isCancelled = true; // Set flag to prevent fallback
        hideLoadingState();
        isCreating = false;
        // Show overload modal
        showServerOverloadModal();
    });

    // Continue button - just close this warning and keep loading
    document.getElementById('continueLoadingBtn').addEventListener('click', () => {
        modal.remove();
        // Set another timeout for 1 more minute
        window._loadingTimeoutId = setTimeout(() => {
            if (isCreating) {
                showLoadingTimeoutWarning();
            }
        }, 60000);
    });
}

// ===================================
// RESET MEAL PLAN
// ===================================

function resetMealPlan() {
    // Show single confirmation dialog
    if (confirm('Yakin ingin membuat meal plan baru? Meal plan saat ini akan dihapus.')) {
        localStorage.removeItem('nutriscan_current_meal_plan');
        currentMealPlan = null;
        currentWeek = 1;
        currentDay = 1;
        window._mealPlanWarningShown = false; // Reset flag inside
        showBeforeView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===================================
// LOADING STATE
// ===================================

function showLoadingState() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    overlay.innerHTML = `
        <div style="background: white; padding: 3rem; border-radius: 20px; text-align: center; max-width: 500px;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🤖</div>
            <h2 style="color: #00c853; margin-bottom: 1rem;">Generating Your Meal Plan...</h2>
            <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">
                AI sedang menyusun meal plan personal untuk Anda berdasarkan preferensi dan kondisi kesehatan Anda. 
                Proses ini membutuhkan waktu sekitar 30-60 detik.
            </p>
            <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
                <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #00e676, #00c853); animation: loading 1.5s ease-in-out infinite;"></div>
            </div>
        </div>
        <style>
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        </style>
    `;

    document.body.appendChild(overlay);
}

function hideLoadingState() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// ===================================
// HELPER FUNCTIONS
// ===================================

function removeTag(tag) {
    const tagContainer = document.getElementById('tagContainer');
    const chips = Array.from(tagContainer?.querySelectorAll('.chip') || []);
    const allergies = chips.map(chip => chip.textContent.replace('×', '').trim());

    // Remove the tag
    const index = allergies.indexOf(tag);
    if (index > -1) {
        allergies.splice(index, 1);
    }

    // Re-render
    tagContainer.innerHTML = allergies.map(allergy => `
        <div class="chip">
            ${allergy}
            <div class="remove" onclick="removeTag('${allergy}')">×</div>
        </div>
    `).join('');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
}

function loadExistingMealPlan() {
    const saved = localStorage.getItem('nutriscan_current_meal_plan');
    if (saved) {
        currentMealPlan = JSON.parse(saved);
    }
}

// ===================================
// MOBILE MENU
// ===================================

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

function logout() {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    window.location.href = 'Index.html';
}
