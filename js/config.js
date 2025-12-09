// API CONFIGURATION

/**
 * Deteksi environment dan tentukan backend URL
 * 
 * Development: http://localhost:3000
 * Production Netlify: https://nutriscan-backend.onrender.com (atau service lain)
 * 
 * Untuk production, ubah REACT_APP_BACKEND_URL sesuai backend service Anda
 */
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE_URL = isLocalhost
    ? 'http://localhost:3000'  // Development
    : (window.NUTRISCAN_BACKEND_URL || 'https://nutriscan-backend.onrender.com');  // Production

const API_ENDPOINTS = {
    ANALYZE: `${API_BASE_URL}/api/analyze`,
    ANALYZE_MEAL_PLAN: `${API_BASE_URL}/api/analyze-meal-plan`,
    HEALTH: `${API_BASE_URL}/api/health`
};


/**
 * Fungsi untuk call Gemini API melalui proxy backend
 * @param {Object} requestBody - Body request dengan contents dan generationConfig
 * @param {string} type - Tipe analisis ('default' atau 'meal-plan')
 * @returns {Promise<Object>} Response dari Gemini API
 */
async function callGeminiAPI(requestBody, type = 'default') {
    const endpoint = type === 'meal-plan' 
        ? API_ENDPOINTS.ANALYZE_MEAL_PLAN 
        : API_ENDPOINTS.ANALYZE;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.error || 'API request failed');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('❌ Gemini API Call Error:', error);
        throw error;
    }
}

/**
 * Check health status backend
 * @returns {Promise<Object>} Health status
 */
async function checkBackendHealth() {
    try {
        const response = await fetch(API_ENDPOINTS.HEALTH);
        if (!response.ok) throw new Error('Backend tidak tersedia');
        return await response.json();
    } catch (error) {
        console.error('❌ Backend Health Check Failed:', error);
        return null;
    }
}

// ENVIRONMENT DETECTION

const CONFIG = {
    API_BASE_URL,
    API_ENDPOINTS,
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    IS_PRODUCTION: !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1',
    APP_NAME: 'NutriScan',
    VERSION: '1.0.0'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { callGeminiAPI, checkBackendHealth, API_ENDPOINTS, CONFIG };
}
