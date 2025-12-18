let currentMode = 'camera'; // 'camera' or 'upload'
let capturedImages = []; // Array of base64 image data
const MAX_IMAGES = 5;
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
    // If auth flow is disabled globally, skip auth check
    if (typeof ENABLE_AUTH_FLOW !== 'undefined' && !ENABLE_AUTH_FLOW) {
        // Explicitly hide profile
        const profileEl = document.getElementById('userProfile');
        if (profileEl) profileEl.style.display = 'none';
        return;
    }

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
    // Only show profile if auth flow is enabled
    const authEnabled = typeof ENABLE_AUTH_FLOW === 'undefined' || ENABLE_AUTH_FLOW === true;

    if (!authEnabled) {
        // Hide profile when auth is disabled
        const profileEl = document.getElementById('userProfile');
        if (profileEl) profileEl.style.display = 'none';
        return;
    }

    const currentUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (currentUser) {
        const userData = getUserData(currentUser);
        if (userData && userData.name) {
            document.getElementById('userName').textContent = userData.name;
            document.getElementById('userAvatar').textContent = userData.name.charAt(0).toUpperCase();
            // Show profile
            document.getElementById('userProfile').style.display = 'flex';
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

    // Add to images array
    addImageToPreview(imageData);

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

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function processFiles(files) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB per file

    for (const file of files) {
        // Check limit
        if (capturedImages.length >= MAX_IMAGES) {
            alert(`Maksimal ${MAX_IMAGES} gambar. Hapus beberapa gambar untuk menambah yang baru.`);
            break;
        }

        // Validate type
        if (!allowedTypes.includes(file.type)) {
            alert(`File "${file.name}" tidak didukung. Gunakan JPG atau PNG.`);
            continue;
        }

        // Validate size
        if (file.size > maxSize) {
            alert(`File "${file.name}" terlalu besar. Maksimal 5MB per file.`);
            continue;
        }

        // Read and add
        const reader = new FileReader();
        reader.onload = (e) => {
            addImageToPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function addImageToPreview(imageData) {
    if (capturedImages.length >= MAX_IMAGES) {
        alert(`Maksimal ${MAX_IMAGES} gambar.`);
        return;
    }

    capturedImages.push(imageData);
    renderImageGrid();
    updateScanButton();
}

function renderImageGrid() {
    const section = document.getElementById('imagePreviewSection');
    const grid = document.getElementById('imagePreviewGrid');
    const counter = document.getElementById('imageCounter');
    const clearBtn = document.getElementById('btnClearAll');

    if (capturedImages.length === 0) {
        section.classList.remove('active');
        clearBtn.style.display = 'none';
        return;
    }

    section.classList.add('active');
    clearBtn.style.display = 'block';

    // Update counter
    counter.textContent = `${capturedImages.length} / ${MAX_IMAGES} gambar dipilih`;
    if (capturedImages.length >= MAX_IMAGES) {
        counter.classList.add('warning');
    } else {
        counter.classList.remove('warning');
    }

    // Render grid
    grid.innerHTML = capturedImages.map((img, index) => `
        <div class="image-preview-item">
            <img src="${img}" alt="Gambar ${index + 1}">
            <button class="btn-remove-image" onclick="removeImageAt(${index})" title="Hapus gambar">×</button>
        </div>
    `).join('');
}

function removeImageAt(index) {
    capturedImages.splice(index, 1);
    renderImageGrid();
    updateScanButton();

    // Reset file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

function clearAllImages() {
    capturedImages = [];
    renderImageGrid();
    updateScanButton();

    // Reset file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

// HEALTH QUESTIONNAIRE

function loadHealthData() {
    const saved = localStorage.getItem('nutriscan_health_data');
    if (saved) {
        healthData = JSON.parse(saved);
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
        scanBtn.disabled = capturedImages.length === 0;
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
        text-align: center;
    `;

    modal.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="color: #F59E0B; margin-bottom: 1rem;">
            Profil Kesehatan Belum Diatur
        </h2>
        <p style="color: #666; margin-bottom: 2rem; line-height: 1.6;">
            Mohon atur profil fisik Anda dalam profil kesehatan di dashboard terlebih dahulu untuk melanjutkan penggunaan Scanner.
        </p>
        <button id="btnGoToDashboard" style="padding: 1rem 3rem; background: linear-gradient(135deg, #00e676, #00c853); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(0, 230, 118, 0.3);">
            Atur Profil Sekaran
        </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add event listener
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
    if (capturedImages.length === 0) {
        alert('Silakan upload atau ambil foto label nutrisi terlebih dahulu.');
        return;
    }

    // Use null health data
    const health = null;

    // Show loading state
    showLoadingState();

    try {
        // Prepare request with all images
        const result = await analyzeWithGemini(capturedImages, health);

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
    if (capturedImages.length === 0) {
        alert('Silakan upload atau ambil foto label nutrisi terlebih dahulu.');
        return;
    }

    // Check if health data exists (Physical Profile is Mandatory)
    if (!healthData || !healthData.physical || !healthData.physical.weight) {
        showHealthWarningDialog();
        return;
    }

    // Collect health data
    const health = collectHealthData();

    // Show loading state
    showLoadingState();

    // Set 60-second timeout warning
    window._scannerTimeoutId = setTimeout(() => {
        showScannerTimeoutWarning();
    }, 60000);

    try {
        // Prepare request with all images
        const result = await analyzeWithGemini(capturedImages, health);
        // Clear timeout on success
        clearTimeout(window._scannerTimeoutId);

        // Display results
        displayResults(result);

        // Save to localStorage
        saveResult(result);

    } catch (error) {
        console.error('Analysis error:', error);
        clearTimeout(window._scannerTimeoutId);
        hideLoadingState();
        alert('Terjadi kesalahan saat menganalisis. Silakan coba lagi.\n\nError: ' + error.message);
    }
}

async function analyzeWithGemini(imagesArray, healthData) {
    // Prepare health data text
    const healthText = formatHealthDataForPrompt(healthData);

    // Prepare prompt (updated for multi-image)
    const imageCountText = imagesArray.length > 1
        ? `Anda akan menerima ${imagesArray.length} gambar dari produk yang sama (mungkin sisi berbeda dari kemasan).`
        : 'Anda akan menerima 1 gambar label nutrisi.';

    const prompt = `Anda adalah ahli nutrisi yang menganalisis label nutrisi produk makanan.

${imageCountText}

INFORMASI KESEHATAN PENGGUNA:
${healthText}

TUGAS ANDA:
1. Ekstrak informasi nutrisi dari semua gambar label (per takaran saji)
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

    // Build parts array: prompt text + all images
    const parts = [
        { text: prompt },
        ...imagesArray.map(imageData => ({
            inline_data: {
                mime_type: "image/jpeg",
                data: imageData.split(',')[1]
            }
        }))
    ];

    // Prepare API request
    const requestBody = {
        contents: [{
            parts: parts
        }]
    };

    // Call Gemini API through secure backend proxy
    // API Key tersembunyi di backend, frontend hanya kirim request
    let data;
    try {
        data = await callGeminiAPI(requestBody, 'default');
    } catch (apiError) {
        console.error('❌ Scanner: API call failed:', apiError.message);
        throw new Error(`Gagal menghubungi AI: ${apiError.message}. Pastikan server backend berjalan dan API key valid.`);
    }

    // Extract response text
    let responseText;
    try {
        // Safety check for API response structure
        if (!data || !data.candidates || data.candidates.length === 0 ||
            !data.candidates[0].content || !data.candidates[0].content.parts ||
            data.candidates[0].content.parts.length === 0) {

            console.error('❌ Scanner: Invalid API Response Structure:', data);
            throw new Error('AI tidak memberikan respon yang valid. Silakan coba lagi.');
        }

        responseText = data.candidates[0].content.parts[0].text;
        console.log('📝 Response text length:', responseText.length);

        // Parse JSON from response (remove markdown code blocks if present)
        let jsonText = responseText;

        // Find JSON block more robustly
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
            jsonText.match(/```\s*([\s\S]*?)\s*```/) ||
            [null, jsonText];

        jsonText = jsonMatch[1] || jsonText;

        // If it still looks like it has text before/after, try finding first { and last }
        if (!jsonText.trim().startsWith('{')) {
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            }
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
        result.imageUrl = imagesArray[0]; // Store first image as preview
        result.healthData = healthData;
        result.timestamp = Date.now();

        // Store globally for saving
        currentAnalysisResult = result;

        return result;
    } catch (parseError) {
        console.error('❌ Scanner: Failed to parse response:', parseError.message);
        throw new Error('Gagal mem-parse response dari AI: ' + parseError.message);
    }
}

function formatHealthDataForPrompt(healthData) {
    // Collect all conditions and allergies
    let allConditions = [];

    // 1. Allergies
    if (healthData.allergies) {
        if (Array.isArray(healthData.allergies)) {
            allConditions.push(...healthData.allergies);
        } else if (typeof healthData.allergies === 'string') {
            allConditions.push(...healthData.allergies.split(',').map(a => a.trim()).filter(a => a));
        }
    }

    // 2. Conditions
    if (healthData.conditions && Array.isArray(healthData.conditions)) {
        allConditions.push(...healthData.conditions);
    } else if (healthData.healthConditions && typeof healthData.healthConditions === 'string') {
        allConditions.push(...healthData.healthConditions.split(',').map(c => c.trim()).filter(c => c));
    } else if (healthData.diseases && Array.isArray(healthData.diseases)) {
        allConditions.push(...healthData.diseases);
    }

    if (allConditions.length === 0 && !healthData.otherConditions) {
        return 'Tidak ada kondisi kesehatan khusus yang dilaporkan.';
    }

    const diseaseMap = {
        // Allergies
        'susu': 'Alergi Susu/Laktosa',
        'kacang_tanah': 'Alergi Kacang Tanah',
        'kacang_pohon': 'Alergi Kacang Pohon',
        'seafood': 'Alergi Seafood',
        'gluten': 'Alergi Gluten',
        'kedelai': 'Alergi Kedelai',
        'telur': 'Alergi Telur',
        // Metabolic
        'diabetes': 'Diabetes Mellitus',
        'obesitas': 'Obesitas',
        'dislipidemia': 'Dislipidemia/Kolesterol Tinggi',
        'hipertensi': 'Hipertensi',
        'sindrom_metabolik': 'Sindrom Metabolik',
        // Cardiovascular
        'jantung_koroner': 'Penyakit Jantung Koroner',
        'gagal_jantung': 'Gagal Jantung',
        'stroke_iskemik': 'Stroke Iskemik',
        'aritmia': 'Aritmia',
        // Respiratory
        'ppok': 'PPOK',
        'asma': 'Asma Kronis',
        'bronkitis': 'Bronkitis Kronis',
        // Cancer
        'kanker_payudara': 'Kanker Payudara',
        'kanker_serviks': 'Kanker Serviks',
        'kanker_paru': 'Kanker Paru',
        'kanker_usus': 'Kanker Usus Besar',
        'kanker_hati': 'Kanker Hati',
        // Digestive
        'gerd': 'GERD',
        'ibs': 'IBS',
        'intoleransi_laktosa': 'Intoleransi Laktosa'
    };

    const formattedConditions = allConditions.map(d => diseaseMap[d] || d);

    // Remove duplicates
    const uniqueConditions = [...new Set(formattedConditions)];

    let text = `Kondisi Kesehatan & Pantangan:\n- ` + uniqueConditions.join('\n- ');

    if (healthData.otherConditions) {
        text += `\n\nKondisi Lain: ${healthData.otherConditions}`;
    }

    // Add Physical Context
    if (healthData.physical) {
        text += `\n\nData Fisik:
- Usia: ${healthData.physical.age} tahun
- Gender: ${healthData.physical.gender}
- BMI/Status: (Berat ${healthData.physical.weight}kg / Tinggi ${healthData.physical.height}cm)`;
    }

    if (healthData.calculated) {
        text += `\n- TDEE (Kebutuhan Kalori): ${healthData.calculated.tdee} kkal`;
    }

    return text;
}

// ===================================
// MOCK ANALYSIS (when API fails)
// ===================================

function generateMockAnalysis() {
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
                    <h4 style="margin-bottom: 0.5rem;">🇮🇩 BPOM Rekomendasi Kesehatan Nasional</h4>
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
                    <h4 style="margin-bottom: 0.5rem;">🌍 WHO Rekomendasi Kesehatan Internasional</h4>
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
            <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center;">
                ${result.productName !== "Gagal Menganalisis" ? `
                    <button onclick="saveToHistory()" id="btnSaveHistory" style="width: 100%; max-width: 300px; padding: 1rem; background: white; color: #00c853; border: 2px solid #00c853; border-radius: 30px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span>💾</span> Simpan ke History
                    </button>
                ` : ''}
                
                <button onclick="resetScanner()" style="width: 100%; max-width: 300px; padding: 1rem; background: linear-gradient(135deg, #00e676, #00c853); color: white; border: none; border-radius: 30px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 8px 25px rgba(0, 230, 118, 0.4);">
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

// Global variable to store current result for saving
let currentAnalysisResult = null;

function saveToHistory() {
    if (!currentAnalysisResult) return;

    const STORAGE_KEY_HISTORY = 'nutriscan_scan_history';
    const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB Limit
    const WARNING_THRESHOLD = 4 * 1024 * 1024; // 4MB Warning
    const MAX_ITEMS = 50; // Hard limit items
    const WARNING_ITEMS = 20; // Warning threshold items

    let history = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (raw) history = JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse history:', e);
        history = [];
    }

    // Prepare new item (WITHOUT IMAGE to save space)
    const newItem = {
        ...currentAnalysisResult,
        imageUrl: null, // Explicitly remove image
        savedAt: Date.now()
    };

    // Calculate sizes
    const currentHistoryJson = JSON.stringify(history);
    const newItemJson = JSON.stringify(newItem);
    const totalSize = currentHistoryJson.length + newItemJson.length;

    // Check for warning
    if (totalSize > WARNING_THRESHOLD || history.length >= WARNING_ITEMS) {
        // Check if we already warned for this session? Maybe just show confirm
        if (!confirm('⚠️ Penyimpanan History Hampir Penuh!\n\nMenyimpan data ini mungkin akan memakan ruang penyimpanan browser Anda. Sebaiknya hapus beberapa riwayat lama agar performa tetap optimal.\n\nLanjutkan menyimpan?')) {
            return;
        }
    }

    // Auto-cleanup if full
    while ((totalSize > MAX_STORAGE_SIZE || history.length >= MAX_ITEMS) && history.length > 0) {
        history.pop(); // Remove oldest
        // Recalculate size (approximation)
    }

    // Add new item to top
    history.unshift(newItem);

    // Save
    try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));

        // Update UI
        const btn = document.getElementById('btnSaveHistory');
        if (btn) {
            btn.innerHTML = '<span>✅</span> Tersimpan!';
            btn.disabled = true;
            btn.style.background = '#e8f5e9';
            btn.style.borderColor = '#e8f5e9';
            btn.style.color = '#2e7d32';
        }

    } catch (e) {
        alert('Gagal menyimpan: Penyimpanan penuh. Harap hapus history lama.');
    }
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
    // Also remove timeout warning modal if present
    const warningModal = document.querySelector('.loading-timeout-modal');
    if (warningModal) {
        warningModal.remove();
    }
    // Also remove server overload modal if present
    const overloadModal = document.querySelector('.server-overload-modal');
    if (overloadModal) {
        overloadModal.remove();
    }
}

function showScannerTimeoutWarning() {
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
                Analisis gambar sudah berjalan lebih dari <strong>1 menit</strong>.
                Server AI mungkin sedang mengalami <strong>overload</strong>.
            </p>
            <div style="background: #fff3e0; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <p style="color: #e65100; margin: 0; font-size: 0.95rem;">
                    Apakah Anda ingin <strong>batalkan</strong> dan coba lagi nanti,<br>
                    atau <strong>lanjutkan</strong> menunggu?
                </p>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button id="cancelScanBtn"
                        style="background: #ff5252; color: white; border: none; 
                               padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                               cursor: pointer; box-shadow: 0 4px 15px rgba(255,82,82,0.3);">
                    ❌ Batalkan
                </button>
                <button id="continueScanBtn"
                        style="background: linear-gradient(135deg, #00c853, #00e676); color: white; border: none; 
                               padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                               cursor: pointer; box-shadow: 0 4px 15px rgba(0,200,83,0.3);">
                    ✅ Lanjutkan Menunggu
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Cancel button - stop loading and show overload modal
    document.getElementById('cancelScanBtn').addEventListener('click', () => {
        modal.remove();
        clearTimeout(window._scannerTimeoutId);
        hideLoadingState();
        showServerOverloadModal();
    });

    // Continue button - just close this warning and set another timeout
    document.getElementById('continueScanBtn').addEventListener('click', () => {
        modal.remove();
        // Set another timeout for 1 more minute
        window._scannerTimeoutId = setTimeout(() => {
            showScannerTimeoutWarning();
        }, 60000);
    });
}

// Server Overload Modal for Scanner
function showServerOverloadModal() {
    const existing = document.querySelector('.server-overload-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'server-overload-modal';
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
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔥</div>
            <h2 style="color: #ff5252; margin-bottom: 1rem;">Server Sedang Sibuk</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem;">
                Server AI sedang mengalami beban tinggi. Silakan coba lagi dalam beberapa menit.
            </p>
            <div style="background: #ffebee; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <p style="color: #c62828; margin: 0; font-size: 0.95rem;">
                    <strong>Tips:</strong> Coba lagi dalam 2-3 menit, atau gunakan gambar dengan ukuran lebih kecil.
                </p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: linear-gradient(135deg, #00c853, #00e676); color: white; border: none; 
                           padding: 0.75rem 2rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                           cursor: pointer; box-shadow: 0 4px 15px rgba(0,200,83,0.3);">
                OK, Mengerti
            </button>
        </div>
    `;

    document.body.appendChild(modal);
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

    // Clear all images
    clearAllImages();

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
