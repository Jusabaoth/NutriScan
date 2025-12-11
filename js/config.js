// ENVIRONMENT DETECTION
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// CONFIGURATION
const SUPABASE_PROJECT_URL = window.SUPABASE_PROJECT_URL || 'https://zclpywientjorspzzybk.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbHB5d2llbnRqb3JzcHp6eWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjYwNTYsImV4cCI6MjA4MDk0MjA1Nn0.0AgBqMwm2lZjjiiLdyPqGWFmZrh5XVIx3pJ_hIuH8dE';

const API_ENDPOINTS = {
    // If localhost, use local Express server (server.js). If production, use Supabase Edge Functions.
    ANALYZE: isLocalhost
        ? 'http://localhost:3000/api/analyze'
        : `${SUPABASE_PROJECT_URL}/functions/v1/analyze`,

    ANALYZE_MEAL_PLAN: isLocalhost
        ? 'http://localhost:3000/api/analyze-meal-plan'
        : `${SUPABASE_PROJECT_URL}/functions/v1/analyze-meal-plan`,

    HEALTH: isLocalhost
        ? 'http://localhost:3000/api/health'
        : `${SUPABASE_PROJECT_URL}/functions/v1/health`
};

/**
 * Fungsi untuk call Gemini API
 * Hybrid: Local Express OR Remote Supabase
 */
async function callGeminiAPI(requestBody, type = 'default') {
    const endpoint = type === 'meal-plan'
        ? API_ENDPOINTS.ANALYZE_MEAL_PLAN
        : API_ENDPOINTS.ANALYZE;

    console.log('🔵 callGeminiAPI: Starting...');
    console.log('🔵 Endpoint:', endpoint);
    console.log('🔵 Type:', type);
    console.log('🔵 Is Localhost:', isLocalhost);

    // Headers configuration
    const headers = {
        'Content-Type': 'application/json',
    };

    // Only add Supabase Auth header if NOT localhost
    if (!isLocalhost) {
        headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    console.log('🔵 Headers:', headers);
    console.log('🔵 Request body size:', JSON.stringify(requestBody).length, 'bytes');

    try {
        console.log('🔵 Sending fetch request...');
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        console.log('🔵 Response status:', response.status);
        console.log('🔵 Response ok:', response.ok);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error Response:', errorData);
            throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ API Success! Response keys:', Object.keys(data));
        return data;

    } catch (error) {
        console.error('❌ API Call Error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
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
