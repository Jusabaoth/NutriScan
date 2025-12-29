// Language Switcher Module for NutriScan
// Manages bilingual translation between Indonesian (ID) and English (EN)

const STORAGE_KEY_LANGUAGE = 'nutriscan_language';

// Translation dictionary
const translations = {
    id: {
        // Common Navigation
        'nav-dashboard': 'Dashboard',
        'nav-scanner': 'Scanner',
        'nav-mealplanner': 'Meal Planner',
        'nav-history': 'History',
        'btn-login': 'Masuk',
        'btn-signup': 'Daftar',
        'btn-logout': 'Keluar',
        'lang-id': 'ID',
        'lang-en': 'EN',

        // Index Page - Hero
        'hero-title': 'Nutrisi Sehat, Masa Depan Cerah',
        'hero-subtitle': 'Analisis nutrisi berbasis AI untuk gaya hidup lebih sehat',
        'cta-button': 'Mulai Sekarang',

        // Index Page - Post Login
        'welcome-title': 'Selamat Datang Kembali',
        'welcome-subtitle': 'Siap untuk menganalisis nutrisi hari ini?',
        'scanner-cta': 'Mulai Scan Nutrisi',

        // Features Section
        'features-title': 'Fitur Unggulan',
        'feature-scanner-title': 'Scanner Cerdas',
        'feature-scanner-desc': 'Scan label nutrisi dengan AI untuk analisis instan',
        'feature-planner-title': 'Meal Planner',
        'feature-planner-desc': 'Rencanakan menu sehat personal Anda',
        'feature-history-title': 'Riwayat Lengkap',
        'feature-history-desc': 'Lacak semua analisis nutrisi Anda',

        // Vision & Mission
        'vision-title': 'Visi Kami',
        'vision-text': 'Menjadi platform terdepan dalam edukasi nutrisi berbasis teknologi AI di Indonesia',
        'mission-title': 'Misi Kami',
        'mission-1': 'Memberikan akses mudah ke informasi nutrisi yang akurat',
        'mission-2': 'Membantu masyarakat membuat keputusan makanan yang lebih sehat',
        'mission-3': 'Meningkatkan kesadaran akan pentingnya gizi seimbang',

        // Scanner Page
        'scanner-title': 'Scanner Nutrisi',
        'scanner-subtitle': 'Upload atau ambil foto label gizi produk untuk dianalisis',
        'mode-camera': 'Kamera Langsung',
        'mode-upload': 'Upload File',
        'btn-activate-camera': 'Aktifkan Kamera',
        'btn-capture': 'Ambil Foto',
        'btn-cancel': 'Batal',
        'dropzone-title': 'Drag & Drop gambar di sini',
        'dropzone-hint': 'atau klik untuk memilih file',
        'dropzone-format': 'Format: JPG, PNG',
        'btn-select-file': 'Pilih File',
        'image-counter': 'gambar dipilih',
        'btn-clear-all': 'Hapus Semua',
        'btn-analyze': 'Analisis dengan AI',

        // Meal Planner Page
        'planner-hero-title': 'Mulailah Membuat Meal Planner-mu',
        'planner-hero-subtitle': 'Rencanakan makanan sehatmu, wujudkan hidup lebih berkualitas!',
        'planner-cta': 'Buat Sekarang!',
        'diet-info-title': 'Kenali Beragam Jenis Diet',
        'diet-keto': 'Keto',
        'diet-keto-desc': 'Tinggi lemak, rendah karbohidrat',
        'diet-atkins': 'Atkins',
        'diet-atkins-desc': 'Rendah karbohidrat bertahap',
        'diet-mediterranean': 'Mediterania',
        'diet-mediterranean-desc': 'Buah, sayur, ikan, minyak zaitun',
        'diet-paleo': 'Paleo',
        'diet-paleo-desc': 'Makanan ala manusia purba',
        'diet-vegetarian': 'Vegetarian/Vegan',
        'diet-vegetarian-desc': 'Tanpa daging/produk hewani',
        'diet-dash': 'DASH',
        'diet-dash-desc': 'Khusus untuk penderita hipertensi',
        'diet-if': 'Intermittent Fasting',
        'diet-if-desc': 'Puasa berselang (OCD)',
        'diet-mayo': 'Mayo Diet',
        'diet-mayo-desc': 'Diet seimbang untuk semua',

        'history-title': '📚 Riwayat Scan',
        'history-subtitle': 'Lihat kembali hasil analisis nutrisi Anda',
        'search-placeholder': 'Cari produk berdasarkan nama...',
        'btn-delete-history': 'Hapus Semua History',
        'empty-history': 'Belum ada riwayat scan tersimpan.',
        'btn-scan-now': 'Mulai Scan Sekarang',
        'expand-more': 'Tampilkan lebih lanjut... ⬇',
        'expand-less': 'Tampilkan lebih sedikit ⬆',

        // Index - Welcome & Action Cards
        'welcome-text': 'Selamat datang',
        'welcome-subtitle-text': 'Lengkapi profil kesehatan untuk rekomendasi nutrisi yang lebih personal',
        'health-profile-btn': 'Setup Profil Kesehatan',
        'action-cards-title': 'Mulai dari Sini',
        'action-card-1-title': 'Lengkapi Profil',
        'action-card-1-desc': 'Atur kondisi kesehatan untuk rekomendasi yang lebih personal',
        'action-card-2-title': 'Scan Pertamamu',
        'action-card-2-desc': 'Ambil foto label produk dan dapatkan analisis nutrisi instan',
        'action-card-3-title': 'Belajar Nutrisi',
        'action-card-3-desc': 'Akses artikel dan tips kesehatan dari para ahli',

        // Index - Educational Content
        'edu-title': '📚 Konten Edukasi',
        'edu-1-title': 'Tujuan Membaca Label Gizi',
        'edu-1-desc': 'Mengetahui kandungan gizi dalam makanan/minuman seperti gula, garam (natrium), lemak, protein, serat, dll. Membantu kita untuk memilih produk mana yang lebih sehat dan aman dikonsumsi.',
        'edu-2-title': 'Apa itu takaran saji?',
        'edu-2-desc': 'Berat suatu makanan/minuman(biasanya dalam gram) yang dijadikan acuan untuk menghitung kandungan gizi pada label. contoh : Takaran saji: 30 g, Isi kemasan: 2 sajian, gula: 10 g, natrium: 100 mg, jika seluruh isinya dimakan sama saja seperti mengomsumsi 60 g gula dan 200 mg natrium.',
        'edu-3-title': 'Apa itu Kalori dan Funsinya?',
        'edu-3-desc': 'Jumlah energi yang diperoleh tubuh dari makanan/minuman. Fungsi utamanya yaitu untuk menjalani aktivitas sehari-hari, Menjaga fungsi organ tubuh, dan mendukung pertumbuhan.',
        'edu-4-title': 'Lemak Trans(SANGAT BERBAHAYA)',
        'edu-4-desc': 'Lemak trans adalah lemak buatan hasil hidrogenasi yang mengubah lemak cair menjadi padat agar makanan lebih tahan lama. Lemak ini terdapat pada margarin, fast food, dan biskuit, serta meningkatkan kolesterol jahat, menurunkan menurunkan kolesterol baik, dan meningkatkan resiko penyakit jantung.',
        'edu-5-title': 'Lemak Teroksidasi(BERBAHAYA)',
        'edu-5-desc': 'Lemak teroksidasi adalah lemak yang sudah rusak akibat pemanasan berulang atau terlalu lama, seperti pada minyak goreng yang dipakai berkali-kali. Lemak ini berbahaya karena dapat memicu peradangan, merusak sel tubuh, dan meningkatkan risiko penyakit kronis.',
        'edu-6-title': 'Lemak Jenuh(DIBATASI)',
        'edu-6-desc': 'Lemak jenuh adalah lemak yang umumnya padat pada suhu ruang dan banyak terdapat pada daging berlemak, santan, minyak kelapa dan sawit. Beresiko meningkatkan kolesterol jahat(jika dikonsumsi berlebihan).',
        'edu-7-title': 'Angka Kebutuhan Gizi(AKG)',
        'edu-7-desc': 'AKG menunjukkan persentase kebutuhan gizi harian yang dipenuhi oleh 1 porsi makanan. Contoh : Lemak: 10% AKG, berarti 1 porsi makanan mengandung 10% dari kebutuhan lemak harian.',

        // Meal Planner - Form & Interface
        'planner-tip-title': 'Butuh inspirasi cepat?',
        'planner-tip-desc': 'Isi preferensi kamu, biarkan AI kami susun menu sehat yang pas dengan tujuan, budget, dan kondisi tubuhmu.',
        'planner-goal-label': 'Pilih tujuan meal planner-mu:',
        'planner-goal-custom': 'Custom (Saya punya tujuan sendiri)',
        'planner-goal-custom-placeholder': 'Contoh: Diet tinggi protein untuk naik massa otot, tapi tetap ramah kantong.',
        'planner-duration-label': 'Berapa lama kamu ingin konsisten?',
        'planner-duration-week': '🗓️ Seminggu',
        'planner-duration-month': '📅 Sebulan',
        'planner-duration-3months': '📆 3 Bulan',
        'planner-duration-year': '🎯 Setahun',
        'planner-budget-label': 'Budget makanan per hari:',
        'planner-budget-eco': 'Ekonomis (< Rp 30.000)',
        'planner-budget-std': 'Standar (30-75k)',
        'planner-budget-premium': 'Premium (> 75k)',
        'planner-budget-hint': 'AI akan menyesuaikan rekomendasi dengan budgetmu',
        'planner-budget-value-eco': 'Ekonomis',
        'planner-budget-value-std': 'Standar',
        'planner-budget-value-premium': 'Premium',
        'planner-analyze-btn': 'ANALISIS DENGAN AI',
        'planner-goal-custom-label': 'Ceritakan tujuanmu:',
        'planner-ready-title': 'Meal Planner-mu Sudah Siap!',
        'planner-ready-subtitle': 'Tidak puas dengan meal planner ini?',
        'planner-edit-btn': 'Ubah',
        'planner-nutrition-summary': 'Ringkasan Nutrisi Hari Ini',
        'planner-calories': 'Kalori',
        'planner-protein': 'Protein',
        'planner-carbs': 'Karbo',
        'planner-fat': 'Lemak',
        'planner-tips-title': '💡 Tips Diet Anda',
        'nutrition-protein': 'Protein',
        'nutrition-carbs': 'Karbo',
        'nutrition-fats': 'Lemak',
        'diet-tips-title': '💡 Tips Diet Anda',
        'history_deleteAll': 'Hapus Semua History',

        // Scanner - Image counter
        'scanner-image-counter': 'gambar dipilih(produk harus sama)',
        'btn-clear-all-2': 'Hapus Semua',

        // Health Profile Modal
        'health-modal-title': 'Setup Profil Kesehatan',
        'health-modal-subtitle': 'Lengkapi data fisik untuk perhitungan kalori harian yang akurat dan personalisasi AI',
        'health-profile-physical': 'Profil Fisik',
        'health-weight': 'Berat Badan (kg)',
        'health-height': 'Tinggi Badan (cm)',
        'health-age': 'Umur (tahun)',
        'health-gender': 'Jenis Kelamin',
        'health-gender-male': 'Pria',
        'health-gender-female': 'Wanita',
        'health-activity': 'Aktivitas Harian',
        'health-activity-placeholder': 'Pilih tingkat aktivitas',
        'health-activity-sedentary': 'Jarang olahraga (Sedentari)',
        'health-activity-light': 'Olahraga 1-2x/minggu (Ringan)',
        'health-activity-moderate': 'Olahraga 3-5x/minggu (Sedang)',
        'health-activity-active': 'Olahraga 6-7x/minggu (Berat)',
        'health-allergies-title': '1. Alergi Makanan',
        'health-allergies-desc': 'Reaksi abnormal sistem kekebalan tubuh terhadap makanan tertentu',
        'health-metabolic-title': '2. Penyakit Metabolik',
        'health-metabolic-desc': 'Penyakit/kelainan metabolisme tubuh',
        'health-cardio-title': '3. Penyakit Kardiovaskular',
        'health-cardio-desc': 'Gangguan jantung dan pembuluh darah',
        'health-respiratory-title': '4. Gangguan Pernapasan',
        'health-cancer-title': '5. Kanker',
        'health-digestive-title': '6. Gangguan Pencernaan',
        'health-other-label': 'Lainnya',
        'health-other-placeholder': 'Tuliskan kondisi lain, contoh : Maag, Anemia, dll',
        'health-btn-cancel': 'Batal',
        'health-btn-save': '💾 Simpan Profil',
    },

    en: {
        // Common Navigation
        'nav-dashboard': 'Dashboard',
        'nav-scanner': 'Scanner',
        'nav-mealplanner': 'Meal Planner',
        'nav-history': 'History',
        'btn-login': 'Login',
        'btn-signup': 'Sign Up',
        'btn-logout': 'Logout',
        'lang-id': 'ID',
        'lang-en': 'EN',

        // Index Page - Hero
        'hero-title': 'Healthy Nutrition, Bright Future',
        'hero-subtitle': 'AI-powered nutrition analysis for a healthier lifestyle',
        'cta-button': 'Get Started',

        // Index Page - Post Login
        'welcome-title': 'Welcome to NutriScan',
        'welcome-subtitle': 'Ready to analyze nutrition today?',
        'scanner-cta': 'Start Nutrition Scan',

        // Features Section
        'features-title': 'Key Features',
        'feature-scanner-title': 'Smart Scanner',
        'feature-scanner-desc': 'Scan nutrition labels with AI for instant analysis',
        'feature-planner-title': 'Meal Planner',
        'feature-planner-desc': 'Plan your personalized healthy meals',
        'feature-history-title': 'Complete History',
        'feature-history-desc': 'Track all your nutrition analyses',

        // Vision & Mission
        'vision-title': 'Our Vision',
        'vision-text': 'To become the leading platform for AI-based nutrition education in Indonesia',
        'mission-title': 'Our Mission',
        'mission-1': 'Provide easy access to accurate nutrition information',
        'mission-2': 'Help people make healthier food decisions',
        'mission-3': 'Raise awareness of the importance of balanced nutrition',

        // Scanner Page
        'scanner-title': 'Nutrition Scanner',
        'scanner-subtitle': 'Upload or capture nutrition label photo for analysis',
        'mode-camera': 'Live Camera',
        'mode-upload': 'Upload File',
        'btn-activate-camera': 'Activate Camera',
        'btn-capture': 'Capture Photo',
        'btn-cancel': 'Cancel',
        'dropzone-title': 'Drag & Drop image here',
        'dropzone-hint': 'or click to select file',
        'dropzone-format': 'Format: JPG, PNG',
        'btn-select-file': 'Select File',
        'image-counter': 'images selected',
        'btn-clear-all': 'Clear All',
        'btn-analyze': 'Analyze with AI',

        // Meal Planner Page
        'planner-hero-title': 'Start Creating Your Meal Planner',
        'planner-hero-subtitle': 'Plan your healthy meals, achieve a better quality of life!',
        'planner-cta': 'Create Now!',
        'diet-info-title': 'Explore Various Diet Types',
        'diet-keto': 'Keto',
        'diet-keto-desc': 'High fat, low carbohydrate',
        'diet-atkins': 'Atkins',
        'diet-atkins-desc': 'Gradual low carbohydrate',
        'diet-mediterranean': 'Mediterranean',
        'diet-mediterranean-desc': 'Fruits, vegetables, fish, olive oil',
        'diet-paleo': 'Paleo',
        'diet-paleo-desc': 'Prehistoric-style eating',
        'diet-vegetarian': 'Vegetarian/Vegan',
        'diet-vegetarian-desc': 'No meat/animal products',
        'diet-dash': 'DASH',
        'diet-dash-desc': 'Specifically for hypertension patients',
        'diet-if': 'Intermittent Fasting',
        'diet-if-desc': 'Alternate fasting (IF)',
        'diet-mayo': 'Mayo Diet',
        'diet-mayo-desc': 'Balanced diet for everyone',

        // History Page
        'history-title': '📚 Scan History',
        'history-subtitle': 'Review your nutrition analysis results',
        'search-placeholder': 'Search products by name...',
        'btn-delete-history': 'Delete All History',
        'empty-history': 'No scan history saved yet.',
        'btn-scan-now': 'Start Scanning Now',
        'expand-more': 'Show more... ⬇️',
        'expand-less': 'Show less ⬆️',

        // Index - Welcome & Action Cards
        'welcome-text': 'Welcome to NutriScan',
        'welcome-subtitle-text': 'Complete your health profile for personalized nutrition recommendations',
        'health-profile-btn': 'Setup Health Profile',
        'action-cards-title': 'Get Started',
        'action-card-1-title': 'Complete Profile',
        'action-card-1-desc': 'Set up health conditions for more personalized recommendations',
        'action-card-2-title': 'Your First Scan',
        'action-card-2-desc': 'Capture product label photos and get instant nutrition analysis',
        'action-card-3-title': 'Learn Nutrition',
        'action-card-3-desc': 'Access articles and health tips from experts',

        // Index - Educational Content
        'edu-title': '📚 Educational Content',
        'edu-1-title': 'Purpose of Reading Nutrition Labels',
        'edu-1-desc': 'Learn about nutritional content in food/beverages like sugar, salt (sodium), fat, protein, fiber, etc. Helps us choose which products are healthier and safer to consume.',
        'edu-2-title': 'What is serving size?',
        'edu-2-desc': 'The weight of food/beverage (usually in grams) used as a reference to calculate nutritional content on labels. Example: Serving size: 30g, Package content: 2 servings, sugar: 10g, sodium: 100mg, if you eat the entire package, it equals consuming 60g of sugar and 200mg of sodium.',
        'edu-3-title': 'What are Calories and Their Function?',
        'edu-3-desc': 'The amount of energy the body gets from food/beverages. Its main functions are for daily activities, maintaining organ functions, and supporting growth.',
        'edu-4-title': 'Trans Fat (VERY DANGEROUS)',
        'edu-4-desc': 'Trans fats are artificial fats resulting from hydrogenation that turn liquid fats into solids to make food last longer. These fats are found in margarine, fast food, and cookies, and increase bad cholesterol, decrease good cholesterol, and increase heart disease risk.',
        'edu-5-title': 'Oxidized Fat (DANGEROUS)',
        'edu-5-desc': 'Oxidized fat is fat that has been damaged due to repeated or prolonged heating, such as cooking oil used multiple times. This fat is dangerous because it can trigger inflammation, damage body cells, and increase chronic disease risk.',
        'edu-6-title': 'Saturated Fat (LIMITED)',
        'edu-6-desc': 'Saturated fat is fat that is generally solid at room temperature and is abundant in fatty meat, coconut milk, coconut and palm oil. Risks increasing bad cholesterol (if consumed excessively).',
        'edu-7-title': 'Daily Value (DV)',
        'edu-7-desc': 'DV shows the percentage of daily nutritional needs met by 1 serving of food. Example: Fat: 10% DV, means 1 serving of food contains 10% of daily fat needs.',

        // Meal Planner - Form & Interface
        'planner-tip-title': 'Need quick inspiration?',
        'planner-tip-desc': 'Fill in your preferences, let our AI create a healthy menu that fits your goals, budget, and body condition.',
        'planner-goal-label': 'Choose your meal planner goal:',
        'planner-goal-custom': 'Custom (I have my own goal)',
        'planner-goal-custom-placeholder': 'Example: High protein diet for muscle gain, but budget-friendly.',
        'planner-duration-label': 'How long do you want to be consistent?',
        'planner-duration-week': '🗓️ One Week',
        'planner-duration-month': '📅 One Month',
        'planner-duration-3months': '📆 3 Months',
        'planner-duration-year': '🎯 One Year',
        'planner-budget-label': 'Daily food budget:',
        'planner-budget-eco': 'Budget (< Rp 30,000)',
        'planner-budget-std': 'Standard (30-75k)',
        'planner-budget-premium': 'Premium (> 75k)',
        'planner-budget-hint': 'AI will adjust recommendations to your budget',
        'planner-budget-value-eco': 'Budget',
        'planner-budget-value-std': 'Standard',
        'planner-budget-value-premium': 'Premium',
        'planner-analyze-btn': 'ANALYZE WITH AI',
        'planner-goal-custom-label': 'Tell us your goal:',
        'planner-ready-title': 'Your Meal Planner is Ready!',
        'planner-ready-subtitle': 'Not satisfied with this meal plan?',
        'planner-edit-btn': 'Edit',
        'planner-nutrition-summary': 'Nutrition Summary',
        'planner-calories': 'Calories',
        'planner-protein': 'Protein',
        'planner-carbs': 'Carbs',
        'planner-fat': 'Fat',
        'planner-tips-title': '💡 Your Diet Tips',
        'nutrition-protein': 'Protein',
        'nutrition-carbs': 'Carbs',
        'nutrition-fats': 'Fats',
        'diet-tips-title': '💡 Your Diet Tips',
        'history_deleteAll': 'Delete All History',

        // Scanner - Image counter
        'scanner-image-counter': 'images selected (same product)',
        'btn-clear-all-2': 'Clear All',

        // Health Profile Modal
        'health-modal-title': 'Setup Health Profile',
        'health-modal-subtitle': 'Complete physical data for accurate daily calorie calculation and AI personalization',
        'health-profile-physical': 'Physical Profile',
        'health-weight': 'Weight (kg)',
        'health-height': 'Height (cm)',
        'health-age': 'Age (years)',
        'health-gender': 'Gender',
        'health-gender-male': 'Male',
        'health-gender-female': 'Female',
        'health-activity': 'Daily Activity',
        'health-activity-placeholder': 'Select activity level',
        'health-activity-sedentary': 'Rarely exercise (Sedentary)',
        'health-activity-light': 'Exercise 1-2x/week (Light)',
        'health-activity-moderate': 'Exercise 3-5x/week (Moderate)',
        'health-activity-active': 'Exercise 6-7x/week (Active)',
        'health-allergies-title': '1. Food Allergies',
        'health-allergies-desc': 'Abnormal immune system reaction to certain foods',
        'health-metabolic-title': '2. Metabolic Diseases',
        'health-metabolic-desc': 'Body metabolism diseases/disorders',
        'health-cardio-title': '3. Cardiovascular Diseases',
        'health-cardio-desc': 'Heart and blood vessel disorders',
        'health-respiratory-title': '4. Respiratory Disorders',
        'health-cancer-title': '5. Cancer',
        'health-digestive-title': '6. Digestive Disorders',
        'health-other-label': 'Others',
        'health-other-placeholder': 'Write other conditions, example: Gastritis, Anemia, etc',
        'health-btn-cancel': 'Cancel',
        'health-btn-save': 'Save Profile',
    }
};

