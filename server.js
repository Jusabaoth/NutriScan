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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY tidak ditemukan di .env file');
    process.exit(1);
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

        const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

        console.log('🔵 Server: Calling Gemini API...');
        console.log('🔵 Endpoint:', geminiEndpoint);
        console.log('🔵 API Key exists:', !!GEMINI_API_KEY);
        console.log('🔵 API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);

        const response = await fetch(`${geminiEndpoint}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                generationConfig: generationConfig || {
                    temperature: 0.7,
                    maxOutputTokens: 8000
                }
            })
        });

        console.log('🔵 Gemini Response Status:', response.status);
        console.log('🔵 Gemini Response OK:', response.ok);

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

        const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

        const response = await fetch(`${geminiEndpoint}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                generationConfig: generationConfig || {
                    temperature: 0.3,
                    maxOutputTokens: 2000
                }
            })
        });

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
