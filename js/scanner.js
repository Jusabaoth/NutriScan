let currentMode = 'camera'; // 'camera' or 'upload'
let capturedImage = null;
let videoStream = null;
let healthData = null;


const STORAGE_KEY_CURRENT_USER = 'nutriscan_current_user';
const STORAGE_KEY_USER_DATA = 'nutriscan_user_data_';

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadHealthData();
    setupEventListeners();
});

function initializeApp() {
    switchMode('camera');
}

function checkAuthStatus() {
    const currentUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (currentUser) {
        const userData = getUserData(currentUser);
        if (userData) {
            loadUserProfile();
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
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    }

    // File input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// MODE SWITCHING

function switchMode(mode) {
    currentMode = mode;

    const cameraBtn = document.getElementById('cameraBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const cameraContainer = document.getElementById('cameraContainer');
    const uploadContainer = document.getElementById('uploadContainer');

    if (mode === 'camera') {
        cameraBtn.classList.add('active');
        uploadBtn.classList.remove('active');
        cameraContainer.classList.add('active');
        uploadContainer.classList.remove('active');
        stopCamera(); // Reset camera
    } else {
        cameraBtn.classList.remove('active');
        uploadBtn.classList.add('active');
        cameraContainer.classList.remove('active');
        uploadContainer.classList.add('active');
        stopCamera();
    }
}

// CAMERA FUNCTIONALITY

async function startCamera() {
    try {
        const video = document.getElementById('videoElement');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        video.srcObject = stream;
        videoStream = stream;

        // Show capture and cancel buttons
        document.querySelector('.btn-capture:nth-of-type(1)').style.display = 'none';
        document.getElementById('captureBtn').style.display = 'inline-block';
        document.getElementById('cancelBtn').style.display = 'inline-block';

    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
}

function capturePhoto() {
    const video = document.getElementById('videoElement');
    const canvas = document.createElement('canvas'); // Re-added this line

    // Set max dimensions (optimize for API payload size)
    const MAX_DIMENSION = 800; // Resize to max 800px
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
        if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
        }
    } else {
        if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
        }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    // Convert to base64 (reduce quality slightly for smaller size)
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Display preview
    displayImagePreview(imageData);

    // Stop camera
    stopCamera();

    // Reset buttons
    document.querySelector('.btn-capture:nth-of-type(1)').style.display = 'inline-block';
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
        const video = document.getElementById('videoElement');
        video.srcObject = null;
    }
}

// FILE UPLOAD FUNCTIONALITY

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        alert('Format file tidak didukung. Gunakan JPG atau PNG.');
        return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('Ukuran file terlalu besar. Maksimal 5MB.');
        return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
        displayImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function displayImagePreview(imageData) {
    capturedImage = imageData;

    const preview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');

    previewImage.src = imageData;
    preview.classList.add('active');

    // Enable scan button
    updateScanButton();
}

function removeImage() {
    capturedImage = null;
    const preview = document.getElementById('imagePreview');
    preview.classList.remove('active');

    // Reset file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';

    // Update scan button
    updateScanButton();
}

// HEALTH QUESTIONNAIRE

function loadHealthData() {
    const saved = localStorage.getItem('nutriscan_health_data');
    if (saved) {
        healthData = JSON.parse(saved);
        console.log('✅ Health data loaded from localStorage:', healthData);
    } else {
        console.log('ℹ️ No health data found in localStorage');
    }
}

function collectHealthData() {
    // Simply return the health data loaded from localStorage
    // No need to query DOM since form is now on dashboard
    return healthData;
}

// ===================================
// SCAN BUTTON CONTROL
// ===================================

function updateScanButton() {
    const scanBtn = document.querySelector('.btn-scan');
    if (scanBtn) {
        scanBtn.disabled = !capturedImage;
    }
}

// ===================================
// HEALTH WARNING DIALOG
// ===================================

function showHealthWarningDialog() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'healthWarningOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 20px;
        max-width: 500px;
        width: 100%;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    modal.innerHTML = `
        <h2 style="color: #F59E0B; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 2rem;">⚠️</span> Profil Kesehatan Belum Diatur
        </h2>
        <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">
            Untuk rekomendasi yang lebih personal, silakan atur profil kesehatan Anda di Dashboard terlebih dahulu.
        </p>
        <div style="background: #f8fffe; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="dontRemindCheckbox" style="width: 18px; height: 18px; cursor: pointer;">
                <span style="color: #333; font-size: 0.95rem;">Jangan ingatkan lagi</span>
            </label>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="btnContinueWithout" style="padding: 0.75rem 1.5rem; background: #e0e0e0; color: #333; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                Lanjutkan Tanpa Profil
            </button>
            <button id="btnGoToDashboard" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #00e676, #00c853); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                Atur Profil
            </button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add event listeners
    document.getElementById('btnContinueWithout').addEventListener('click', () => {
        const dontRemind = document.getElementById('dontRemindCheckbox').checked;
        if (dontRemind) {
            localStorage.setItem('nutriscan_skip_health_warning', 'true');
        }
        overlay.remove();
        // Continue with scan without health data
        continueWithoutHealthData();
    });

    document.getElementById('btnGoToDashboard').addEventListener('click', () => {
        overlay.remove();
        window.location.href = 'Index.html';
    });
}

function continueWithoutHealthData() {
    // Proceed with scan without health data
    performScanWithoutWarning();
}

async function performScanWithoutWarning() {
    if (!capturedImage) {
        alert('Silakan upload atau ambil foto label nutrisi terlebih dahulu.');
        return;
    }

    // Use null health data
    const health = null;

    // Show loading state
    showLoadingState();

    try {
        // Prepare request
        const result = await analyzeWithGemini(capturedImage, health);

        // Display results
        displayResults(result);

        // Save to localStorage
        saveResult(result);

    } catch (error) {
        console.error('Analysis error:', error);
        hideLoadingState();
        alert('Terjadi kesalahan saat menganalisis. Silakan coba lagi.\\n\\nError: ' + error.message);
    }
}

// ===================================
// AI ANALYSIS
// ===================================

async function performScan() {
    if (!capturedImage) {
        alert('Silakan upload atau ambil foto label nutrisi terlebih dahulu.');
        return;
    }

    // Check if user wants to skip health warning
    const skipWarning = localStorage.getItem('nutriscan_skip_health_warning');

    // Check if health data exists
    if (!healthData || !healthData.diseases || healthData.diseases.length === 0) {
        // If user hasn't chosen to skip warning, show it
        if (skipWarning !== 'true') {
            showHealthWarningDialog();
            return;
        }
        // Otherwise, proceed without health data
        console.log('⚠️ Proceeding without health data (user chose to skip warning)');
    }

    // Collect health data
    const health = collectHealthData();

    // Show loading state
    showLoadingState();

    try {
        // Prepare request
        const result = await analyzeWithGemini(capturedImage, health);

        // Display results
        displayResults(result);

        // Save to localStorage
        saveResult(result);

    } catch (error) {
        console.error('Analysis error:', error);
        hideLoadingState();
        alert('Terjadi kesalahan saat menganalisis. Silakan coba lagi.\n\nError: ' + error.message);
    }
}

async function analyzeWithGemini(imageData, healthData) {
    // Prepare health data text
    const healthText = formatHealthDataForPrompt(healthData);

    console.log('🔍 Scanner: Starting analysis...');
    console.log('📸 Image data length:', imageData.length);
    console.log('❤️ Health data:', healthData);

    // Prepare prompt
    const prompt = `Anda adalah ahli nutrisi yang menganalisis label nutrisi produk makanan.

INFORMASI KESEHATAN PENGGUNA:
${healthText}

TUGAS ANDA:
1. Ekstrak informasi nutrisi dari gambar label (per takaran saji)
2. Identifikasi semua bahan/ingredients
3. Analisis risiko berdasarkan kondisi kesehatan pengguna
4. Berikan rekomendasi personal yang spesifik
5. Evaluasi compliance dengan regulasi BPOM dan WHO

REGULASI BPOM (per hari untuk diet 2000 kkal):
- Lemak Total: max 67g | Lemak Jenuh: max 20g | Lemak Trans: max 2g
- Kolesterol: max 300mg | Sodium: max 2000mg
- Karbohidrat: max 300g | Gula: max 50g | Serat: min 25g | Protein: 50g

REGULASI WHO (per hari untuk diet 2000 kkal):
- Lemak Total: max 66g (<30% energi) | Lemak Jenuh: max 22g (<10% energi)
- Lemak Trans: max 2.2g (<1% energi) | Sodium: max 2000mg
- Gula Bebas: max 50g (<10% energi, ideal <5% = 25g) | Serat: min 25g

BATASAN KHUSUS BERDASARKAN PENYAKIT:
- Diabetes: gula <25g/hari, serat >30g/hari
- Hipertensi: sodium <1500mg/hari
- Kardiovaskular: lemak jenuh <13g/hari, hindari lemak trans, kolesterol <200mg/hari
- Ginjal: protein <40g/hari, sodium <1500mg/hari

Berikan output dalam format JSON berikut:
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
    "violations": ["pelanggaran"],
    "warnings": ["peringatan"]
  },
  "whoCompliance": {
    "compliant": true/false,
    "violations": ["pelanggaran"],
    "warnings": ["peringatan"]
  },
  "analysisText": "penjelasan lengkap dalam bahasa Indonesia"
}

