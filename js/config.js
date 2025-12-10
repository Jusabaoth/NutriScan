// API CONFIGURATION (SUPABASE)

/**
 * Konfigurasi Supabase
 * Ganti nilai di bawah ini dengan Project URL dan Anon Key dari Dashboard Supabase Anda.
 * Menu: Project Settings -> API
 */
const SUPABASE_PROJECT_URL = window.SUPABASE_PROJECT_URL || 'https://zclpywientjorspzzybk.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbHB5d2llbnRqb3JzcHp6eWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjYwNTYsImV4cCI6MjA4MDk0MjA1Nn0.0AgBqMwm2lZjjiiLdyPqGWFmZrh5XVIx3pJ_hIuH8dE';

const API_ENDPOINTS = {
    // Direct link to Edge Functions
    ANALYZE: `${SUPABASE_PROJECT_URL}/functions/v1/analyze`,
    ANALYZE_MEAL_PLAN: `${SUPABASE_PROJECT_URL}/functions/v1/analyze-meal-plan`,
    HEALTH: `${SUPABASE_PROJECT_URL}/functions/v1/health`
};

/**
 * Fungsi untuk call Gemini API melalui Supabase Edge Functions
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
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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
        console.error('❌ Supabase Function Call Error:', error);
        throw error;
    }
}

/**
 * Check health status (Serverless version)
 * @returns {Promise<Object>} Health status
 */
async function checkBackendHealth() {
    // For serverless, no need to perform explicit health check on load
    return { status: 'Serverless Ready' };
}

// ENVIRONMENT DETECTION

const CONFIG = {
    SUPABASE_PROJECT_URL,
    API_ENDPOINTS,
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    IS_PRODUCTION: !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1',
    APP_NAME: 'NutriScan',
    VERSION: '1.0.0'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { callGeminiAPI, checkBackendHealth, API_ENDPOINTS, CONFIG };
}
