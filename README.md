# 🍎 NutriScan

**AI-Powered Nutrition Analysis for Indonesian Food Products**

NutriScan adalah aplikasi web berbasis AI yang membantu Anda menganalisis label nutrisi produk makanan dan minuman dengan teknologi Google Gemini AI. Aplikasi ini menyediakan rekomendasi personal berdasarkan kondisi kesehatan Anda dan kepatuhan terhadap standar BPOM & WHO.

---

## ✨ Fitur Utama

### 📸 **Scanner Nutrisi**
- Upload atau ambil foto label gizi produk
- Analisis otomatis menggunakan Google Gemini 2.0 Flash
- Deteksi nutrisi: kalori, lemak, gula, sodium, protein, dll.
- Evaluasi kepatuhan terhadap standar BPOM & WHO
- Rekomendasi personal berdasarkan profil kesehatan

### 🏥 **Profil Kesehatan**
- Input data fisik (berat, tinggi, umur, jenis kelamin)
- Tracking kondisi kesehatan & alergi
- Perhitungan BMR (Basal Metabolic Rate)
- Perhitungan TDEE (Total Daily Energy Expenditure)
- Rekomendasi disesuaikan dengan kondisi kesehatan

### 📅 **Meal Planner**
- Buat rencana makan harian/mingguan/bulanan
- Berbagai pilihan diet (Keto, Mediterranean, DASH, dll.)
- Budget-friendly: Ekonomis, Standar, atau Premium
- AI-generated meal plans dengan Gemini 2.0 Flash
- Nutrisi seimbang sesuai kebutuhan kalori

### 📚 **Riwayat Scan**
- Simpan hasil analisis nutrisi
- Pencarian produk berdasarkan nama
- Export data untuk tracking jangka panjang

### 🌐 **Bilingual Support**
- **Bahasa Indonesia** & **English**
- Toggle bahasa real-time tanpa reload
- Semua UI dan konten AI tersedia dalam 2 bahasa

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 atau lebih baru) - [Download di sini](https://nodejs.org/)
- **Gemini API Key** - [Dapatkan gratis di sini](https://aistudio.google.com/app/apikey)

### 🔧 Instalasi

#### **Opsi 1: Menggunakan Setup Script (Recommended)**

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

Script ini akan otomatis:
- ✅ Check instalasi Node.js
- ✅ Setup file `.env`
- ✅ Install dependencies
- ✅ Validasi konfigurasi

#### **Opsi 2: Manual Setup**

1. **Clone repository:**
```bash
git clone <repository-url>
cd NutriScan
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan tambahkan API key Anda
# GEMINI_API_KEY=your_actual_api_key_here
# PORT=3000
```

4. **Jalankan server:**
```bash
npm start
```

Server akan berjalan di: **http://localhost:3000**

---

## 📁 Struktur Project

```
NutriScan/
├── index.html              # Dashboard & landing page
├── scanner.html            # Halaman scanner nutrisi
├── mealplanner.html        # Halaman meal planner
├── history.html            # Halaman riwayat scan
├── server.js               # Express server & Gemini API proxy
├── setup.ps1               # Script setup otomatis (Windows)
├── package.json            # Dependencies & scripts
├── .env                    # Environment variables (tidak di-commit)
├── .env.example            # Template environment variables
│
├── js/
│   ├── scanner.js          # Logic scanner & AI analysis
│   ├── mealplanner.js      # Logic meal planner & AI generation
│   ├── language_dictionary.js  # Bilingual translations (ID/EN)
│   ├── auth_components.js  # Authentication components
│   └── config.js           # Konfigurasi API & constants
│
└── ts/                     # TypeScript configurations (opsional)
```

---

## ⚙️ Konfigurasi

### Environment Variables

File `.env` harus berisi:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### Mendapatkan Gemini API Key

1. Kunjungi [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Login dengan Google Account
3. Klik **"Get API Key"**
4. Copy API key dan paste ke `.env`

**⚠️ PENTING:** Jangan commit file `.env` ke Git! File ini sudah ada di `.gitignore`.

---

## 🎯 Cara Penggunaan

### 1️⃣ Setup Profil Kesehatan
- Klik tombol **"Setup Profil Kesehatan"** di dashboard
- Isi data fisik (berat, tinggi, umur, jenis kelamin, aktivitas)
- Pilih kondisi kesehatan & alergi makanan (opsional)
- Simpan profil

### 2️⃣ Scan Label Nutrisi
- Buka halaman **Scanner**
- Upload foto label gizi atau ambil foto langsung
- Klik **"Analisis dengan AI"**
- Tunggu hasil analisis dengan rekomendasi personal
- Simpan ke history untuk tracking

### 3️⃣ Buat Meal Plan
- Buka halaman **Meal Planner**
- Pilih tujuan diet (penurunan berat badan, muscle gain, dll.)
- Tentukan durasi (1 minggu - 1 tahun)
- Pilih budget harian
- Klik **"Analisis dengan AI"**
- AI akan generate meal plan personal untuk Anda

### 4️⃣ Review History
- Buka halaman **History**
- Lihat semua hasil scan sebelumnya
- Search produk berdasarkan nama
- Hapus history jika diperlukan

---

## 🛠️ Development

### Menjalankan dalam Development Mode

```bash
npm run dev
```

Development mode menggunakan `nodemon` untuk auto-restart server saat ada perubahan code.

### Testing

Server berjalan di `http://localhost:3000` dengan endpoints:

- `GET /` - Serve static files
- `POST /api/gemini` - Proxy untuk Gemini API (mengamankan API key)

---

## 🌟 Teknologi yang Digunakan

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **AI:** Google Gemini 2.0 Flash API
- **Storage:** Browser LocalStorage
- **Styling:** Custom CSS dengan gradients & animations

---

## 📊 Standar Nutrisi

NutriScan menggunakan standar dari:
- **BPOM** (Badan Pengawas Obat dan Makanan Indonesia)
- **WHO** (World Health Organization)

Aplikasi akan memberikan peringatan jika produk melebihi batasan yang direkomendasikan.

---

## 🔒 Keamanan & Privacy

- ✅ API Key disimpan di server-side (`.env`)
- ✅ Data profil kesehatan tersimpan lokal di browser
- ✅ Tidak ada data dikirim ke server eksternal selain Gemini API
- ✅ CORS protection enabled

---

## 🐛 Troubleshooting

### Server tidak bisa start
- Pastikan port 3000 tidak digunakan aplikasi lain
- Check file `.env` sudah dikonfigurasi dengan benar
- Jalankan `npm install` ulang

### API Error / Analisis gagal
- Verifikasi `GEMINI_API_KEY` di `.env` masih valid
- Check koneksi internet
- Gemini API mungkin sedang down, coba lagi nanti

### Browser LocalStorage penuh
- Hapus beberapa history lama di halaman History
- Clear browser cache jika diperlukan

---

## 📝 License

ISC License

---

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 🙏 Acknowledgments

- Google Gemini AI untuk analisis nutrisi
- BPOM & WHO untuk standar nutrisi
- Community untuk feedback & testing

---

**Made with ❤️ for healthier Indonesia**