Analisis DETAIL dan PERSONAL berdasarkan kondisi kesehatan pengguna!`;

    // Extract base64 data (remove data:image/jpeg;base64, prefix)
    const base64Image = imageData.split(',')[1];

    // Prepare API request
    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                }
            ]
        }]
    };

    // Call Gemini API through secure backend proxy
    // API Key tersembunyi di backend, frontend hanya kirim request
    console.log('📤 Scanner: Calling backend API (/api/analyze)...');
    console.log('📝 Prompt length:', prompt.length);

    let data;
    try {
        data = await callGeminiAPI(requestBody, 'default');
        console.log('✅ Scanner: API response received');
        console.log('📊 Response keys:', Object.keys(data));
    } catch (apiError) {
        console.error('❌ Scanner: API call failed:', apiError);
        console.error('Error message:', apiError.message);

        // Throw error instead of showing mock data
        throw new Error(`Gagal menghubungi AI: ${apiError.message}. Pastikan server backend berjalan dan API key valid.`);
    }

    // Extract response text
    console.log('🔄 Scanner: Extracting response text...');
    let responseText;
    try {
        responseText = data.candidates[0].content.parts[0].text;
        console.log('📝 Response text length:', responseText.length);
        console.log('📝 First 300 chars:', responseText.substring(0, 300));

        // Parse JSON from response (remove markdown code blocks if present)
        let jsonText = responseText;
        if (jsonText.includes('```json')) {
            jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
            jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }

        // Clean up control characters that might cause JSON parsing errors
        // Replace problematic characters while preserving valid JSON structure
        jsonText = jsonText
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\r/g, '\n'); // Normalize line endings

        const result = JSON.parse(jsonText);
        console.log('✅ Scanner: JSON parsed successfully');

        // Add metadata
        result.id = Date.now().toString();
        result.imageUrl = imageData;
        result.healthData = healthData;
        result.timestamp = Date.now();

        return result;
    } catch (parseError) {
        console.error('❌ Scanner: Failed to parse response:', parseError);
        console.error('Response text:', responseText ? responseText.substring(0, 500) : 'N/A');
        throw new Error('Gagal mem-parse response dari AI: ' + parseError.message);
    }
}

