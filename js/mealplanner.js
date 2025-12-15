let currentMealPlan = null;
let currentWeek = 1;
let currentDay = 1;
let isCreating = false;

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
        showLoadingState();

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

        // Hide loading
        hideLoadingState();
        isCreating = false;

        // Show meal plan view
        showMealPlanView();

    } catch (error) {
        console.error('❌ Error generating meal plan:', error);
        hideLoadingState();
        isCreating = false;
        alert('Gagal membuat meal plan: ' + error.message);
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

    // Expanded prompt for 3+3+1 pattern and detailed nutrients
    const prompt = `Anda adalah ahli gizi profesional. Buatlah rencana makan mingguan yang PERSONAL dan VARIATIF untuk pengguna berikut.

PROFIL PENGGUNA:
- Gender/Usia: ${physicalProfile.gender}, ${physicalProfile.age} tahun
- Berat/Tinggi: ${physicalProfile.weight}kg, ${physicalProfile.height}cm
- Aktivitas: ${physicalProfile.activityLevel}
- Tujuan Diet: ${dietGoal}
- Budget: Rp${budget}/hari

TARGET HARIAN (WAJIB DIPENUHI):
- Kalori: ${targets.targetDailyCalories} kcal (Toleransi +/- 50kcal)
- Protein: ${targets.targetProtein}g
- Karbohidrat: ${targets.targetCarbs}g
- Lemak: ${targets.targetFat}g

KONDISI KESEHATAN:
- Alergi: ${allergies.length ? allergies.join(', ') : 'Tidak ada'}
- Kondisi Medis: ${conditions.length ? conditions.join(', ') : 'Sehat'}
- Catatan: HARUS aman untuk kondisi di atas. Sertakan vitamin/mineral yang mendukung kondisi tersebut.

STRUKTUR RENCANA (PENTING):
Saya butuh 4 variasi menu harian yang berbeda (Plan A, Plan B, Plan C, Plan D) untuk disebar dalam seminggu:
1. Plan A (Senin, Kamis)
2. Plan B (Selasa, Jumat)
3. Plan C (Rabu, Sabtu)
4. Plan D (Minggu - Menu Spesial/Cheat Day sehat)

Setiap waktu makan (Pagi, Siang, Malam, Snack) BISA terdiri dari beberapa item (misal: Nasi + Ayam + Sayur). Total kalori harian HARUS mendekati ${targets.targetDailyCalories} kcal.

FORMAT OUTPUT (JSON SAJA):
{
  "plans": {
    "A": {
      "breakfast": [ {"name":"...", "portion":"...", "calories":100, "protein":5, "carbs":10, "fat":2, "vitamins":["A","C"]} ],
      "snack1": [ ... ],
      "lunch": [ ... ],
      "snack2": [ ... ],
      "dinner": [ ... ]
    },
    "B": { ... },
    "C": { ... },
    "D": { ... }
  },
  "micronutrientsFocus": ["Vitamin C untuk imun", "Calcium untuk tulang", ... ]
}

Pastikan masakan lokal Indonesia yang mudah didapat, variatif, dan sesuai budget.`;

    console.log('📤 Meal Recommendations Prompt Length:', prompt.length, 'chars');

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.7, // Sedikit lebih kreatif
            maxOutputTokens: 5000, // Increased for larger JSON
            topP: 0.9,
            topK: 40
        }
    };

    let responseText = null;

    try {
        const data = await callGeminiAPI(requestBody, 'meal-plan');

        responseText = data.candidates[0].content.parts[0].text;
        console.log('📝 Recommendations response length:', responseText.length);

        let jsonStr = responseText;
        if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0];
        else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0];
        jsonStr = jsonStr.trim();

        const recommendations = JSON.parse(jsonStr);
        console.log('✅ Recommendations parsed successfully');
        return recommendations;

    } catch (error) {
        console.error('❌ Error generating recommendations:', error);
        console.error('Response:', responseText ? responseText.substring(0, 300) : 'N/A');

        // FALLBACK: Basic structure if AI fails
        console.log('⚠️ Using fallback recommendations');
        return getFallbackRecommendations(targets);
    }
}

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

            const mealSlots = [
                { type: 'Sarapan', items: dailyPlan.breakfast, time: '07:00' },
                { type: 'Snack Pagi', items: dailyPlan.snack1, time: '10:00' },
                { type: 'Makan Siang', items: dailyPlan.lunch, time: '13:00' },
                { type: 'Snack Sore', items: dailyPlan.snack2, time: '16:00' },
                { type: 'Makan Malam', items: dailyPlan.dinner, time: '19:00' }
            ];

            const processedMeals = mealSlots.map((slot, idx) => {
                // Aggregates for the slot
                const items = Array.isArray(slot.items) ? slot.items : [slot.items];

                const totalCal = items.reduce((sum, i) => sum + (parseFloat(i.calories) || 0), 0);
                const totalProt = items.reduce((sum, i) => sum + (parseFloat(i.protein) || 0), 0);
                const totalCarbs = items.reduce((sum, i) => sum + (parseFloat(i.carbs) || 0), 0);
                const totalFat = items.reduce((sum, i) => sum + (parseFloat(i.fat) || 0), 0);
                const allVitamins = [...new Set(items.flatMap(i => i.vitamins || []))];

                return {
                    id: `meal_${w}_${d}_${idx}`,
                    type: slot.type,
                    time: slot.time,
                    name: items.map(i => i.name).join(' + '), // Composite name
                    items: items, // Keep individual items detail
                    calories: Math.round(totalCal),
                    protein: Math.round(totalProt),
                    carbs: Math.round(totalCarbs),
                    fat: Math.round(totalFat),
                    vitamins: allVitamins,
                    description: items.map(i => `${i.name} (${i.portion})`).join(', ')
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

    console.log('✅ Meal plan created with', weeks.length, 'weeks');
    return { weeks, micronutrientsFocus: recommendations.micronutrientsFocus };
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

    // Generate detailed visualization for complex items
    const itemsHtml = meal.items && meal.items.length > 1
        ? `<div style="margin-bottom: 1.5rem; background: #f5f5f5; padding: 1rem; border-radius: 10px;">
             <strong>Komposisi:</strong>
             <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                ${meal.items.map(i => `<li>${i.name} (${i.portion}): ${i.calories} kcal</li>`).join('')}
             </ul>
           </div>`
        : '';

    // Vitamins detail
    const vitaminsHtml = meal.vitamins && meal.vitamins.length > 0
        ? `<div style="margin-top: 1rem;">
             <strong>Nutrisi Mikro:</strong><br>
             <span style="color: #00695c;">${meal.vitamins.join(', ')}</span>
           </div>`
        : '';

    // Create modal
    const modal = document.createElement('div');
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
        <div style="background: white; border-radius: 20px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="color: #00c853;">${meal.name}</h2>
                <button id="closeModalBtn" style="background: #ff5252; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 1.2rem;">×</button>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <span class="badge">${meal.type}</span>
                <span class="badge" style="margin-left: 0.5rem;">${meal.time}</span>
            </div>
            
            <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">${meal.description}</p>
            
            ${itemsHtml}

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="padding: 1rem; background: #f8fffe; border-radius: 10px; text-align: center;">
                    <div style="color: #666; font-size: 0.9rem;">Kalori</div>
                    <div style="color: #00c853; font-size: 1.3rem; font-weight: 700;">${meal.calories}</div>
                </div>
                <div style="padding: 1rem; background: #f8fffe; border-radius: 10px; text-align: center;">
                    <div style="color: #666; font-size: 0.9rem;">Protein</div>
                    <div style="color: #00c853; font-size: 1.3rem; font-weight: 700;">${meal.protein}g</div>
                </div>
                <div style="padding: 1rem; background: #f8fffe; border-radius: 10px; text-align: center;">
                    <div style="color: #666; font-size: 0.9rem;">Karbo</div>
                    <div style="color: #00c853; font-size: 1.3rem; font-weight: 700;">${meal.carbs}g</div>
                </div>
                <div style="padding: 1rem; background: #f8fffe; border-radius: 10px; text-align: center;">
                    <div style="color: #666; font-size: 0.9rem;">Lemak</div>
                    <div style="color: #00c853; font-size: 1.3rem; font-weight: 700;">${meal.fat}g</div>
                </div>
            </div>
            
                <h3 style="color: #1b5e20; margin-bottom: 0.75rem;">Cara Memasak:</h3>
                <p style="color: #666; line-height: 1.8; white-space: pre-line;">${meal.recipe || 'Resep tidak tersedia'}</p>
            </div>
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

// ===================================
// RESET MEAL PLAN
// ===================================

function resetMealPlan() {
    if (confirm('Yakin ingin membuat meal plan baru? Meal plan saat ini akan dihapus.')) {
        localStorage.removeItem('nutriscan_current_meal_plan');
        currentMealPlan = null;
        currentWeek = 1;
        currentDay = 1;
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
