# 🚀 NutriScan Deployment Guide

## Arsitektur Production

```
Netlify (Frontend Static)
    ↓ (API calls)
Render.com (Backend Node.js)
    ↓ (API Key protection)
Gemini API
```

---

## 📋 Deployment Steps

### **1. Deploy Backend ke Render.com**

#### Step 1.1: Login ke Render
1. Buka https://render.com
2. Click "Sign up with GitHub"
3. Authorize dengan GitHub account Anda

#### Step 1.2: Create Web Service
1. Click "New" → "Web Service"
2. Select repository: **NutriScan**
3. Konfigurasi:
   - **Name**: `nutriscan-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

#### Step 1.3: Add Environment Variables
Di bagian "Environment", tambah:
- **Key**: `GEMINI_API_KEY`
- **Value**: `AIzaSyB8fv3baKrk2sl9rkctHa980eUK86IQ5d0` (paste actual API Key)

Dan:
- **Key**: `NODE_ENV`
- **Value**: `production`

#### Step 1.4: Deploy
1. Click "Create Web Service"
2. Tunggu sampai deployed (biasanya 2-5 menit)
3. Catat URL: `https://nutriscan-backend-xxxx.onrender.com`

---

### **2. Update Frontend Config**

Edit `js/config.js` dan ganti backend URL:

```javascript
const API_BASE_URL = isLocalhost
    ? 'http://localhost:3000'
    : 'https://nutriscan-backend-xxxx.onrender.com';  // Ganti dengan Render URL Anda
```

---

### **3. Deploy Frontend ke Netlify**

#### Step 3.1: Connect Repository
1. Buka https://netlify.com
2. Click "New site from Git"
3. Select GitHub
4. Choose repository: **NutriScan**

#### Step 3.2: Configure Deployment
- **Build command**: (leave empty, tidak ada build process)
- **Publish directory**: `.` (root folder)

#### Step 3.3: Deploy
1. Click "Deploy site"
2. Tunggu sampai deployed
3. Catat domain: `https://nutriscan-xxxxx.netlify.app`

---

## ✅ Verification

### Local Testing
```bash
npm start
# http://localhost:3000
```

### Production Testing (Netlify)
1. Buka https://nutriscan-xxxxx.netlify.app
2. Test Scanner page - upload gambar nutrisi
3. Test Meal Planner page - generate meal plan
4. Check DevTools (F12) → Network tab:
   - Request ke `/api/analyze` (Render backend)
   - ✅ **NO API Key visible** di frontend ✓

---

## 🔐 Security Checklist

- ✅ API Key di `.env` (Render environment variable)
- ✅ `.env` tidak di GitHub (protected by .gitignore)
- ✅ `.env.example` di GitHub (sebagai template)
- ✅ Frontend calls backend proxy (tidak direct Gemini API)
- ✅ API Key tidak terekspos di browser DevTools
- ✅ CORS configured di Netlify (`netlify.toml`)

---

## 🔄 Updating Code

### Local Development
```bash
npm start  # Backend di localhost:3000
# Buka http://localhost:3000 di browser
```

### Push to Production
```bash
git add .
git commit -m "Update message"
git push origin master
```

**Both Netlify dan Render akan auto-deploy dari GitHub!**

---

## 📞 Troubleshooting

### Error: "Backend not responding"
- Check Render service status: https://render.com/dashboard
- Verify GEMINI_API_KEY di Render environment variables
- Check browser console untuk error messages

### Error: "CORS error"
- Verify `netlify.toml` dengan redirect rules
- Check Render server logs

### Error: "API Key invalid"
- Verify GEMINI_API_KEY di Render (bukan .env lokal)
- Generate new API Key dari https://aistudio.google.com/app/apikeys

---

## 📊 Service Status URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend (Netlify) | https://nutriscan-xxxxx.netlify.app | Check DNS |
| Backend (Render) | https://nutriscan-backend-xxxx.onrender.com/api/health | Check Render dashboard |
| API Key (Secret) | Render environment variables | ✅ Secure |

---

## 🎯 Next Steps

1. ✅ Deploy backend ke Render
2. ✅ Update frontend config dengan Render URL
3. ✅ Deploy frontend ke Netlify
4. ✅ Test production functionality
5. ✅ Monitor performance & errors

**Production Ready!** 🚀