function formatHealthDataForPrompt(healthData) {
    if (!healthData || healthData.diseases.length === 0) {
        return 'Tidak ada kondisi kesehatan khusus yang dilaporkan.';
    }

    const diseaseMap = {
        'susu': 'Alergi Susu',
        'kacang_tanah': 'Alergi Kacang Tanah',
        'kacang_pohon': 'Alergi Kacang Pohon',
        'seafood': 'Alergi Seafood',
        'gluten': 'Alergi Gluten',
        'kedelai': 'Alergi Kedelai',
        'telur': 'Alergi Telur',
        'diabetes': 'Diabetes Mellitus',
        'obesitas': 'Obesitas',
        'dislipidemia': 'Dislipidemia',
        'hipertensi': 'Hipertensi',
        'sindrom_metabolik': 'Sindrom Metabolik',
        'jantung_koroner': 'Penyakit Jantung Koroner',
        'gagal_jantung': 'Gagal Jantung',
        'stroke_iskemik': 'Stroke Iskemik',
        'aritmia': 'Aritmia',
        'ppok': 'PPOK',
        'asma_kronis': 'Asma Kronis',
        'bronkitis_kronis': 'Bronkitis Kronis',
        'kanker_payudara': 'Kanker Payudara',
        'kanker_serviks': 'Kanker Serviks',
        'kanker_kolorektal': 'Kanker Kolorektal',
        'kanker_paru': 'Kanker Paru',
        'kanker_prostat': 'Kanker Prostat',
        'gagal_ginjal_kronis': 'Gagal Ginjal Kronis',
        'batu_ginjal': 'Batu Ginjal',
        'nefritis': 'Nefritis'
    };

    const conditions = healthData.diseases.map(d => diseaseMap[d] || d);
    let text = `Kondisi Kesehatan:\n- ` + conditions.join('\n- ');

    if (healthData.otherConditions) {
        text += `\n\nKondisi Lain: ${healthData.otherConditions}`;
    }

    return text;
}

