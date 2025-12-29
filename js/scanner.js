let currentMode = 'camera';
let capturedImages = [];
const MAX_IMAGES = 5;
let videoStream = null;
let healthData = null;

const STORAGE_KEY_CURRENT_USER = 'nutriscan_current_user';
const STORAGE_KEY_USER_DATA = 'nutriscan_user_data_';

// Bilingual alert helper
function showAlert(messageKey) {
    const currentLang = localStorage.getItem('nutriscan_language') || 'id';
    const messages = {
        cameraError: {
            id: 'Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.',
            en: 'Cannot access camera. Please ensure camera permission is granted.'
        },
        maxImagesReached: {
            id: `Maksimal ${MAX_IMAGES} gambar. Hapus beberapa gambar untuk menambah yang baru.`,
            en: `Maximum ${MAX_IMAGES} images. Remove some images to add new ones.`
        },
        fileTypeNotSupported: {
            id: (filename) => `File "${filename}" tidak didukung. Gunakan JPG atau PNG.`,
            en: (filename) => `File "${filename}" is not supported. Use JPG or PNG.`
        },
        fileTooLarge: {
            id: (filename) => `File "${filename}" terlalu besar. Maksimal 5MB per file.`,
            en: (filename) => `File "${filename}" is too large. Maximum 5MB per file.`
        },
        maxImagesLimit: {
            id: `Maksimal ${MAX_IMAGES} gambar.`,
            en: `Maximum ${MAX_IMAGES} images.`
        },
        noImagesSelected: {
            id: 'Silakan upload atau ambil foto label nutrisi terlebih dahulu.',
            en: 'Please upload or take a photo of the nutrition label first.'
        },
        analysisError: {
            id: (errorMsg) => `Terjadi kesalahan saat menganalisis. Silakan coba lagi.\n\nError: ${errorMsg}`,
            en: (errorMsg) => `An error occurred during analysis. Please try again.\n\nError: ${errorMsg}`
        },
        saveHistoryFailed: {
            id: 'Gagal menyimpan: Penyimpanan penuh. Harap hapus history lama.',
            en: 'Failed to save: Storage is full. Please delete old history.'
        },
        saveHistoryWarning: {
            id: '⚠️ Penyimpanan History Hampir Penuh!\n\nMenyimpan data ini mungkin akan memakan ruang penyimpanan browser Anda. Sebaiknya hapus beberapa riwayat lama agar performa tetap optimal.\n\nLanjutkan menyimpan?',
            en: '⚠️ History Storage Almost Full!\n\nSaving this data may consume your browser storage space. It\'s recommended to delete some old history for optimal performance.\n\nContinue saving?'
        }
    };

    const msg = messages[messageKey];
    if (!msg) {
        alert(messageKey); // Fallback
        return;
    }

    const text = typeof msg[currentLang] === 'function' ? msg[currentLang] : msg[currentLang];
    if (typeof text === 'function') {
        return text; // Return function for dynamic messages
    }
    alert(text);
}

// Bilingual error messages helper
function getErrorMessage(key, ...args) {
    const currentLang = localStorage.getItem('nutriscan_language') || 'id';
    const errors = {
        apiConnectionFailed: {
            id: (apiMsg) => `Gagal menghubungi AI: ${apiMsg}. Pastikan server backend berjalan dan API key valid.`,
            en: (apiMsg) => `Failed to connect to AI: ${apiMsg}. Please ensure the backend server is running and API key is valid.`
        },
        invalidAIResponse: {
            id: 'AI tidak memberikan respon yang valid. Silakan coba lagi.',
            en: 'AI did not provide a valid response. Please try again.'
        },
        jsonParseFailed: {
            id: (parseMsg) => `Gagal mem-parse response dari AI: ${parseMsg}`,
            en: (parseMsg) => `Failed to parse AI response: ${parseMsg}`
        }
    };

    const error = errors[key];
    if (!error) return key;

    const message = error[currentLang];
    return typeof message === 'function' ? message(...args) : message;
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadHealthData();
    setupEventListeners();
});

function checkAuthStatus() {
    if (typeof ENABLE_AUTH_FLOW !== 'undefined' && !ENABLE_AUTH_FLOW) {
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
    const authEnabled = typeof ENABLE_AUTH_FLOW === 'undefined' || ENABLE_AUTH_FLOW === true;

    if (!authEnabled) {
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
            document.getElementById('userProfile').style.display = 'flex';
        }
    }
}

