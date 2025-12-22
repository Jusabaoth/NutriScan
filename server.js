/**
 * NutriScan Backend Server
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load all available API keys
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
    process.env.GEMINI_API_KEY5,
    process.env.GEMINI_API_KEY6,
    process.env.GEMINI_API_KEY7,
    process.env.GEMINI_API_KEY8,
    process.env.GEMINI_API_KEY9,
    process.env.GEMINI_API_KEY10,
].filter(key => key); // Remove undefined keys

if (API_KEYS.length === 0) {
    console.error('❌ ERROR: No GEMINI_API_KEY found in .env file');
    process.exit(1);
}

console.log(`✅ Loaded ${API_KEYS.length} API keys for rotation`);

// API key rotation helper with retry delays
async function callGeminiWithRotation(endpoint, requestBody) {
    // First pass: try all keys quickly
    for (let i = 0; i < API_KEYS.length; i++) {
        const apiKey = API_KEYS[i];
        console.log(`🔑 Trying API key ${i + 1}/${API_KEYS.length}...`);

        try {
            const response = await fetch(`${endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            // If rate limited, try next key immediately
            if (response.status === 429) {
                console.log(`⚠️ Key ${i + 1} rate limited (429), trying next...`);
                continue;
            }

            // If server overloaded, wait 2 seconds then try next
            if (response.status === 503 || response.status === 500) {
                console.log(`⚠️ Key ${i + 1} server overload (${response.status}), waiting 2s...`);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            return { response, keyIndex: i + 1 };
        } catch (error) {
            console.log(`⚠️ Key ${i + 1} error: ${error.message}, trying next...`);
            continue;
        }
    }

    // Second pass: retry with longer delays
    console.log('🔄 All keys failed, retrying with 5s delay...');
    await new Promise(r => setTimeout(r, 5000));

    for (let i = 0; i < Math.min(3, API_KEYS.length); i++) {
        const apiKey = API_KEYS[i];
        console.log(`🔁 Retry ${i + 1}/3 with key ${i + 1}...`);

        try {
            const response = await fetch(`${endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.status !== 429 && response.status !== 503 && response.status !== 500) {
                return { response, keyIndex: i + 1 };
            }

            console.log(`⚠️ Retry ${i + 1} failed (${response.status})`);
            await new Promise(r => setTimeout(r, 3000));
        } catch (error) {
            console.log(`⚠️ Retry ${i + 1} error: ${error.message}`);
        }
    }

    throw new Error('All API keys exhausted or rate limited');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// GEMINI API PROXY ENDPOINTS

/**
 * Scanner Analysis Endpoint
 * Simple and proven working endpoint
 */
app.post('/api/analyze', async (req, res) => {
    try {
        const { contents, generationConfig } = req.body;

        if (!contents) {
            return res.status(400).json({
                error: 'Contents tidak ditemukan dalam request'
            });
        }

        const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
        console.log('🔵 Server: Calling Gemini 2.0 Flash Experimental API...');

        const requestBody = {
            contents,
            generationConfig: generationConfig || {
                temperature: 0.7,
                maxOutputTokens: 32768  // Maximum tokens
            }
        };

        const { response, keyIndex } = await callGeminiWithRotation(geminiEndpoint, requestBody);
        console.log(`✅ Success with key ${keyIndex}, status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Gemini API Error Details:', JSON.stringify(errorData, null, 2));
            return res.status(response.status).json({
                error: 'Gemini API Error',
                details: errorData
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('❌ Server Error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: error.message
        });
    }
});

/**
 * Meal Plan Analysis Endpoint
 */
app.post('/api/analyze-meal-plan', async (req, res) => {
    try {
        const { contents, generationConfig } = req.body;

        if (!contents) {
            return res.status(400).json({
                error: 'Contents tidak ditemukan dalam request'
            });
        }

        const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
        console.log('🔵 Meal Plan: Calling Gemini 2.0 Flash API...');

        const requestBody = {
            contents,
            generationConfig: generationConfig || {
                temperature: 0.7,
                maxOutputTokens: 32768  // Maximum tokens for Gemini 2.0 Flash
            }
        };

        const { response, keyIndex } = await callGeminiWithRotation(geminiEndpoint, requestBody);
        console.log(`✅ Meal Plan success with key ${keyIndex}, status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Gemini API Error (Meal Plan):', errorData);
            return res.status(response.status).json({
                error: 'Gemini API Error',
                details: errorData
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('❌ Server Error (Meal Plan):', error);
        res.status(500).json({
            error: 'Server Error',
            message: error.message
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        server: 'NutriScan Backend Running',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ NutriScan Server running on http://localhost:${PORT}`);
    console.log(`📁 Static files served from: ${path.join(__dirname)}`);
    console.log(`🔐 API Key dimuat dari .env file (tersembunyi)`);
});