// ===================================
// MOCK ANALYSIS (when API fails)
// ===================================

function generateMockAnalysis() {
    console.log('🎭 Generating mock analysis (Failure state)...');

    return {
        productName: "Gagal Menganalisis",
        nutritionFacts: {
            servingSize: "-",
            calories: 0,
            totalFat: 0,
            saturatedFat: 0,
            transFat: 0,
            cholesterol: 0,
            sodium: 0,
            totalCarbohydrate: 0,
            dietaryFiber: 0,
            sugars: 0,
            protein: 0
        },
        ingredients: ["-"],
        riskAssessment: {
            level: "high",
            factors: ["Gambar tidak jelas", "Label nutrisi tidak terdeteksi"],
            score: 0
        },
        recommendations: [],
        bpomCompliance: {
            compliant: false,
            violations: [],
            warnings: []
        },
        whoCompliance: {
            compliant: false,
            violations: [],
            warnings: []
        },
        analysisText: `
 AI GAGAL ANALISIS LABEL!

Mohon maaf, AI kami tidak dapat membaca informasi nutrisi dari gambar yang Anda berikan.

COBA SCAN ULANG DENGAN CARA:
1. Pastikan Tabel Nilai Gizi terlihat jelas dan tidak buram.
2. Pastikan pencahayaan cukup terang.
3. Hindari pantulan cahaya pada kemasan.

Silakan coba lagi dengan gambar yang lebih jelas!
        `
    };
}

// ===================================
// RESULTS DISPLAY
// ===================================