function setupEventListeners() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    }

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

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
        stopCamera();
    } else {
        cameraBtn.classList.remove('active');
        uploadBtn.classList.add('active');
        cameraContainer.classList.remove('active');
        uploadContainer.classList.add('active');
        stopCamera();
    }
}

async function startCamera() {
    try {
        const video = document.getElementById('videoElement');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        video.srcObject = stream;
        videoStream = stream;

        document.querySelector('.btn-capture:nth-of-type(1)').style.display = 'none';
        document.getElementById('captureBtn').style.display = 'inline-block';
        document.getElementById('cancelBtn').style.display = 'inline-block';

    } catch (error) {
        console.error('Error accessing camera:', error);
        showAlert('cameraError');
    }
}

function capturePhoto() {
    const video = document.getElementById('videoElement');
    const canvas = document.createElement('canvas');

    const MAX_DIMENSION = 800;
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

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    addImageToPreview(imageData);
    stopCamera();

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
    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
        // Check limit
        if (capturedImages.length >= MAX_IMAGES) {
            showAlert('maxImagesReached');
            break;
        }
        // Validate type
        if (!allowedTypes.includes(file.type)) {
            const getMessage = showAlert('fileTypeNotSupported');
            alert(getMessage(file.name));
            continue;
        }
        // Validate size
        if (file.size > maxSize) {
            const getMessage = showAlert('fileTooLarge');
            alert(getMessage(file.name));
            continue;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            addImageToPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function addImageToPreview(imageData) {
    if (capturedImages.length >= MAX_IMAGES) {
        showAlert('maxImagesLimit');
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

    // Language-aware counter
    const currentLang = localStorage.getItem('nutriscan_language') || 'id';
    const counterText = currentLang === 'en'
        ? `${capturedImages.length} / ${MAX_IMAGES} images selected`
        : `${capturedImages.length} / ${MAX_IMAGES} gambar dipilih`;

    counter.textContent = counterText;

    if (capturedImages.length >= MAX_IMAGES) {
        counter.classList.add('warning');
    } else {
        counter.classList.remove('warning');
    }

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

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

function clearAllImages() {
    capturedImages = [];
    renderImageGrid();
    updateScanButton();

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

function loadHealthData() {
    const saved = localStorage.getItem('nutriscan_health_data');
    if (saved) {
        healthData = JSON.parse(saved);
    }
}

function collectHealthData() {
    return healthData;
}

function updateScanButton() {
    const scanBtn = document.querySelector('.btn-scan');
    if (scanBtn) {
        scanBtn.disabled = capturedImages.length === 0;
    }
}

function showHealthWarningDialog() {
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

    const currentLang = localStorage.getItem('nutriscan_language') || 'id';
    const t = currentLang === 'en' ? {
        title: 'Health Profile Not Set',
        message: 'Please set up your physical profile in the health profile on the dashboard first to continue using the Scanner.',
        button: 'Set Profile Now'
    } : {
        title: 'Profil Kesehatan Belum Diatur',
        message: 'Mohon atur profil fisik Anda dalam profil kesehatan di dashboard terlebih dahulu untuk melanjutkan penggunaan Scanner.',
        button: 'Atur Profil Sekarang'
    };

    modal.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="color: #F59E0B; margin-bottom: 1rem;">
            ${t.title}
        </h2>
        <p style="color: #666; margin-bottom: 2rem; line-height: 1.6;">
            ${t.message}
        </p>
        <button id="btnGoToDashboard" style="padding: 1rem 3rem; background: linear-gradient(135deg, #00e676, #00c853); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(0, 230, 118, 0.3);">
            ${t.button}
        </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('btnGoToDashboard').addEventListener('click', () => {
        overlay.remove();
        window.location.href = 'Index.html';
    });
}

async function performScan() {
    if (capturedImages.length === 0) {
        showAlert('noImagesSelected');
        return;
    }

    if (!healthData || !healthData.physical || !healthData.physical.weight) {
        showHealthWarningDialog();
        return;
    }

    const health = collectHealthData();
    showLoadingState();

    window._scannerTimeoutId = setTimeout(() => {
        showScannerTimeoutWarning();
    }, 60000);

    try {
        const result = await analyzeWithGemini(capturedImages, health);
        clearTimeout(window._scannerTimeoutId);

        displayResults(result);
        saveResult(result);

    } catch (error) {
        console.error('Analysis error:', error);
        clearTimeout(window._scannerTimeoutId);
        hideLoadingState();
        const getMessage = showAlert('analysisError');
        alert(getMessage(error.message));
    }
}

async function analyzeWithGemini(imagesArray, healthData) {
    const healthText = formatHealthDataForPrompt(healthData);
    const imageCountText = imagesArray.length > 1
        ? `Anda akan menerima ${imagesArray.length} gambar dari produk yang sama (mungkin sisi berbeda dari kemasan).`
        : 'Anda akan menerima 1 gambar label nutrisi.';

    // Language detection
    const currentLang = localStorage.getItem('nutriscan_language') || 'id';

    // Language instruction based on selected language
    const languageInstruction = currentLang === 'en'
        ? 'IMPORTANT: Provide ALL text output (analysisText, recommendations, warnings, violations) in ENGLISH language.'
        : 'PENTING: Berikan SEMUA output teks (analysisText, rekomendasi, peringatan, pelanggaran) dalam BAHASA INDONESIA.';

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
  "analysisText": "ANALISIS LENGKAP DAN DETAIL"
}

CRITICAL INSTRUCTIONS:
1. WAJIB isi field "analysisText" dengan analisis yang LENGKAP, DETAIL, dan KOMPREHENSIF (minimal 300-500 kata)
2. Dalam "analysisText", jelaskan secara rinci:
   - Ringkasan komposisi nutrisi produk ini
   - Analisis DETAIL setiap nutrisi yang melebihi atau kurang dari standar BPOM/WHO
   - Dampak spesifik terhadap kondisi kesehatan pengguna (jika ada)
   - Perbandingan dengan kebutuhan harian pengguna
   - Rekomendasi konsumsi yang aman dan spesifik
   - Tips praktis untuk mengonsumsi produk ini dengan lebih sehat
3. JANGAN PERNAH mengosongkan atau meringkas "analysisText" dan PASTIKAN berikan poin-poin/sub-poin/semacamnya penting agar teksnya menarik dibaca
4. Berikan analisis yang PERSONAL berdasarkan kondisi kesehatan pengguna
5. Gunakan bahasa yang mudah dipahami namun tetap ilmiah dan profesional
6. Pastikan semua kurung kurawal dan kurung siku JSON ditutup dengan benar
7. ${languageInstruction}

Berikan analisis yang DETAIL, LENGKAP, dan PERSONAL sesuai kondisi kesehatan pengguna!`;

    const parts = [
        { text: prompt },
        ...imagesArray.map(imageData => ({
            inline_data: {
                mime_type: "image/jpeg",
                data: imageData.split(',')[1]
            }
        }))
    ];

    const requestBody = {
        contents: [{
            parts: parts
        }]
    };

    let data;
    try {
        data = await callGeminiAPI(requestBody, 'default');
    } catch (apiError) {
        console.error('❌ Scanner: API call failed:', apiError.message);
        throw new Error(getErrorMessage('apiConnectionFailed', apiError.message));
    }

    let responseText;
    try {
        if (!data || !data.candidates || data.candidates.length === 0 ||
            !data.candidates[0].content || !data.candidates[0].content.parts ||
            data.candidates[0].content.parts.length === 0) {

            console.error('❌ Scanner: Invalid API Response Structure:', data);
            throw new Error(getErrorMessage('invalidAIResponse'));
        }

        responseText = data.candidates[0].content.parts[0].text;

        let jsonText = responseText;

        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
            jsonText.match(/```\s*([\s\S]*?)\s*```/) ||
            [null, jsonText];

        jsonText = jsonMatch[1] || jsonText;

        if (!jsonText.trim().startsWith('{')) {
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            }
        }

        const openBraces = (jsonText.match(/{/g) || []).length;
        const closeBraces = (jsonText.match(/}/g) || []).length;
        const openBrackets = (jsonText.match(/\[/g) || []).length;
        const closeBrackets = (jsonText.match(/\]/g) || []).length;

        if (openBraces > closeBraces || openBrackets > closeBrackets) {
            const missingBrackets = openBrackets - closeBrackets;
            const missingBraces = openBraces - closeBraces;

            for (let i = 0; i < missingBrackets; i++) {
                jsonText += '\n  ]';
            }
            for (let i = 0; i < missingBraces; i++) {
                jsonText += '\n}';
            }
        }

        let result;
        try {
            result = JSON.parse(jsonText);
        } catch (jsonError) {
            const errorMatch = jsonError.message.match(/position (\d+)/);
            if (errorMatch) {
                const errorPos = parseInt(errorMatch[1]);
                const start = Math.max(0, errorPos - 100);
                const end = Math.min(jsonText.length, errorPos + 100);
                console.error('❌ JSON Parse Error at position:', errorPos);
                console.error('Problematic JSON snippet:', jsonText.substring(start, end));
                console.error('Character at error position:', jsonText[errorPos], '(code:', jsonText.charCodeAt(errorPos), ')');
            } else {
                console.error('❌ JSON Parse Error:', jsonError.message);
                console.error('Full JSON text:', jsonText);
            }
            throw jsonError;
        }

        result.id = Date.now().toString();
        result.imageUrl = imagesArray[0];
        result.healthData = healthData;
        result.timestamp = Date.now();

        currentAnalysisResult = result;

        return result;
    } catch (parseError) {
        console.error('❌ Scanner: Failed to parse response:', parseError.message);
        throw new Error(getErrorMessage('jsonParseFailed', parseError.message));
    }
}

function formatHealthDataForPrompt(healthData) {
    let allConditions = [];

    if (healthData.allergies) {
        if (Array.isArray(healthData.allergies)) {
            allConditions.push(...healthData.allergies);
        } else if (typeof healthData.allergies === 'string') {
            allConditions.push(...healthData.allergies.split(',').map(a => a.trim()).filter(a => a));
        }
    }

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
        'susu': 'Alergi Susu/Laktosa',
        'kacang_tanah': 'Alergi Kacang Tanah',
        'kacang_pohon': 'Alergi Kacang Pohon',
        'seafood': 'Alergi Seafood',
        'gluten': 'Alergi Gluten',
        'kedelai': 'Alergi Kedelai',
        'telur': 'Alergi Telur',
        'diabetes': 'Diabetes Mellitus',
        'obesitas': 'Obesitas',
        'dislipidemia': 'Dislipidemia/Kolesterol Tinggi',
        'hipertensi': 'Hipertensi',
        'sindrom_metabolik': 'Sindrom Metabolik',
        'jantung_koroner': 'Penyakit Jantung Koroner',
        'gagal_jantung': 'Gagal Jantung',
        'stroke_iskemik': 'Stroke Iskemik',
        'aritmia': 'Aritmia',
        'ppok': 'PPOK',
        'asma': 'Asma Kronis',
        'bronkitis': 'Bronkitis Kronis',
        'kanker_payudara': 'Kanker Payudara',
        'kanker_serviks': 'Kanker Serviks',
        'kanker_paru': 'Kanker Paru',
        'kanker_usus': 'Kanker Usus Besar',
        'kanker_hati': 'Kanker Hati',
        'gerd': 'GERD',
        'ibs': 'IBS',
        'intoleransi_laktosa': 'Intoleransi Laktosa'
    };

    const formattedConditions = allConditions.map(d => diseaseMap[d] || d);
    const uniqueConditions = [...new Set(formattedConditions)];

    let text = `Kondisi Kesehatan & Pantangan:\n- ` + uniqueConditions.join('\n- ');

    if (healthData.otherConditions) {
        text += `\n\nKondisi Lain: ${healthData.otherConditions}`;
    }

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

function displayResults(result) {
    hideLoadingState();

    const scanSection = document.querySelector('.scan-section');
    if (scanSection) {
        scanSection.style.display = 'none';
    }

    // Language detection for UI translations
    const currentLang = localStorage.getItem('nutriscan_language') || 'id';
    const t = currentLang === 'en' ? {
        title: 'Nutrition Analysis Results',
        servingSize: 'Serving Size:',
        riskLevel: 'Risk Level:',
        riskFactors: 'Risk Factors:',
        nutritionInfo: 'Nutrition Information',
        calories: 'Calories',
        totalFat: 'Total Fat',
        saturatedFat: 'Saturated Fat',
        transFat: 'Trans Fat',
        cholesterol: 'Cholesterol',
        sodium: 'Sodium',
        carbs: 'Carbohydrates',
        fiber: 'Dietary Fiber',
        sugars: 'Sugars',
        protein: 'Protein',
        bpomTitle: 'BPOM National Health Recommendation',
        whoTitle: 'WHO International Health Recommendation',
        compliant: 'Compliant',
        notCompliant: 'Not Compliant',
        violations: 'Violations:',
        warnings: 'Warnings:',
        recommendations: 'Personal Recommendations',
        ingredients: 'Ingredients',
        analysis: 'Complete Analysis',
        saveHistory: 'Save to History',
        scanAgain: 'Scan Another Product',
        riskLow: 'Low ✅',
        riskMedium: 'Medium ⚠️',
        riskHigh: 'High ❌'
    } : {
        title: 'Hasil Analisis Nutrisi',
        servingSize: 'Takaran Saji:',
        riskLevel: 'Tingkat Risiko:',
        riskFactors: 'Faktor Risiko:',
        nutritionInfo: 'Informasi Nilai Gizi',
        calories: 'Kalori',
        totalFat: 'Lemak Total',
        saturatedFat: 'Lemak Jenuh',
        transFat: 'Lemak Trans',
        cholesterol: 'Kolesterol',
        sodium: 'Sodium',
        carbs: 'Karbohidrat',
        fiber: 'Serat',
        sugars: 'Gula',
        protein: 'Protein',
        bpomTitle: 'BPOM Rekomendasi Kesehatan Nasional',
        whoTitle: 'WHO Rekomendasi Kesehatan Internasional',
        compliant: 'Sesuai',
        notCompliant: 'Tidak Sesuai',
        violations: 'Pelanggaran:',
        warnings: 'Peringatan:',
        recommendations: 'Rekomendasi Personal',
        ingredients: 'Komposisi Bahan',
        analysis: 'Analisis Lengkap',
        saveHistory: 'Simpan ke History',
        scanAgain: 'Scan Produk Lain',
        riskLow: 'Rendah ✅',
        riskMedium: 'Sedang ⚠️',
        riskHigh: 'Tinggi ❌'
    };

    // Helper for risk label translation
    const getRiskLabelTranslated = (level) => {
        const labels = {
            'low': t.riskLow,
            'medium': t.riskMedium,
            'high': t.riskHigh
        };
        return labels[level] || 'Unknown';
    };

    const resultsHTML = `
        <div class="results-container" style="margin-top: 3rem; padding: 2rem; background: white; border-radius: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">
            <h2 style="color: #00c853; margin-bottom: 2rem; text-align: center;">📊 ${t.title}</h2>
            
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: #f8fffe; border-radius: 15px;">
                <h3 style="color: #1b5e20; margin-bottom: 1rem;">${result.productName}</h3>
                <p style="color: #666;">${t.servingSize} ${result.nutritionFacts.servingSize}</p>
            </div>
            
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: ${getRiskColor(result.riskAssessment.level)}; border-radius: 15px; border-left: 5px solid ${getRiskBorderColor(result.riskAssessment.level)};">
                <h3 style="margin-bottom: 1rem;">⚠️ ${t.riskLevel} ${getRiskLabelTranslated(result.riskAssessment.level)}</h3>
                <div style="margin-top: 1rem;">
                    <strong>${t.riskFactors}</strong>
                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                        ${result.riskAssessment.factors.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: #fff; border: 2px solid #e0e0e0; border-radius: 15px;">
                <h3 style="color: #00c853; margin-bottom: 1rem;">📋 ${t.nutritionInfo}</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${formatNutritionFact(t.calories, result.nutritionFacts.calories, 'kcal')}
                    ${formatNutritionFact(t.totalFat, result.nutritionFacts.totalFat, 'g')}
                    ${formatNutritionFact(t.saturatedFat, result.nutritionFacts.saturatedFat, 'g')}
                    ${formatNutritionFact(t.transFat, result.nutritionFacts.transFat, 'g')}
                    ${formatNutritionFact(t.cholesterol, result.nutritionFacts.cholesterol, 'mg')}
                    ${formatNutritionFact(t.sodium, result.nutritionFacts.sodium, 'mg')}
                    ${formatNutritionFact(t.carbs, result.nutritionFacts.totalCarbohydrate, 'g')}
                    ${formatNutritionFact(t.fiber, result.nutritionFacts.dietaryFiber, 'g')}
                    ${formatNutritionFact(t.sugars, result.nutritionFacts.sugars, 'g')}
                    ${formatNutritionFact(t.protein, result.nutritionFacts.protein, 'g')}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="padding: 1.5rem; background: ${result.bpomCompliance.compliant ? '#e8f5e9' : '#ffebee'}; border-radius: 15px; border-left: 5px solid ${result.bpomCompliance.compliant ? '#00c853' : '#ff5252'};">
                    <h4 style="margin-bottom: 0.5rem;">🇮🇩 ${t.bpomTitle}</h4>
                    <p style="font-weight: 600; color: ${result.bpomCompliance.compliant ? '#2e7d32' : '#c62828'};">
                        ${result.bpomCompliance.compliant ? `✅ ${t.compliant}` : `❌ ${t.notCompliant}`}
                    </p>
                    ${result.bpomCompliance.violations.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>${t.violations}</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                                ${result.bpomCompliance.violations.map(v => `<li>${v}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${result.bpomCompliance.warnings.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>${t.warnings}</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                                ${result.bpomCompliance.warnings.map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                
                <div style="padding: 1.5rem; background: ${result.whoCompliance.compliant ? '#e8f5e9' : '#ffebee'}; border-radius: 15px; border-left: 5px solid ${result.whoCompliance.compliant ? '#00c853' : '#ff5252'};">
                    <h4 style="margin-bottom: 0.5rem;">🌍 ${t.whoTitle}</h4>
                    <p style="font-weight: 600; color: ${result.whoCompliance.compliant ? '#2e7d32' : '#c62828'};">
                        ${result.whoCompliance.compliant ? `✅ ${t.compliant}` : `❌ ${t.notCompliant}`}
                    </p>
                    ${result.whoCompliance.violations.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>${t.violations}</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                                ${result.whoCompliance.violations.map(v => `<li>${v}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${result.whoCompliance.warnings.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>${t.warnings}</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                                ${result.whoCompliance.warnings.map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: #fff7ed; border-radius: 15px; border-left: 5px solid #F59E0B;">
                <h3 style="color: #1b5e20; margin-bottom: 1rem;">💡 ${t.recommendations}</h3>
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
            
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: #f8fffe; border-radius: 15px;">
                <h3 style="color: #00c853; margin-bottom: 1rem;">🧪 ${t.ingredients}</h3>
                <p style="color: #666;">${result.ingredients.join(', ')}</p>
            </div>
            
            <div style="padding: 1.5rem; background: #e8f5e9; border-radius: 15px;">
                <h3 style="color: #1b5e20; margin-bottom: 1rem;">📝 ${t.analysis}</h3>
                <div style="color: #333; line-height: 1.8;">${convertMarkdownToHTML(result.analysisText)}</div>
            </div>
            
            <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center;">
                ${result.productName !== "Gagal Menganalisis" ? `
                    <button onclick="saveToHistory()" id="btnSaveHistory" style="width: 100%; max-width: 300px; padding: 1rem; background: white; color: #00c853; border: 2px solid #00c853; border-radius: 30px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span>💾</span> ${t.saveHistory}
                    </button>
                ` : ''}
                
                <button onclick="resetScanner()" style="width: 100%; max-width: 300px; padding: 1rem; background: linear-gradient(135deg, #00e676, #00c853); color: white; border: none; border-radius: 30px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 8px 25px rgba(0, 230, 118, 0.4);">
                    🔄 ${t.scanAgain}
                </button>
            </div>
        </div>
    `;

    const scanSectionElement = document.querySelector('.scan-section');
    const existingResults = document.querySelector('.results-container');

    if (existingResults) {
        existingResults.remove();
    }

    if (scanSectionElement) {
        scanSectionElement.insertAdjacentHTML('afterend', resultsHTML);
    } else {
        document.querySelector('.main-container').insertAdjacentHTML('beforeend', resultsHTML);
    }

    setTimeout(() => {
        const resultsContainer = document.querySelector('.results-container');
        if (resultsContainer) {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

let currentAnalysisResult = null;

function saveToHistory() {
    if (!currentAnalysisResult) return;

    const STORAGE_KEY_HISTORY = 'nutriscan_scan_history';
    const MAX_STORAGE_SIZE = 5 * 1024 * 1024;
    const WARNING_THRESHOLD = 4 * 1024 * 1024;
    const MAX_ITEMS = 50;
    const WARNING_ITEMS = 20;

    let history = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (raw) history = JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse history:', e);
        history = [];
    }

    const newItem = {
        ...currentAnalysisResult,
        imageUrl: null,
        savedAt: Date.now()
    };

    const currentHistoryJson = JSON.stringify(history);
    const newItemJson = JSON.stringify(newItem);
    const totalSize = currentHistoryJson.length + newItemJson.length;

    // Check for warning
    if (totalSize > WARNING_THRESHOLD || history.length >= WARNING_ITEMS) {
        const currentLang = localStorage.getItem('nutriscan_language') || 'id';
        const warningMsg = currentLang === 'en'
            ? '⚠️ History Storage Almost Full!\n\nSaving this data may consume your browser storage space. It\'s recommended to delete some old history for optimal performance.\n\nContinue saving?'
            : '⚠️ Penyimpanan History Hampir Penuh!\n\nMenyimpan data ini mungkin akan memakan ruang penyimpanan browser Anda. Sebaiknya hapus beberapa riwayat lama agar performa tetap optimal.\n\nLanjutkan menyimpan?';
        if (!confirm(warningMsg)) {
            return;
        }
    }

    while ((totalSize > MAX_STORAGE_SIZE || history.length >= MAX_ITEMS) && history.length > 0) {
        history.pop();
    }

    history.unshift(newItem);

    try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));

        const btn = document.getElementById('btnSaveHistory');
        if (btn) {
            const currentLang = localStorage.getItem('nutriscan_language') || 'id';
            const savedText = currentLang === 'en' ? 'Saved!' : 'Tersimpan!';
            btn.innerHTML = `<span>✅</span> ${savedText}`;
            btn.disabled = true;
            btn.style.background = '#e8f5e9';
            btn.style.borderColor = '#e8f5e9';
            btn.style.color = '#2e7d32';
        }

    } catch (e) {
        showAlert('saveHistoryFailed');
    }
}

function formatNutritionFact(label, value, unit) {
    const displayValue = (value === null || value === undefined || isNaN(value)) ? 0 : value;

    return `
        <div style="padding: 0.75rem; background: #f8fffe; border-radius: 10px;">
            <div style="color: #666; font-size: 0.9rem;">${label}</div>
            <div style="color: #1b5e20; font-size: 1.3rem; font-weight: bold;">${displayValue}${unit}</div>
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

function convertMarkdownToHTML(markdown) {
    if (!markdown) return '';

    let html = markdown;

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    const lines = html.split('\n');
    const processedLines = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (trimmedLine.match(/^[\*\-]\s+/)) {
            const content = trimmedLine.replace(/^[\*\-]\s+/, '');

            if (!inList) {
                processedLines.push('<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">');
                inList = true;
            }
            processedLines.push(`<li style="margin: 0.3rem 0;">${content}</li>`);
        } else {
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }

            if (trimmedLine) {
                processedLines.push(line);
            } else {
                processedLines.push('<br>');
            }
        }
    }

    if (inList) {
        processedLines.push('</ul>');
    }

    html = processedLines.join('\n');

    return html;
}

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

    const currentLang = localStorage.getItem('nutriscan_language') || 'id';
    const t = currentLang === 'en' ? {
        title: 'Analyzing...',
        message: 'AI is analyzing the nutrition label and providing personalized recommendations for you'
    } : {
        title: 'Menganalisis...',
        message: 'AI sedang menganalisis label nutrisi dan memberikan rekomendasi personal untuk Anda'
    };

    overlay.innerHTML = `
        <div style="background: white; padding: 3rem; border-radius: 20px; text-align: center; max-width: 400px;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔬</div>
            <h2 style="color: #00c853; margin-bottom: 1rem;">${t.title}</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">${t.message}</p>
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
    const warningModal = document.querySelector('.loading-timeout-modal');
    if (warningModal) {
        warningModal.remove();
    }
    const overloadModal = document.querySelector('.server-overload-modal');
    if (overloadModal) {
        overloadModal.remove();
    }
}

function showScannerTimeoutWarning() {
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

    const currentLang = localStorage.getItem('nutriscan_language') || 'id';
    const t = currentLang === 'en' ? {
        title: 'Processing Takes Too Long',
        message: 'Image analysis has been running for more than <strong>1 minute</strong>. AI is working <strong>very hard</strong>.',
        question: 'Would you like to <strong>cancel</strong> and try again later,<br>or <strong>continue</strong> waiting?',
        cancel: 'Cancel',
        continue: 'Continue Waiting'
    } : {
        title: 'Proses Terlalu Lama',
        message: 'Analisis gambar sudah berjalan lebih dari <strong>1 menit</strong>. AI sedang bekerja <strong>sangat keras</strong>.',
        question: 'Apakah Anda ingin <strong>batalkan</strong> dan coba lagi nanti,<br>atau <strong>lanjutkan</strong> menunggu?',
        cancel: 'Batalkan',
        continue: 'Lanjutkan Menunggu'
    };

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 450px; width: 100%; padding: 2.5rem; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">⏳</div>
            <h2 style="color: #f57c00; margin-bottom: 1rem;">${t.title}</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem;">
                ${t.message}
            </p>
            <div style="background: #fff3e0; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <p style="color: #e65100; margin: 0; font-size: 0.95rem;">
                    ${t.question}
                </p>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button id="cancelScanBtn"
                        style="background: #ff5252; color: white; border: none; 
                               padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                               cursor: pointer; box-shadow: 0 4px 15px rgba(255,82,82,0.3);">
                    ❌ ${t.cancel}
                </button>
                <button id="continueScanBtn"
                        style="background: linear-gradient(135deg, #00c853, #00e676); color: white; border: none; 
                               padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                               cursor: pointer; box-shadow: 0 4px 15px rgba(0,200,83,0.3);">
                    ✅ ${t.continue}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cancelScanBtn').addEventListener('click', () => {
        modal.remove();
        clearTimeout(window._scannerTimeoutId);
        hideLoadingState();
        showServerOverloadModal();
    });

    document.getElementById('continueScanBtn').addEventListener('click', () => {
        modal.remove();
        window._scannerTimeoutId = setTimeout(() => {
            showScannerTimeoutWarning();
        }, 60000);
    });
}

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

    const currentLang = localStorage.getItem('nutriscan_language') || 'id';
    const t = currentLang === 'en' ? {
        title: 'Server Busy',
        message: 'AI server is experiencing high load. Please try again in a few minutes.',
        tip: '<strong>Tips:</strong> Try again in 2-3 minutes, or use a smaller image.',
        button: 'OK, Understood'
    } : {
        title: 'Server Sedang Sibuk',
        message: 'Server AI sedang mengalami beban tinggi. Silakan coba lagi dalam beberapa menit.',
        tip: '<strong>Tips:</strong> Coba lagi dalam 2-3 menit, atau gunakan gambar dengan ukuran lebih kecil.',
        button: 'OK, Mengerti'
    };

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 450px; width: 100%; padding: 2.5rem; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔥</div>
            <h2 style="color: #ff5252; margin-bottom: 1rem;">${t.title}</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem;">
                ${t.message}
            </p>
            <div style="background: #ffebee; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <p style="color: #c62828; margin: 0; font-size: 0.95rem;">
                    ${t.tip}
                </p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: linear-gradient(135deg, #00c853, #00e676); color: white; border: none; 
                           padding: 0.75rem 2rem; border-radius: 25px; font-size: 1rem; font-weight: 600; 
                           cursor: pointer; box-shadow: 0 4px 15px rgba(0,200,83,0.3);">
                ${t.button}
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

function saveResult(result) {
    try {
        const results = JSON.parse(localStorage.getItem('nutriscan_scan_results') || '[]');

        const resultToSave = { ...result };
        if (resultToSave.imageUrl) {
            delete resultToSave.imageUrl;
        }

        results.unshift(resultToSave);

        if (results.length > 10) {
            results.pop();
        }

        localStorage.setItem('nutriscan_scan_results', JSON.stringify(results));
    } catch (e) {
        console.warn('Gagal menyimpan riwayat scan (quota exceeded):', e);
        if (e.name === 'QuotaExceededError') {
            try {
                const results = JSON.parse(localStorage.getItem('nutriscan_scan_results') || '[]');
                const newResults = results.slice(0, 5);
                localStorage.setItem('nutriscan_scan_results', JSON.stringify(newResults));
            } catch (retryError) {
                console.error('CRITICAL: Cannot save even after reducing storage', retryError);
            }
        }
    }
}

function resetScanner() {
    const results = document.querySelector('.results-container');
    if (results) results.remove();

    const scanSection = document.querySelector('.scan-section');
    if (scanSection) {
        scanSection.style.display = 'block';
    }

    clearAllImages();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

function logout() {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    window.location.href = 'Index.html';
}
