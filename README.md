# NutriScan - Secure Backend Setup Guide

## 🔒 Security Implementation

API Key Gemini telah diamankan dengan:
- ✅ API Key dipindahkan dari frontend ke backend (`.env`)
- ✅ Frontend menggunakan proxy API untuk komunikasi dengan Gemini
- ✅ API Key tidak terekspos di kode frontend atau browser DevTools
- ✅ `.env` file ditambahkan ke `.gitignore` agar tidak ter-commit

---

## 📋 Prerequisites

Pastikan Anda sudah install:
- **Node.js** >= 14.x (Download dari https://nodejs.org/)
- **npm** (Biasanya sudah termasuk dengan Node.js)

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies

Buka terminal/PowerShell di folder project dan jalankan:

```bash
npm install
```

Ini akan install semua packages yang diperlukan:
- `express` - Web framework
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variable management
- `node-fetch` - HTTP client

### Step 2: Verify `.env` File

File `.env` sudah ada dengan struktur:

```env
# NutriScan Environment Variables
GEMINI_API_KEY=AIzaSyB8fv3baKrk2sl9rkctHa980eUK86IQ5d0
```

⚠️ **PENTING**: Jangan commit `.env` ke repository. File sudah ada di `.gitignore`.

### Step 3: Start Backend Server

Jalankan server dengan:

```bash
npm start
```

Atau untuk development mode dengan auto-reload:

```bash
npm run dev
```

Expected output:
```
✅ NutriScan Server running on http://localhost:3000
📁 Static files served from: d:\NutriScan
🔐 API Key dimuat dari .env file (tersembunyi)
```

---

## 🌐 Frontend Configuration

Frontend sudah dikonfigurasi di `js/config.js` untuk menggunakan proxy:

- **Development**: `http://localhost:3000/api/analyze`
- **Production**: `/api/analyze` (sama domain)

Tidak perlu mengubah apapun di file ini.

---

## 📡 API Endpoints

### 1. POST `/api/analyze`
Untuk scan nutrisi label dengan Gemini 2.5-Flash

**Request Body:**
```json
{
  "contents": [{
    "parts": [
      { "text": "prompt text" },
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "base64_encoded_image"
        }
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 8000
  }
}
```

**Response:** Gemini API response (JSON parsing hasil analisis)

---

### 2. POST `/api/analyze-meal-plan`
Untuk generate meal plan dengan Gemini 1.5-Flash

**Request Body:**
```json
{
  "contents": [{
    "parts": [{ "text": "prompt text" }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 8000
  }
}
```

**Response:** Gemini API response (meal plan JSON)

---

### 3. GET `/api/health`
Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "server": "NutriScan Backend Running",
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

---

## 📁 Project Structure

```
d:\NutriScan\
├── .env                    # ⭐ Environment variables (JANGAN commit!)
├── .gitignore             # Git ignore rules
├── package.json           # Node.js dependencies
├── server.js              # ⭐ Backend server (NEW)
├── Index.html             # Frontend
├── scanner.html           # Scanner page
├── mealplanner.html       # Meal planner page
└── js/
    ├── config.js          # ⭐ API config untuk frontend (NEW)
    ├── scanner.js         # Scanner logic (UPDATED)
    └── mealplanner.js     # Meal planner logic (UPDATED)
```

---

## 🔧 Configuration Files

### server.js
- Main backend server
- Handles API proxy untuk Gemini
- Serves static files (frontend)

### js/config.js
- Frontend configuration
- Mendefinisikan API endpoints
- Export function `callGeminiAPI()` untuk digunakan di scanner.js & mealplanner.js

### .env
```env
# Gemini API Key (RAHASIA - jangan commit!)
GEMINI_API_KEY=AIzaSyB8fv3baKrk2sl9rkctHa980eUK86IQ5d0

# Port server (optional)
PORT=3000
```

---

## 🔄 How It Works

```
Frontend (scanner.html)
    ↓
js/config.js (callGeminiAPI)
    ↓
HTTP POST to http://localhost:3000/api/analyze
    ↓
server.js (Express Proxy)
    ↓
Membaca GEMINI_API_KEY dari .env
    ↓
POST ke Gemini API dengan API Key
    ↓
Response kembali ke Frontend
```

---

## 🚨 Troubleshooting

### Error: "GEMINI_API_KEY tidak ditemukan"
**Solusi:** Pastikan `.env` file ada di root folder dan berisi `GEMINI_API_KEY`

### Error: "Cannot find module 'express'"
**Solusi:** Jalankan `npm install` untuk install dependencies

### CORS Error saat Frontend call API
**Solusi:** Pastikan `server.js` running di `http://localhost:3000` dan CORS middleware sudah aktif

### Frontend tidak bisa connect ke backend
**Solusi:** 
1. Pastikan backend running: `npm start`
2. Check browser console untuk error message
3. Pastikan port 3000 tidak digunakan program lain

---

## 🛡️ Security Best Practices

✅ **Sudah Diimplementasikan:**
- API Key di `.env` (tersembunyi dari public)
- Proxy backend untuk handle API Key
- CORS enabled untuk komunikasi cross-origin
- Error handling untuk API failures

⚠️ **Untuk Production:**
- Use environment-specific `.env` files (`.env.production`)
- Enable HTTPS/SSL
- Add rate limiting untuk prevent abuse
- Use API authentication tokens
- Add input validation/sanitization
- Monitor API usage dan errors

---

## 📊 Monitoring & Logs

Server menampilkan logs:
```
✅ NutriScan Server running on http://localhost:3000
📁 Static files served from: d:\NutriScan
🔐 API Key dimuat dari .env file (tersembunyi)
```

Error logs akan ditampilkan dengan prefix `❌`:
```
❌ ERROR: GEMINI_API_KEY tidak ditemukan di .env file
❌ Gemini API Error: {...}
❌ Server Error: {...}
```

---

## 📝 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start server: `npm start`
3. ✅ Open browser: `http://localhost:3000`
4. ✅ Test scanner & meal planner functionality
5. ✅ Check browser DevTools - API Key tidak terlihat ✓

---

## 📞 Support

Jika ada masalah:
1. Check `.env` file sudah setup dengan benar
2. Verify Node.js terinstall: `node --version`
3. Check backend logs di terminal
4. Check browser console untuk client-side errors
5. Pastikan port 3000 tersedia

---

**Status**: ✅ API Key Security Implemented
**Last Updated**: December 9, 2025
