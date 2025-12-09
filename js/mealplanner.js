// ===================================
// NUTRISCAN MEAL PLANNER MODULE
// ===================================
// Handles meal plan creation, AI generation,
// weekly/daily navigation, and nutrition tracking

// ===================================
// GLOBAL STATE
// ===================================

let currentMealPlan = null;
let currentWeek = 1;
let currentDay = 1;
let isCreating = false;

const API_KEY = 'AIzaSyB8fv3baKrk2sl9rkctHa980eUK86IQ5d0';
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Storage Keys (sama seperti Index.html)
const STORAGE_KEY_CURRENT_USER = 'nutriscan_current_user';
const STORAGE_KEY_USER_DATA = 'nutriscan_user_data_';

// ===================================
// INITIALIZATION
// ===================================

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

// ===================================
// AUTHENTICATION
// ===================================

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

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // CTA Button
    const ctaButton = document.getElementById('ctaButton');
    if (ctaButton) {
        ctaButton.addEventListener('click', scrollToForm);
    }

    // Form submission (we'll handle this with button click)
    setupFormValidation();
}

function scrollToForm() {
    const formSection = document.getElementById('formSection');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===================================
// FORM HANDLING
// ===================================

function setupFormValidation() {
    // Duration cards
    const durationCards = document.querySelectorAll('.duration-card');
    durationCards.forEach(card => {
        card.addEventListener('click', () => {
            durationCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });

    // Budget slider
    const budgetSlider = document.getElementById('budgetSlider');
    const budgetValue = document.getElementById('budgetValue');
    if (budgetSlider && budgetValue) {
        budgetSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            budgetValue.textContent = formatCurrency(value);
        });
    }
}

function collectFormData() {
    // Diet Goal
    const goalRadio = document.querySelector('input[name="goal"]:checked');
    if (!goalRadio) {
        throw new Error('Pilih tujuan diet Anda');
    }
    const dietGoal = goalRadio.value;

    // Physical Profile
    const age = parseInt(document.getElementById('age')?.value || '25');
    const gender = document.getElementById('gender')?.value || 'Laki-laki';
    const weight = parseFloat(document.getElementById('weight')?.value || '70');
    const height = parseFloat(document.getElementById('height')?.value || '170');
    const activityLevel = document.getElementById('activityLevel')?.value || 'Moderate';

    if (!age || !weight || !height) {
        throw new Error('Lengkapi profil fisik Anda (umur, berat, tinggi)');
    }

    // Duration
    const durationCard = document.querySelector('.duration-card.active');
    if (!durationCard) {
        throw new Error('Pilih durasi meal plan');
    }
    const duration = parseInt(durationCard.dataset.weeks || '1');

    // Budget
    const budget = parseInt(document.getElementById('budgetSlider')?.value || '500000');

    // Conditions
    const conditionCheckboxes = document.querySelectorAll('input[name="condition"]:checked');
    const conditions = Array.from(conditionCheckboxes).map(cb => cb.value);

    // Allergies
    const allergiesInput = document.getElementById('allergiesInput')?.value || '';
    const allergies = allergiesInput.split(',').map(a => a.trim()).filter(a => a);

    // Other notes
    const otherNotes = document.getElementById('otherNotes')?.value || '';

    return {
        dietGoal,
        physicalProfile: {
            age,
            gender,
            weight,
            height,
            activityLevel
        },
        duration,
        budget,
        conditions,
        allergies,
        otherNotes
    };
}

// ===================================
// MEAL PLAN GENERATION
// ===================================

async function generateMealPlan() {
    if (isCreating) return;

    try {
        // Collect form data
        const preferences = collectFormData();

        // Show loading
        isCreating = true;
        showLoadingState();

        // Calculate nutritional targets
        const targets = calculateNutritionTargets(preferences);

        // Generate with AI
        const mealPlan = await generateWithGemini(preferences, targets);

        // Save meal plan
        currentMealPlan = {
            id: Date.now().toString(),
            userId: 'user1',
            preferences,
            ...mealPlan,
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
        console.error('Error generating meal plan:', error);
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

async function generateWithGemini(preferences, targets) {
    const { dietGoal, physicalProfile, duration, budget, conditions, allergies, otherNotes } = preferences;

    // Diet principles
    const dietPrinciples = {
        'Keto': 'Tinggi lemak (70-75%), protein sedang (20-25%), sangat rendah karbohidrat (5-10%). Fokus: daging, ikan, telur, sayuran rendah karbo, alpukat, kacang-kacangan.',
        'Atkins': 'Fase bertahap rendah karbo. Fokus: protein tinggi, lemak sehat, tingkatkan karbo bertahap.',
        'Mediterania': 'Tinggi buah, sayur, whole grains, ikan, minyak zaitun. Rendah daging merah.',
        'Paleo': 'Makanan alami era paleolitik. Fokus: daging, ikan, telur, sayur, buah. Hindari: grains, dairy, processed food.',
        'Vegetarian/Vegan': 'Tanpa daging atau produk hewani. Fokus: tahu, tempe, kacang-kacangan, sayuran, buah.',
        'DASH': 'Untuk hipertensi. Rendah sodium (<1500mg), tinggi kalium, kalsium, magnesium.',
        'Intermittent Fasting': 'Pola makan berselang. Fokus: nutrisi seimbang dalam eating window.',
        'Mayo Diet': 'Diet seimbang. Fokus: sayur, buah, whole grains, lean protein, lemak sehat.'
    };

    const prompt = `Anda adalah ahli nutrisi dan meal planner profesional.

PROFIL PENGGUNA:
- Umur: ${physicalProfile.age} tahun
- Gender: ${physicalProfile.gender}
- Berat: ${physicalProfile.weight} kg
- Tinggi: ${physicalProfile.height} cm
- Aktivitas: ${physicalProfile.activityLevel}

PREFERENSI DIET:
- Tujuan: ${dietGoal}
- Durasi: ${duration} minggu
- Budget: Rp ${formatCurrency(budget)} per hari
- Kondisi Kesehatan: ${conditions.length > 0 ? conditions.join(', ') : 'Tidak ada'}
- Alergi: ${allergies.length > 0 ? allergies.join(', ') : 'Tidak ada'}
${otherNotes ? `- Catatan: ${otherNotes}` : ''}

PRINSIP DIET ${dietGoal}:
${dietPrinciples[dietGoal]}

TARGET NUTRISI HARIAN:
- Kalori: ${targets.targetDailyCalories} kcal
- Protein: ${targets.targetProtein}g
- Karbohidrat: ${targets.targetCarbs}g
- Lemak: ${targets.targetFat}g

TUGAS:
Buat meal plan lengkap untuk ${duration} minggu (${duration * 7} hari) dengan:
1. Menu untuk setiap hari: Sarapan (07:00), Makan Siang (12:00), Makan Malam (19:00), Snack (15:00)
2. Resep detail dengan bahan dan cara masak
3. Perhitungan nutrisi akurat
4. Menu BERVARIASI dan sesuai budget
5. Hindari alergi yang disebutkan
6. Pertimbangkan kondisi kesehatan

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
              "id": "meal_1_1_1",
              "name": "Nama Makanan",
              "description": "Deskripsi singkat",
              "time": "07:00",
              "type": "Sarapan",
              "calories": 500,
              "protein": 25,
              "carbs": 50,
              "fat": 15,
              "ingredients": ["bahan 1", "bahan 2"],
              "recipe": "Cara memasak lengkap step by step"
            }
          ],
          "totalCalories": 2000,
          "totalProtein": 100,
          "totalCarbs": 200,
          "totalFat": 70
        }
      ]
    }
  ],
  "targetDailyCalories": ${targets.targetDailyCalories},
  "targetProtein": ${targets.targetProtein},
  "targetCarbs": ${targets.targetCarbs},
  "targetFat": ${targets.targetFat}
}

PENTING:
- Menu harus BERVARIASI setiap hari
- Gunakan bahan lokal Indonesia yang mudah didapat
- Resep harus DETAIL dan mudah diikuti
- Perhitungan nutrisi harus AKURAT
- Total nutrisi per hari harus mendekati target ±10%
- Meal plan harus untuk SEMUA ${duration * 7} hari

Berikan HANYA JSON tanpa teks tambahan!`;

    // Call Gemini API
    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000
        }
    };

    const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;

    // Parse JSON
    let jsonText = responseText;
    if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    const mealPlan = JSON.parse(jsonText);

    return mealPlan;
}

// ===================================
// VIEW MANAGEMENT
// ===================================

function showBeforeView() {
    document.getElementById('beforeState').style.display = 'block';
    document.getElementById('afterState').style.display = 'none';
}

function showMealPlanView() {
    document.getElementById('beforeState').style.display = 'none';
    document.getElementById('afterState').style.display = 'block';

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
    if (!weekTabs) return;

    const weeks = currentMealPlan.weeks;
    weekTabs.innerHTML = weeks.map(week => `
        <button class="tab ${week.week === currentWeek ? 'active' : ''}" 
                onclick="switchWeek(${week.week})">
            Minggu ${week.week}
        </button>
    `).join('');
}

function renderDayTabs() {
    const dayTabs = document.getElementById('dayTabs');
    if (!dayTabs) return;

    const week = currentMealPlan.weeks.find(w => w.week === currentWeek);
    if (!week) return;

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    dayTabs.innerHTML = week.days.map(day => `
        <button class="tab ${day.day === currentDay ? 'active' : ''}" 
                onclick="switchDay(${day.day})">
            ${dayNames[day.day % 7]}
        </button>
    `).join('');
}

function renderMeals() {
    const timeline = document.getElementById('mealTimeline');
    if (!timeline) return;

    const week = currentMealPlan.weeks.find(w => w.week === currentWeek);
    if (!week) return;

    const day = week.days.find(d => d.day === currentDay);
    if (!day) return;

    timeline.innerHTML = day.meals.map(meal => `
        <div class="meal-card">
            <div class="meal-time">${meal.time}</div>
            <div class="meal-info">
                <h4>${meal.name}</h4>
                <p class="meta">${meal.type} • ${meal.calories} kcal</p>
                <p style="color: #666; margin-top: 0.5rem; font-size: 0.9rem;">${meal.description}</p>
                <div style="margin-top: 0.5rem;">
                    <span class="badge" style="margin-right: 0.5rem;">P: ${meal.protein}g</span>
                    <span class="badge" style="margin-right: 0.5rem;">C: ${meal.carbs}g</span>
                    <span class="badge">F: ${meal.fat}g</span>
                </div>
            </div>
            <button class="btn-ghost" style="padding: 0.5rem 1rem; font-size: 0.9rem;" 
                    onclick="showMealDetails('${meal.id}')">
                Detail
            </button>
        </div>
    `).join('');
}

function renderNutritionSummary() {
    const week = currentMealPlan.weeks.find(w => w.week === currentWeek);
    if (!week) return;

    const day = week.days.find(d => d.day === currentDay);
    if (!day) return;

    const targets = currentMealPlan;

    // Update summary
    document.getElementById('currentCalories').textContent = day.totalCalories;
    document.getElementById('targetCalories').textContent = targets.targetDailyCalories;
    document.getElementById('currentProtein').textContent = day.totalProtein;
    document.getElementById('targetProtein').textContent = targets.targetProtein;
    document.getElementById('currentCarbs').textContent = day.totalCarbs;
    document.getElementById('targetCarbs').textContent = targets.targetCarbs;
    document.getElementById('currentFat').textContent = day.totalFat;
    document.getElementById('targetFat').textContent = targets.targetFat;

    // Update progress bars
    const caloriePercent = Math.min((day.totalCalories / targets.targetDailyCalories) * 100, 100);
    const proteinPercent = Math.min((day.totalProtein / targets.targetProtein) * 100, 100);
    const carbsPercent = Math.min((day.totalCarbs / targets.targetCarbs) * 100, 100);
    const fatPercent = Math.min((day.totalFat / targets.targetFat) * 100, 100);

    document.getElementById('calorieProgress').style.width = caloriePercent + '%';
    document.getElementById('proteinProgress').style.width = proteinPercent + '%';
    document.getElementById('carbsProgress').style.width = carbsPercent + '%';
    document.getElementById('fatProgress').style.width = fatPercent + '%';
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
