// ENVIRONMENT DETECTION
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// CONFIGURATION (Supabase disabled, using Vercel serverless backend)

// AUTH FLOW CONFIGURATION (shared across all pages)
// Read from localStorage first (set by Index.html), fallback to window or default true
const storedAuthFlow = localStorage.getItem('nutriscan_enable_auth_flow');
const ENABLE_AUTH_FLOW = storedAuthFlow !== null
    ? storedAuthFlow === 'true'
    : (window.ENABLE_AUTH_FLOW !== undefined ? window.ENABLE_AUTH_FLOW : true);

const API_ENDPOINTS = {
    ANALYZE: '/api/analyze',
    ANALYZE_MEAL_PLAN: '/api/analyze-meal-plan',
    HEALTH: '/api/health'
};

/**
 * Fungsi untuk call Gemini API
 * Hybrid: Local Express OR Remote Supabase
 */

let _apiCallCounter = 0;

async function callGeminiAPI(requestBody, type = 'default') {
    _apiCallCounter++;
    const callId = _apiCallCounter;

    console.log(`📡 API CALL #${callId} - Type: ${type}`);

    const endpoint = type === 'meal-plan'
        ? API_ENDPOINTS.ANALYZE_MEAL_PLAN
        : API_ENDPOINTS.ANALYZE;

    // Headers configuration
    const headers = {
        'Content-Type': 'application/json',
    };

    // No Supabase Auth headers needed for Vercel backend

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ API CALL #${callId} Error Response:`, errorData);
            throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ API CALL #${callId} successful`);
        return data;

    } catch (error) {
        console.error(`❌ API CALL #${callId} Error:`, error.message);
        throw error;
    }
}

async function checkBackendHealth() {
    if (isLocalhost) {
        try {
            const response = await fetch(API_ENDPOINTS.HEALTH);
            return await response.json();
        } catch (e) {
            return null;
        }
    }
    return { status: 'Serverless Ready' };
}

// ENVIRONMENT DETECTION

const CONFIG = {
    API_ENDPOINTS,
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    IS_PRODUCTION: !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1',
    APP_NAME: 'NutriScan',
    VERSION: '1.0.0'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { callGeminiAPI, checkBackendHealth, API_ENDPOINTS, CONFIG };
}
