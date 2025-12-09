# GitHub Secrets Setup Guide 🔐

Panduan mengatur GitHub Secrets untuk deploy aman tanpa expose API Key.

## 📋 Persiapan

Pastikan kamu punya:
- ✅ GitHub account dengan repo NutriScan
- ✅ Render account (untuk backend deploy)
- ✅ Valid Google Gemini API Key

## 🔧 Step 1: Setup Repository Secrets

### Di GitHub Web UI:

1. **Buka Repository Settings:**
   ```
   https://github.com/Jusabaoth/NutriScan/settings/secrets/actions
   ```

2. **Klik "New repository secret"**

3. **Tambah Secret #1 - GEMINI_API_KEY:**
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyDfWWLcuLJq7MocoL9QWU7gWpA5sEITUho` (paste API Key kamu)
   - Click **Add secret** ✅

4. **Tambah Secret #2 - RENDER_DEPLOY_HOOK:** (Optional, untuk auto-deploy)
   - **Name:** `RENDER_DEPLOY_HOOK`
   - **Value:** Webhook URL dari Render (lihat Render dashboard)
   - Click **Add secret** ✅

## 🎯 Step 2: Cara Kerja GitHub Secrets

```
┌─────────────────────────────────────────────────┐
│         GitHub Repository                       │
│  ┌───────────────────────────────────────────┐  │
│  │  Source Code (Public)                     │  │
│  │  - server.js                              │  │
│  │  - js/scanner.js                          │  │
│  │  - .github/workflows/deploy.yml           │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Secrets (Private/Encrypted)              │  │
│  │  - GEMINI_API_KEY ****                    │  │
│  │  - RENDER_DEPLOY_HOOK ****                │  │
│  └───────────────────────────────────────────┘  │
│                    ↓                             │
│  GitHub Actions (CI/CD)                        │
│  - Baca secret saat build                      │
│  - Inject ke environment variable              │
│  - Pass ke Render deployment                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

## 🚀 Step 3: Deploy Flow

### Saat push ke `master` branch:

```
1. Push ke GitHub
   ↓
2. GitHub Actions trigger
   ↓
3. Baca GEMINI_API_KEY dari Secrets
   ↓
4. Validasi API Key exists
   ↓
5. Deploy ke Render (via webhook)
   ↓
6. Render set env variable GEMINI_API_KEY
   ↓
7. Server run dengan API Key aman
```

## 🔍 Step 4: Verify Secrets di GitHub Actions

Setelah push, lihat workflow:

1. Go to: `https://github.com/Jusabaoth/NutriScan/actions`
2. Klik workflow run terbaru
3. Lihat log untuk verify:
   ```
   ✅ API Key secret found and validated
   ```

## ⚙️ Step 5: Setup di Render (Untuk Production)

Setelah backend deploy ke Render:

1. Go to: **Render Dashboard → Your Service**
2. Click **Environment** tab
3. Add new variable:
   ```
   Key: GEMINI_API_KEY
   Value: AIzaSyDfWWLcuLJq7MocoL9QWU7gWpA5sEITUho
   ```
4. Click **Save**

Server sekarang dapat API Key dari:
- **Local development:** `.env` file
- **GitHub Actions:** GitHub Secrets
- **Render production:** Render Environment variables

## 🔒 Security Best Practices

✅ **DO:**
- Store sensitive values in Secrets
- Use different keys per environment (dev/staging/prod)
- Rotate API Key regularly
- Log when secret is used (tidak log value-nya)

❌ **DON'T:**
- Commit `.env` dengan API Key asli
- Log secret values
- Hardcode API Key di code
- Share secrets via Slack/email

## 📝 Checklists

### Local Development Setup:
- [ ] Create `.env` file locally
- [ ] Set `GEMINI_API_KEY` di `.env`
- [ ] Run `npm install`
- [ ] Test dengan `npm start`
- [ ] `.env` di `.gitignore` (jangan push)

### GitHub Setup:
- [ ] Go to Settings → Secrets
- [ ] Create `GEMINI_API_KEY` secret
- [ ] Create `RENDER_DEPLOY_HOOK` secret (optional)
- [ ] Push code ke master
- [ ] Check GitHub Actions workflow success

### Render Production Setup:
- [ ] Go to Render Dashboard
- [ ] Add `GEMINI_API_KEY` environment variable
- [ ] Trigger deploy
- [ ] Test endpoint `/health`

## 🐛 Troubleshooting

### Problem: "GEMINI_API_KEY secret not found!"

**Solution:**
1. Go to Settings → Secrets
2. Verify `GEMINI_API_KEY` exists
3. Check name spelling (case-sensitive)
4. Re-add if needed

### Problem: GitHub Actions can't access secret

**Solution:**
1. Verify repo is public or private (secrets work with both)
2. Check branch is `master` (atau sesuai branch di workflow)
3. Re-run workflow from Actions tab

### Problem: Server still fails on Render

**Solution:**
1. Check Render Environment variables set
2. Check server.js reading from `process.env.GEMINI_API_KEY`
3. Check API Key is valid (try di local `.env`)
4. View Render logs untuk error message

## 📚 Links

- **GitHub Secrets Docs:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Render Environment Vars:** https://render.com/docs/environment-variables
- **GitHub Actions Docs:** https://docs.github.com/en/actions

---

**Setup selesai! 🎉** API Key kamu aman terenkripsi di GitHub dan hanya accessible saat CI/CD atau via Render environment.