// Get current language
function getCurrentLanguage() {
    return localStorage.getItem(STORAGE_KEY_LANGUAGE) || 'id';
}

// Set language
function setLanguage(lang) {
    if (lang !== 'id' && lang !== 'en') {
        return;
    }

    localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
    updatePageLanguage(lang);
    updateToggleState(lang);
}

// Update all text elements on page
function updatePageLanguage(lang) {
    const elements = document.querySelectorAll('[data-lang-key]');

    let updatedCount = 0;
    elements.forEach(element => {
        const key = element.getAttribute('data-lang-key');
        const translation = translations[lang][key];

        if (translation) {
            // Handle different element types
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
                element.placeholder = translation;
                updatedCount++;
            } else if (element.tagName === 'INPUT' && element.type === 'button') {
                element.value = translation;
                updatedCount++;
            } else if (element.tagName === 'BUTTON' || element.tagName === 'A') {
                // Preserve icons/emojis if present - check for emoji at start
                const currentText = element.textContent.trim();
                const emojiMatch = currentText.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)\s*/u);

                if (emojiMatch) {
                    element.textContent = emojiMatch[1] + ' ' + translation;
                } else {
                    element.textContent = translation;
                }
                updatedCount++;
            } else {
                element.textContent = translation;
                updatedCount++;
            }
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

// Update toggle switch state
function updateToggleState(lang) {
    const toggleDesktop = document.getElementById('langToggle');
    const toggleMobile = document.getElementById('langToggleMobile');

    const isEnglish = lang === 'en';

    if (toggleDesktop) {
        toggleDesktop.checked = isEnglish;
    }
    if (toggleMobile) {
        toggleMobile.checked = isEnglish;
    }
}

// Toggle language
function toggleLanguage() {
    const currentLang = getCurrentLanguage();
    const newLang = currentLang === 'id' ? 'en' : 'id';
    setLanguage(newLang);
}

// Initialize language on page load
function initLanguage() {
    const savedLang = getCurrentLanguage();
    updatePageLanguage(savedLang);
    updateToggleState(savedLang);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
} else {
    initLanguage();
}

// Export functions for global use
window.toggleLanguage = toggleLanguage;
window.getCurrentLanguage = getCurrentLanguage;
window.setLanguage = setLanguage;