function displayResults(result) {
    hideLoadingState();

    // Hide the scan button section
    const scanSection = document.querySelector('.scan-section');
    if (scanSection) {
        scanSection.style.display = 'none';
    }

    // Create results HTML
    const resultsHTML = `
        <div class="results-container" style="margin-top: 3rem; padding: 2rem; background: white; border-radius: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">
            <h2 style="color: #00c853; margin-bottom: 2rem; text-align: center;">📊 Hasil Analisis Nutrisi</h2>
            
            <!-- Product Info -->
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: #f8fffe; border-radius: 15px;">
                <h3 style="color: #1b5e20; margin-bottom: 1rem;">${result.productName}</h3>
                <p style="color: #666;">Takaran Saji: ${result.nutritionFacts.servingSize}</p>
            </div>
            
            <!-- Risk Assessment -->
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: ${getRiskColor(result.riskAssessment.level)}; border-radius: 15px; border-left: 5px solid ${getRiskBorderColor(result.riskAssessment.level)};">
                <h3 style="margin-bottom: 1rem;">⚠️ Tingkat Risiko: ${getRiskLabel(result.riskAssessment.level)}</h3>

                <div style="margin-top: 1rem;">
                    <strong>Faktor Risiko:</strong>
                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                        ${result.riskAssessment.factors.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <!-- Nutrition Facts -->
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: #fff; border: 2px solid #e0e0e0; border-radius: 15px;">
                <h3 style="color: #00c853; margin-bottom: 1rem;">📋 Informasi Nilai Gizi</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${formatNutritionFact('Kalori', result.nutritionFacts.calories, 'kcal')}
                    ${formatNutritionFact('Lemak Total', result.nutritionFacts.totalFat, 'g')}
                    ${formatNutritionFact('Lemak Jenuh', result.nutritionFacts.saturatedFat, 'g')}
                    ${formatNutritionFact('Lemak Trans', result.nutritionFacts.transFat, 'g')}
                    ${formatNutritionFact('Kolesterol', result.nutritionFacts.cholesterol, 'mg')}
                    ${formatNutritionFact('Sodium', result.nutritionFacts.sodium, 'mg')}
                    ${formatNutritionFact('Karbohidrat', result.nutritionFacts.totalCarbohydrate, 'g')}
                    ${formatNutritionFact('Serat', result.nutritionFacts.dietaryFiber, 'g')}
                    ${formatNutritionFact('Gula', result.nutritionFacts.sugars, 'g')}
                    ${formatNutritionFact('Protein', result.nutritionFacts.protein, 'g')}
                </div>
            </div>
            
            <!-- Compliance -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <!-- BPOM -->
                <div style="padding: 1.5rem; background: ${result.bpomCompliance.compliant ? '#e8f5e9' : '#ffebee'}; border-radius: 15px; border-left: 5px solid ${result.bpomCompliance.compliant ? '#00c853' : '#ff5252'};">
                    <h4 style="margin-bottom: 0.5rem;">🇮🇩 BPOM Compliance</h4>
                    <p style="font-weight: 600; color: ${result.bpomCompliance.compliant ? '#2e7d32' : '#c62828'};">
                        ${result.bpomCompliance.compliant ? '✅ Sesuai' : '❌ Tidak Sesuai'}
                    </p>
                    ${result.bpomCompliance.violations.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>Pelanggaran:</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                                ${result.bpomCompliance.violations.map(v => `<li>${v}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${result.bpomCompliance.warnings.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>Peringatan:</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                                ${result.bpomCompliance.warnings.map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                
                <!-- WHO -->
                <div style="padding: 1.5rem; background: ${result.whoCompliance.compliant ? '#e8f5e9' : '#ffebee'}; border-radius: 15px; border-left: 5px solid ${result.whoCompliance.compliant ? '#00c853' : '#ff5252'};">
                    <h4 style="margin-bottom: 0.5rem;">🌍 WHO Compliance</h4>
                    <p style="font-weight: 600; color: ${result.whoCompliance.compliant ? '#2e7d32' : '#c62828'};">
                        ${result.whoCompliance.compliant ? '✅ Sesuai' : '❌ Tidak Sesuai'}
                    </p>
                    ${result.whoCompliance.violations.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>Pelanggaran:</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                                ${result.whoCompliance.violations.map(v => `<li>${v}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${result.whoCompliance.warnings.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>Peringatan:</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                                ${result.whoCompliance.warnings.map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Recommendations -->
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: #fff7ed; border-radius: 15px; border-left: 5px solid #F59E0B;">
                <h3 style="color: #1b5e20; margin-bottom: 1rem;">💡 Rekomendasi Personal</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${result.recommendations.map(rec => `
                        <div style="padding: 1rem; background: white; border-radius: 10px; border-left: 4px solid ${getRecommendationColor(rec.category)};">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <span style="font-size: 1.2rem;">${getRecommendationIcon(rec.category)}</span>
                                <strong style="color: ${getRecommendationColor(rec.category)};">${rec.message}</strong>
                            </div>
                            <p style="color: #666; font-size: 0.95rem;">${rec.reason}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Ingredients -->
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: #f8fffe; border-radius: 15px;">
                <h3 style="color: #00c853; margin-bottom: 1rem;">🧪 Komposisi Bahan</h3>
                <p style="color: #666;">${result.ingredients.join(', ')}</p>
            </div>
            
            <!-- Analysis Text -->
            <div style="padding: 1.5rem; background: #e8f5e9; border-radius: 15px;">
                <h3 style="color: #1b5e20; margin-bottom: 1rem;">📝 Analisis Lengkap</h3>
                <p style="color: #333; line-height: 1.8; white-space: pre-line;">${result.analysisText}</p>
            </div>
            
            <!-- Actions -->
            <div style="margin-top: 2rem; text-align: center;">
                <button onclick="resetScanner()" style="padding: 1rem 3rem; background: linear-gradient(135deg, #00e676, #00c853); color: white; border: none; border-radius: 30px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 8px 25px rgba(0, 230, 118, 0.4);">
                    🔄 Scan Produk Lain
                </button>
            </div>
        </div>
    `;

    // Insert results after scan section (questioner section was removed)
    const scanSectionElement = document.querySelector('.scan-section');
    const existingResults = document.querySelector('.results-container');

    if (existingResults) {
        existingResults.remove();
    }

    if (scanSectionElement) {
        scanSectionElement.insertAdjacentHTML('afterend', resultsHTML);
    } else {
        // Fallback: append to main container
        document.querySelector('.main-container').insertAdjacentHTML('beforeend', resultsHTML);
    }

    // Scroll to results
    setTimeout(() => {
        const resultsContainer = document.querySelector('.results-container');
        if (resultsContainer) {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

function formatNutritionFact(label, value, unit) {
    return `
        <div style="padding: 0.75rem; background: #f8fffe; border-radius: 10px;">
            <div style="color: #666; font-size: 0.9rem;">${label}</div>
            <div style="color: #1b5e20; font-size: 1.3rem; font-weight: bold;">${value}${unit}</div>
        </div>
    `;
}

function getRiskColor(level) {
    const colors = {
        'low': '#e8f5e9',
        'medium': '#fff7ed',
        'high': '#ffebee'
    };
    return colors[level] || '#f5f5f5';
}

function getRiskBorderColor(level) {
    const colors = {
        'low': '#00c853',
        'medium': '#F59E0B',
        'high': '#ff5252'
    };
    return colors[level] || '#999';
}

function getRiskLabel(level) {
    const labels = {
        'low': 'Rendah ✅',
        'medium': 'Sedang ⚠️',
        'high': 'Tinggi ❌'
    };
    return labels[level] || 'Tidak Diketahui';
}

function getRecommendationColor(category) {
    const colors = {
        'avoid': '#ff5252',
        'limit': '#F59E0B',
        'safe': '#00c853',
        'beneficial': '#10B981'
    };
    return colors[category] || '#666';
}

function getRecommendationIcon(category) {
    const icons = {
        'avoid': '🚫',
        'limit': '⚠️',
        'safe': '✅',
        'beneficial': '⭐'
    };
    return icons[category] || '💡';
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
        <div style="background: white; padding: 3rem; border-radius: 20px; text-align: center; max-width: 400px;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔬</div>
            <h2 style="color: #00c853; margin-bottom: 1rem;">Menganalisis...</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">AI sedang menganalisis label nutrisi dan memberikan rekomendasi personal untuk Anda</p>
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
// STORAGE
// ===================================

function saveResult(result) {
    try {
        const results = JSON.parse(localStorage.getItem('nutriscan_scan_results') || '[]');

        // Create a copy and remove huge image data before saving to avoid quota exceeded error
        const resultToSave = { ...result };
        if (resultToSave.imageUrl) {
            delete resultToSave.imageUrl;
        }

        results.unshift(resultToSave);

        // Keep only last 10 results
        if (results.length > 10) {
            results.pop();
        }

        localStorage.setItem('nutriscan_scan_results', JSON.stringify(results));
    } catch (e) {
        console.warn('Gagal menyimpan riwayat scan (quota exceeded):', e);
        // If quota still exceeded, we could clear older results
        if (e.name === 'QuotaExceededError') {
            // Try to clear half of the results
            try {
                const results = JSON.parse(localStorage.getItem('nutriscan_scan_results') || '[]');
                const newResults = results.slice(0, 5); // Keep only top 5
                localStorage.setItem('nutriscan_scan_results', JSON.stringify(newResults));
            } catch (retryError) {
                console.error('CRITICAL: Cannot save even after reducing storage', retryError);
            }
        }
    }
}

// ===================================
// RESET
// ===================================

function resetScanner() {
    // Remove results
    const results = document.querySelector('.results-container');
    if (results) results.remove();

    // Show scan button again
    const scanSection = document.querySelector('.scan-section');
    if (scanSection) {
        scanSection.style.display = 'block';
    }

    // Reset image
    removeImage();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
