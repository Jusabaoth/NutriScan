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

    // MINIMAL prompt - hanya recommendations, NOT full plan
    const prompt = `Sarankan meal recommendations (makanan & minuman lokal Indonesia) dengan format JSON:
{
  "breakfasts": [
    {"name":"Nasi Goreng","calories":350,"protein":10,"carbs":50,"fat":12,"time":"07:00"},
    {"name":"Roti Bakar Telur","calories":300,"protein":12,"carbs":35,"fat":10,"time":"07:00"}
  ],
  "snacks": [
    {"name":"Banana","calories":89,"protein":1,"carbs":23,"fat":0.3,"time":"10:00"},
    {"name":"Yogurt","calories":100,"protein":3,"carbs":7,"fat":5,"time":"10:00"}
  ],
  "lunches": [
    {"name":"Soto Ayam","calories":350,"protein":25,"carbs":30,"fat":12,"time":"12:00"},
    {"name":"Gado-Gado","calories":300,"protein":12,"carbs":35,"fat":10,"time":"12:00"}
  ],
  "dinners": [
    {"name":"Ikan Bakar","calories":300,"protein":35,"carbs":0,"fat":15,"time":"18:00"},
    {"name":"Pepes Ayam","calories":280,"protein":30,"carbs":5,"fat":12,"time":"18:00"}
  ]
}

PENGGUNA: ${physicalProfile.gender}, ${physicalProfile.age}yo, ${physicalProfile.weight}kg
DIET: ${dietGoal} | BUDGET: Rp${budget}/hari
ALERGI: ${allergies.length ? allergies.join(', ') : 'Tidak'}
KONDISI: ${conditions.length ? conditions.join(', ') : 'Sehat'}
TARGET HARIAN: ${targets.targetDailyCalories}kcal, Protein ${targets.targetProtein}g

RULES: Sesuai alergi & kondisi. Minimal 2 pilihan per meal time. HANYA JSON, TANPA TEKS!`;

    console.log('📤 Meal Recommendations Prompt Length:', prompt.length, 'chars');

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2000,  // JAUH lebih kecil
            topP: 0.8,
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

        // FALLBACK: Return hardcoded recommendations
        console.log('⚠️ Using fallback recommendations');
        return {
            breakfasts: [
                { "name": "Nasi Goreng", "calories": 350, "protein": 10, "carbs": 50, "fat": 12, "time": "07:00" },
                { "name": "Roti Bakar Telur", "calories": 300, "protein": 12, "carbs": 35, "fat": 10, "time": "07:00" }
            ],
            snacks: [
                { "name": "Banana", "calories": 89, "protein": 1, "carbs": 23, "fat": 0.3, "time": "10:00" },
                { "name": "Yogurt", "calories": 100, "protein": 3, "carbs": 7, "fat": 5, "time": "10:00" }
            ],
            lunches: [
                { "name": "Soto Ayam", "calories": 350, "protein": 25, "carbs": 30, "fat": 12, "time": "12:00" },
                { "name": "Gado-Gado", "calories": 300, "protein": 12, "carbs": 35, "fat": 10, "time": "12:00" }
            ],
            dinners: [
                { "name": "Ikan Bakar", "calories": 300, "protein": 35, "carbs": 0, "fat": 15, "time": "18:00" },
                { "name": "Pepes Ayam", "calories": 280, "protein": 30, "carbs": 5, "fat": 12, "time": "18:00" }
            ]
        };
    }
}

function createMealPlanFromRecommendations(preferences, targets, recommendations) {
    const { duration } = preferences;
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const weeks = [];

    // Create weeks structure
    for (let w = 1; w <= duration; w++) {
        const days = [];

        // Create days
        for (let d = 1; d <= 7; d++) {
            // Randomly select from recommendations
            const meals = [
                randomFromArray(recommendations.breakfasts || []),
                randomFromArray(recommendations.snacks || []),
                randomFromArray(recommendations.lunches || []),
                randomFromArray(recommendations.dinners || [])
            ].filter(m => m);

            const mealTypes = ['Sarapan', 'Snack', 'Makan Siang', 'Makan Malam'];

            days.push({
                day: d,
                dayName: dayNames[d % 7],
                meals: meals.map((m, idx) => ({
                    id: `meal_${w}_${d}_${idx}`,
                    name: m.name || 'Meal',
                    time: m.time || '09:00',
                    type: mealTypes[idx] || 'Meal',
                    calories: Math.round(parseFloat(m.calories) || 0),
                    protein: Math.round(parseFloat(m.protein) || 0),
                    carbs: Math.round(parseFloat(m.carbs) || 0),
                    fat: Math.round(parseFloat(m.fat) || 0),
                    description: m.description || ''
                })),
                totalCalories: Math.round(meals.reduce((sum, m) => sum + (parseFloat(m.calories) || 0), 0)),
                totalProtein: Math.round(meals.reduce((sum, m) => sum + (parseFloat(m.protein) || 0), 0)),
                totalCarbs: Math.round(meals.reduce((sum, m) => sum + (parseFloat(m.carbs) || 0), 0)),
                totalFat: Math.round(meals.reduce((sum, m) => sum + (parseFloat(m.fat) || 0), 0))
            });
        }

        weeks.push({
            week: w,
            days: days
        });
    }

    console.log('✅ Meal plan created with', weeks.length, 'weeks');
    return { weeks };
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
        console.error('❌ DOM elements not found: beforeState or afterState');
        alert('Halaman tidak siap. Silahkan refresh.');
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

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    dayTabs.innerHTML = week.days.map((day, index) => `
        <div class="tab ${day.day === currentDay ? 'active' : ''}" 
             onclick="switchDay(${day.day})"
             style="cursor:pointer;">
            ${dayNames[index % 7]}
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

    timeline.innerHTML = day.meals.map((meal, idx) => {
        const mealId = meal.id || `meal_${currentWeek}_${currentDay}_${idx}`;
        return `
        <div class="meal-card">
            <div class="meal-time">${meal.time || '-'}</div>
            <div class="meal-info">
                <h4>${meal.name || 'Meal'}</h4>
                <p class="meta">${meal.type || 'Meal'} • ${Math.round(meal.calories || 0)} kcal</p>
                <p style="color: #666; margin-top: 0.5rem; font-size: 0.9rem;">${meal.description || ''}</p>
                <div style="margin-top: 0.5rem;">
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
                <button onclick="this.closest('div').parentElement.remove()" style="background: #ff5252; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 1.2rem;">×</button>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <span class="badge">${meal.type}</span>
                <span class="badge" style="margin-left: 0.5rem;">${meal.time}</span>
            </div>
            
            <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">${meal.description}</p>
            
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
            
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #1b5e20; margin-bottom: 0.75rem;">Bahan-bahan:</h3>
                <ul style="padding-left: 1.5rem; color: #666; line-height: 1.8;">
                    ${meal.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>
            
            <div>
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
